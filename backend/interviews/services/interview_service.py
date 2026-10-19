"""
Interview Service — orchestrates the full interview workflow.

Responsibilities:
- Session state management (setup → in_progress → completed)
- Question generation (AI or fallback)
- Answer submission and evaluation
- Follow-up question generation
- Session completion and score computation
"""

import logging

from django.db import IntegrityError
from django.utils import timezone

from interviews.models import (
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
    InterviewEvaluation,
)
from interviews.services.gemini_service import (
    generate_questions,
    evaluate_answer,
    generate_follow_up_question,
)
from interviews.services.question_bank_service import get_fallback_questions

logger = logging.getLogger(__name__)


class InterviewServiceError(Exception):
    """Base exception for interview service errors."""
    pass


class InvalidStateError(InterviewServiceError):
    """Raised when an operation is attempted on a session in an invalid state."""
    pass


class DuplicateAnswerError(InterviewServiceError):
    """Raised when attempting to answer an already-answered question."""
    pass


# ─── Session Operations ───

def start_session(session, user_skills=''):
    """
    Transition a session from 'setup' to 'in_progress' by generating questions.

    Args:
        session: InterviewSession instance in 'setup' status
        user_skills: Comma-separated skills string from the user profile

    Returns:
        The first InterviewQuestion instance.

    Raises:
        InvalidStateError: If session is not in 'setup' status.
    """
    if session.status != 'setup':
        raise InvalidStateError(
            f"Cannot start session. Current status is '{session.get_status_display()}'. "
            f"Only sessions in 'Setup' status can be started."
        )

    # If resume interview, retrieve resume context
    resume_data = None
    resume = session.resume
    if not resume and session.interview_type == 'resume':
        resume = session.user.resumes.filter(is_active=True).first()
        if resume:
            session.resume = resume
            session.save(update_fields=['resume'])

    if resume:
        resume_data = {
            'candidate_name': resume.candidate_name,
            'target_role': resume.target_role,
            'summary': resume.summary,
            'skills': resume.skills,
            'experience': resume.experience,
            'projects': resume.projects,
            'education': resume.education,
            'certifications': resume.certifications,
            'raw_text': resume.raw_text,
        }
        if not user_skills and resume.skills:
            user_skills = ', '.join(resume.skills) if isinstance(resume.skills, list) else str(resume.skills)

    # Generate questions via Gemini
    ai_questions = generate_questions(
        interview_type=session.interview_type,
        job_role=session.job_role,
        difficulty=session.difficulty,
        num_questions=session.total_questions,
        user_skills=user_skills,
        resume_data=resume_data,
    )

    is_ai = ai_questions is not None
    if ai_questions is None:
        # Fallback to question bank
        logger.info(
            'Using fallback question bank for session %d (Gemini unavailable)',
            session.pk,
        )
        ai_questions = get_fallback_questions(
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            num_questions=session.total_questions,
            job_role=session.job_role,
        )

    if not ai_questions:
        raise InterviewServiceError(
            'Failed to generate questions. Neither AI nor the fallback bank '
            'produced questions. Please try again later.'
        )

    # Adjust total_questions if fewer questions were generated
    actual_count = min(len(ai_questions), session.total_questions)

    # Create question records
    question_objects = []
    for i, q_text in enumerate(ai_questions[:actual_count]):
        question_objects.append(
            InterviewQuestion(
                session=session,
                question_text=q_text,
                question_order=i,
                is_follow_up=False,
                source='ai_generated' if is_ai else 'fallback_bank',
            )
        )
    InterviewQuestion.objects.bulk_create(question_objects)

    # Update session state
    session.status = 'in_progress'
    session.is_ai_generated = is_ai
    session.total_questions = actual_count
    session.current_question_index = 0
    session.save(update_fields=[
        'status', 'is_ai_generated', 'total_questions',
        'current_question_index', 'updated_at',
    ])

    return session.questions.order_by('question_order').first()


def get_current_question(session):
    """
    Get the current unanswered question in the session.

    Returns:
        InterviewQuestion instance, or None if all answered.
    """
    if session.status != 'in_progress':
        return None

    return session.questions.filter(
        question_order=session.current_question_index,
    ).first()


def submit_answer(session, answer_text):
    """
    Submit an answer for the current question, evaluate it, and optionally
    generate a follow-up question.

    Args:
        session: InterviewSession in 'in_progress' status
        answer_text: The candidate's answer text

    Returns:
        A dict with:
        - 'answer': InterviewAnswer
        - 'evaluation': InterviewEvaluation or None
        - 'next_question': InterviewQuestion or None
        - 'is_session_complete': bool

    Raises:
        InvalidStateError: If session is not in 'in_progress' status.
        DuplicateAnswerError: If the current question already has an answer.
    """
    if session.status != 'in_progress':
        raise InvalidStateError(
            f"Cannot submit answers. Session status is "
            f"'{session.get_status_display()}'."
        )

    # Get current question
    current_question = session.questions.filter(
        question_order=session.current_question_index,
    ).first()

    if current_question is None:
        raise InterviewServiceError('No question found at the current index.')

    # Prevent duplicate answers (DB constraint will also enforce this)
    if hasattr(current_question, 'answer') and current_question.answer is not None:
        try:
            # Check if it actually exists
            _ = current_question.answer.pk
            raise DuplicateAnswerError(
                f'Question {current_question.question_order + 1} has already been answered.'
            )
        except InterviewAnswer.DoesNotExist:
            pass

    # Create answer
    try:
        answer = InterviewAnswer.objects.create(
            question=current_question,
            answer_text=answer_text,
        )
    except IntegrityError:
        raise DuplicateAnswerError(
            f'Question {current_question.question_order + 1} has already been answered.'
        )

    # Evaluate the answer via Gemini
    evaluation = None
    eval_result = evaluate_answer(
        question_text=current_question.question_text,
        answer_text=answer_text,
        job_role=session.job_role,
        interview_type=session.interview_type,
    )

    if eval_result is not None:
        evaluation = InterviewEvaluation.objects.create(
            answer=answer,
            knowledge_score=eval_result['knowledge_score'],
            relevance_score=eval_result['relevance_score'],
            completeness_score=eval_result['completeness_score'],
            communication_score=eval_result['communication_score'],
            overall_score=eval_result['overall_score'],
            strengths=eval_result.get('strengths', []),
            weaknesses=eval_result.get('weaknesses', []),
            suggestions=eval_result.get('suggestions', []),
            feedback_text=eval_result.get('feedback_text', ''),
            is_ai_evaluated=True,
        )
    else:
        # Create a placeholder evaluation indicating AI was unavailable
        logger.warning(
            'AI evaluation unavailable for session %d, question %d',
            session.pk, current_question.question_order,
        )

    # Determine if this is the last question
    next_index = session.current_question_index + 1
    is_complete = next_index >= session.total_questions

    next_question = None
    if not is_complete:
        # Try to generate a follow-up question
        follow_up_text = generate_follow_up_question(
            previous_question=current_question.question_text,
            previous_answer=answer_text,
            job_role=session.job_role,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
        )

        if follow_up_text:
            # Replace the next question with the follow-up
            existing_next = session.questions.filter(question_order=next_index).first()
            if existing_next and not hasattr(existing_next, 'answer'):
                try:
                    _ = existing_next.answer.pk
                except (InterviewAnswer.DoesNotExist, AttributeError):
                    # Safe to replace — question hasn't been answered yet
                    existing_next.question_text = follow_up_text
                    existing_next.is_follow_up = True
                    existing_next.source = 'ai_generated'
                    existing_next.save(update_fields=[
                        'question_text', 'is_follow_up', 'source',
                    ])

        # Advance the session
        session.current_question_index = next_index
        session.save(update_fields=['current_question_index', 'updated_at'])

        next_question = session.questions.filter(
            question_order=next_index,
        ).first()

    return {
        'answer': answer,
        'evaluation': evaluation,
        'next_question': next_question,
        'is_session_complete': is_complete,
    }


def complete_session(session):
    """
    Complete the interview session and compute the overall score.

    Args:
        session: InterviewSession in 'in_progress' status

    Returns:
        The updated InterviewSession.

    Raises:
        InvalidStateError: If session is not in 'in_progress' status.
    """
    if session.status != 'in_progress':
        raise InvalidStateError(
            f"Cannot complete session. Current status is "
            f"'{session.get_status_display()}'."
        )

    # Compute overall score from all evaluations
    evaluations = InterviewEvaluation.objects.filter(
        answer__question__session=session,
    )

    if evaluations.exists():
        total_score = sum(e.overall_score for e in evaluations)
        session.overall_score = round(total_score / evaluations.count(), 2)
    else:
        session.overall_score = None

    session.status = 'completed'
    session.completed_at = timezone.now()
    session.save(update_fields=[
        'status', 'overall_score', 'completed_at', 'updated_at',
    ])

    return session


def get_session_report(session):
    """
    Build a comprehensive report for a completed (or in-progress) session.

    Returns a dict with session info, per-question evaluations, and aggregated scores.
    """
    questions = session.questions.order_by('question_order').select_related(
        'answer', 'answer__evaluation',
    )

    question_reports = []
    all_scores = {'knowledge': [], 'relevance': [], 'completeness': [], 'communication': []}
    all_strengths = []
    all_weaknesses = []
    all_suggestions = []

    for q in questions:
        q_report = {
            'id': q.pk,
            'question_text': q.question_text,
            'question_order': q.question_order,
            'is_follow_up': q.is_follow_up,
            'source': q.source,
        }

        try:
            answer = q.answer
            q_report['answer'] = {
                'id': answer.pk,
                'answer_text': answer.answer_text,
                'submitted_at': answer.submitted_at.isoformat(),
            }

            try:
                evaluation = answer.evaluation
                q_report['evaluation'] = {
                    'knowledge_score': evaluation.knowledge_score,
                    'relevance_score': evaluation.relevance_score,
                    'completeness_score': evaluation.completeness_score,
                    'communication_score': evaluation.communication_score,
                    'overall_score': evaluation.overall_score,
                    'strengths': evaluation.strengths,
                    'weaknesses': evaluation.weaknesses,
                    'suggestions': evaluation.suggestions,
                    'feedback_text': evaluation.feedback_text,
                    'is_ai_evaluated': evaluation.is_ai_evaluated,
                }

                all_scores['knowledge'].append(evaluation.knowledge_score)
                all_scores['relevance'].append(evaluation.relevance_score)
                all_scores['completeness'].append(evaluation.completeness_score)
                all_scores['communication'].append(evaluation.communication_score)
                all_strengths.extend(evaluation.strengths or [])
                all_weaknesses.extend(evaluation.weaknesses or [])
                all_suggestions.extend(evaluation.suggestions or [])

            except InterviewEvaluation.DoesNotExist:
                q_report['evaluation'] = None

        except InterviewAnswer.DoesNotExist:
            q_report['answer'] = None
            q_report['evaluation'] = None

        question_reports.append(q_report)

    # Compute aggregated scores
    score_breakdown = {}
    for key, scores in all_scores.items():
        score_breakdown[key] = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        'session': {
            'id': session.pk,
            'interview_type': session.interview_type,
            'interview_type_display': session.get_interview_type_display(),
            'job_role': session.job_role,
            'difficulty': session.difficulty,
            'difficulty_display': session.get_difficulty_display(),
            'total_questions': session.total_questions,
            'status': session.status,
            'status_display': session.get_status_display(),
            'overall_score': session.overall_score,
            'is_ai_generated': session.is_ai_generated,
            'created_at': session.created_at.isoformat(),
            'completed_at': session.completed_at.isoformat() if session.completed_at else None,
        },
        'questions': question_reports,
        'overall_score': session.overall_score,
        'total_questions_answered': len([q for q in question_reports if q.get('answer')]),
        'score_breakdown': score_breakdown,
        'aggregate_strengths': list(set(all_strengths))[:10],
        'aggregate_weaknesses': list(set(all_weaknesses))[:10],
        'aggregate_suggestions': list(set(all_suggestions))[:10],
    }


def get_user_dashboard_analytics(user):
    """
    Compute real-time dashboard analytics for a given user from persisted records.
    """
    now = timezone.now()
    week_ago = now - timezone.timedelta(days=7)

    sessions = InterviewSession.objects.filter(user=user).order_by('-created_at')
    total_interviews = sessions.count()

    completed_sessions = [s for s in sessions if s.status == 'completed']
    completed_count = len(completed_sessions)
    in_progress_count = len([s for s in sessions if s.status == 'in_progress'])

    scores = [s.overall_score for s in completed_sessions if s.overall_score is not None]
    average_score = round(sum(scores) / len(scores), 1) if scores else 0

    interviews_this_week = sessions.filter(created_at__gte=week_ago).count()
    completed_this_week = [s for s in completed_sessions if s.completed_at and s.completed_at >= week_ago]
    scores_this_week = [s.overall_score for s in completed_this_week if s.overall_score is not None]
    avg_score_this_week = round(sum(scores_this_week) / len(scores_this_week), 1) if scores_this_week else average_score

    total_questions_answered = InterviewAnswer.objects.filter(
        question__session__user=user,
    ).count()

    # Practice time estimation (~2.5 minutes per answered question)
    est_hours = round((total_questions_answered * 2.5) / 60.0, 1)
    practice_time_str = f"{est_hours} hrs" if est_hours >= 1 else f"{int(total_questions_answered * 2.5)} mins"

    # Completion percentage
    completion_rate = round((completed_count / total_interviews) * 100) if total_interviews > 0 else 0

    # Category Breakdown
    category_meta = {
        'technical': {'name': 'Technical', 'color': '#4F46E5'},
        'behavioral': {'name': 'Behavioral', 'color': '#06b6d4'},
        'hr': {'name': 'HR Round', 'color': '#f59e0b'},
        'managerial': {'name': 'Managerial', 'color': '#16a34a'},
        'resume': {'name': 'Resume-Based', 'color': '#8b5cf6'},
    }
    category_breakdown = []
    for cat_key, meta in category_meta.items():
        cat_sessions = [s for s in completed_sessions if s.interview_type == cat_key]
        cat_scores = [s.overall_score for s in cat_sessions if s.overall_score is not None]
        cat_avg = round(sum(cat_scores) / len(cat_scores), 1) if cat_scores else 0
        cat_count = len(cat_sessions)
        category_breakdown.append({
            'name': meta['name'],
            'type': cat_key,
            'value': int(cat_avg),
            'count': cat_count,
            'color': meta['color'],
        })

    # Performance Criteria from all evaluations
    evaluations = InterviewEvaluation.objects.filter(answer__question__session__user=user)
    eval_count = evaluations.count()

    if eval_count > 0:
        avg_knowledge = round(sum(e.knowledge_score for e in evaluations) / eval_count, 1)
        avg_relevance = round(sum(e.relevance_score for e in evaluations) / eval_count, 1)
        avg_completeness = round(sum(e.completeness_score for e in evaluations) / eval_count, 1)
        avg_communication = round(sum(e.communication_score for e in evaluations) / eval_count, 1)

        all_strengths = []
        all_improvements = []
        for e in evaluations:
            all_strengths.extend(e.strengths or [])
            all_improvements.extend(e.suggestions or e.weaknesses or [])

        # Deduplicate while preserving order
        strengths = list(dict.fromkeys([s.strip() for s in all_strengths if s.strip()]))[:3]
        areas_to_improve = list(dict.fromkeys([s.strip() for s in all_improvements if s.strip()]))[:3]
    else:
        avg_knowledge = 0
        avg_relevance = 0
        avg_completeness = 0
        avg_communication = 0
        strengths = [
            'Practice answering role-specific technical questions',
            'Focus on structured explanations with examples',
            'Complete mock interviews to generate personalized AI insights',
        ]
        areas_to_improve = [
            'Complete your first interview to track areas for improvement',
            'Practice concise, structured answers using the STAR method',
            'Review feedback after each completed session',
        ]

    radar_data = [
        {'subject': 'Knowledge', 'value': int(avg_knowledge), 'fullMark': 100},
        {'subject': 'Relevance', 'value': int(avg_relevance), 'fullMark': 100},
        {'subject': 'Completeness', 'value': int(avg_completeness), 'fullMark': 100},
        {'subject': 'Communication', 'value': int(avg_communication), 'fullMark': 100},
    ]

    performance_bars = [
        {'label': 'Knowledge', 'value': int(avg_knowledge), 'color': '#4F46E5'},
        {'label': 'Relevance', 'value': int(avg_relevance), 'color': '#06b6d4'},
        {'label': 'Completeness', 'value': int(avg_completeness), 'color': '#16a34a'},
        {'label': 'Communication', 'value': int(avg_communication), 'color': '#f59e0b'},
    ]

    # Recent Activity (last 5 sessions)
    recent_activity = []
    for s in sessions[:5]:
        recent_activity.append({
            'id': s.pk,
            'type': s.get_interview_type_display(),
            'interview_type': s.interview_type,
            'role': s.job_role,
            'date': s.created_at.strftime('%b %d, %Y'),
            'score': round(s.overall_score) if s.overall_score is not None else None,
            'status': s.status,
            'status_display': s.get_status_display(),
            'questions_count': s.total_questions,
        })

    return {
        'stats': {
            'total_interviews': total_interviews,
            'completed_interviews': completed_count,
            'in_progress_interviews': in_progress_count,
            'average_score': int(round(average_score)),
            'total_questions_answered': total_questions_answered,
            'practice_time': practice_time_str,
            'interviews_this_week': interviews_this_week,
            'avg_score_this_week': int(round(avg_score_this_week)),
        },
        'progress': {
            'completion_rate': completion_rate,
            'completed_count': completed_count,
            'remaining_count': max(0, total_interviews - completed_count),
            'category_breakdown': category_breakdown,
        },
        'performance': {
            'knowledge': int(avg_knowledge),
            'relevance': int(avg_relevance),
            'completeness': int(avg_completeness),
            'communication': int(avg_communication),
            'radar_data': radar_data,
            'performance_bars': performance_bars,
        },
        'insights': {
            'strengths': strengths,
            'areas_to_improve': areas_to_improve,
        },
        'recent_activity': recent_activity,
    }


def get_detailed_user_analytics(user):
    """
    Computes comprehensive user progress and analytics across mock interviews
    and coding practice sessions from real database records.
    """
    now = timezone.now()
    month_ago = now - timezone.timedelta(days=30)

    sessions = InterviewSession.objects.filter(user=user).order_by('-created_at')
    total_interviews = sessions.count()
    completed_sessions = list(sessions.filter(status='completed'))
    completed_count = len(completed_sessions)
    in_progress_count = sessions.filter(status='in_progress').count()

    scores = [s.overall_score for s in completed_sessions if s.overall_score is not None]
    average_score = round(sum(scores) / len(scores), 1) if scores else 0
    highest_score = round(max(scores), 1) if scores else 0

    total_questions_answered = InterviewAnswer.objects.filter(
        question__session__user=user,
    ).count()

    # Practice time (est. 2.5 mins per question answered)
    est_hours = round((total_questions_answered * 2.5) / 60.0, 1)

    interviews_this_month = sessions.filter(created_at__gte=month_ago).count()

    # Coding analytics
    total_problems = 0
    coding_problems_solved = 0
    coding_problems_attempted = 0
    coding_acceptance_rate = 0.0
    easy_solved = 0
    medium_solved = 0
    hard_solved = 0
    language_breakdown = []

    try:
        from coding.models import CodingProblem, CodingSubmission
        total_problems = CodingProblem.objects.count()
        user_submissions = CodingSubmission.objects.filter(user=user)
        total_subs = user_submissions.count()

        if total_subs > 0:
            accepted_subs = user_submissions.filter(status='accepted')
            accepted_ids = set(accepted_subs.values_list('problem_id', flat=True))
            coding_problems_solved = len(accepted_ids)
            coding_problems_attempted = len(set(user_submissions.values_list('problem_id', flat=True)))
            coding_acceptance_rate = round((accepted_subs.count() / total_subs) * 100, 1)

            easy_solved = CodingProblem.objects.filter(id__in=accepted_ids, difficulty='easy').count()
            medium_solved = CodingProblem.objects.filter(id__in=accepted_ids, difficulty='medium').count()
            hard_solved = CodingProblem.objects.filter(id__in=accepted_ids, difficulty='hard').count()

            # Language breakdown
            lang_counts = {}
            for sub in user_submissions:
                lang_display = sub.get_language_display()
                lang_counts[lang_display] = lang_counts.get(lang_display, 0) + 1
            language_breakdown = [{'language': k, 'count': v} for k, v in lang_counts.items()]
    except Exception as exc:
        logger.warning("Could not compute coding analytics: %s", exc)

    # Historical score trend (chronological order of completed sessions)
    score_trend = []
    completed_chronological = sorted(completed_sessions, key=lambda s: s.completed_at or s.created_at)
    for s in completed_chronological:
        dt = s.completed_at or s.created_at
        score_trend.append({
            'session_id': s.pk,
            'date': dt.strftime('%Y-%m-%d'),
            'display_date': dt.strftime('%b %d'),
            'score': round(s.overall_score, 1) if s.overall_score is not None else 0,
            'type': s.get_interview_type_display(),
            'role': s.job_role,
            'difficulty': s.get_difficulty_display(),
        })

    # Core competencies
    evaluations = InterviewEvaluation.objects.filter(answer__question__session__user=user)
    eval_count = evaluations.count()

    def _qualitative_level(score):
        if score >= 85:
            return 'Expert'
        if score >= 70:
            return 'Proficient'
        if score >= 55:
            return 'Developing'
        return 'Novice'

    if eval_count > 0:
        avg_knowledge = round(sum(e.knowledge_score for e in evaluations) / eval_count, 1)
        avg_relevance = round(sum(e.relevance_score for e in evaluations) / eval_count, 1)
        avg_completeness = round(sum(e.completeness_score for e in evaluations) / eval_count, 1)
        avg_communication = round(sum(e.communication_score for e in evaluations) / eval_count, 1)

        all_strengths = []
        all_improvements = []
        for e in evaluations:
            all_strengths.extend(e.strengths or [])
            all_improvements.extend(e.suggestions or e.weaknesses or [])

        strengths = list(dict.fromkeys([s.strip() for s in all_strengths if s.strip()]))[:4]
        weaknesses = list(dict.fromkeys([s.strip() for s in all_improvements if s.strip()]))[:4]

        # Dynamic recommendation based on lowest competency
        min_comp = min(
            ('Knowledge', avg_knowledge),
            ('Relevance', avg_relevance),
            ('Completeness', avg_completeness),
            ('Communication', avg_communication),
            key=lambda x: x[1],
        )

        if min_comp[0] == 'Knowledge':
            recommended_focus = "Deepen technical concepts and system architecture fundamentals."
        elif min_comp[0] == 'Relevance':
            recommended_focus = "Focus on directly answering the core prompt without digressing."
        elif min_comp[0] == 'Completeness':
            recommended_focus = "Provide thorough explanations covering constraints, testing, and edge cases."
        else:
            recommended_focus = "Enhance communication clarity and structure your answers with the STAR method."
    else:
        avg_knowledge = 0
        avg_relevance = 0
        avg_completeness = 0
        avg_communication = 0
        strengths = [
            'Ready to start personalized AI mock interview practice',
            'Comprehensive interview modes available (Technical, Behavioral, HR, Managerial, Resume)',
        ]
        weaknesses = [
            'Complete your first interview session to unlock detailed AI evaluation insights',
        ]
        recommended_focus = "Start your first mock interview or solve a coding challenge to establish your baseline."

    competencies = {
        'knowledge': {'score': int(avg_knowledge), 'level': _qualitative_level(avg_knowledge)},
        'relevance': {'score': int(avg_relevance), 'level': _qualitative_level(avg_relevance)},
        'completeness': {'score': int(avg_completeness), 'level': _qualitative_level(avg_completeness)},
        'communication': {'score': int(avg_communication), 'level': _qualitative_level(avg_communication)},
        'radar_data': [
            {'subject': 'Knowledge', 'score': int(avg_knowledge), 'fullMark': 100},
            {'subject': 'Relevance', 'score': int(avg_relevance), 'fullMark': 100},
            {'subject': 'Completeness', 'score': int(avg_completeness), 'fullMark': 100},
            {'subject': 'Communication', 'score': int(avg_communication), 'fullMark': 100},
        ],
        'competency_bars': [
            {'label': 'Technical Knowledge', 'score': int(avg_knowledge), 'level': _qualitative_level(avg_knowledge), 'color': '#4F46E5'},
            {'label': 'Answer Relevance', 'score': int(avg_relevance), 'level': _qualitative_level(avg_relevance), 'color': '#06b6d4'},
            {'label': 'Solution Completeness', 'score': int(avg_completeness), 'level': _qualitative_level(avg_completeness), 'color': '#16a34a'},
            {'label': 'Communication Clarity', 'score': int(avg_communication), 'level': _qualitative_level(avg_communication), 'color': '#f59e0b'},
        ],
    }

    # Categories breakdown
    categories_meta = [
        ('technical', 'Technical', '#4F46E5'),
        ('behavioral', 'Behavioral', '#06b6d4'),
        ('hr', 'HR Round', '#f59e0b'),
        ('managerial', 'Managerial', '#16a34a'),
        ('resume', 'Resume-Based', '#8b5cf6'),
    ]
    categories = []
    for cat_key, cat_name, color in categories_meta:
        cat_sess = [s for s in completed_sessions if s.interview_type == cat_key]
        cat_scores = [s.overall_score for s in cat_sess if s.overall_score is not None]
        cat_avg = round(sum(cat_scores) / len(cat_scores), 1) if cat_scores else 0
        categories.append({
            'type': cat_key,
            'name': cat_name,
            'count': len(cat_sess),
            'avg_score': cat_avg,
            'color': color,
        })

    # Difficulty breakdown
    diff_meta = [('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')]
    difficulty_breakdown = []
    for diff_key, diff_name in diff_meta:
        d_sess = [s for s in completed_sessions if s.difficulty == diff_key]
        d_scores = [s.overall_score for s in d_sess if s.overall_score is not None]
        d_avg = round(sum(d_scores) / len(d_scores), 1) if d_scores else 0
        difficulty_breakdown.append({
            'difficulty': diff_name,
            'count': len(d_sess),
            'avg_score': d_avg,
        })

    # Recent completed/active interviews
    recent_interviews = []
    for s in sessions[:8]:
        recent_interviews.append({
            'id': s.pk,
            'interview_type': s.interview_type,
            'type_display': s.get_interview_type_display(),
            'job_role': s.job_role,
            'difficulty': s.difficulty,
            'difficulty_display': s.get_difficulty_display(),
            'overall_score': round(s.overall_score, 1) if s.overall_score is not None else None,
            'date': s.created_at.strftime('%b %d, %Y'),
            'status': s.status,
            'status_display': s.get_status_display(),
            'questions_count': s.total_questions,
        })

    return {
        'summary': {
            'total_interviews': total_interviews,
            'completed_interviews': completed_count,
            'in_progress_interviews': in_progress_count,
            'average_interview_score': average_score,
            'highest_score': highest_score,
            'total_questions_answered': total_questions_answered,
            'total_practice_hours': est_hours,
            'coding_problems_solved': coding_problems_solved,
            'coding_problems_attempted': coding_problems_attempted,
            'coding_total_problems': total_problems,
            'coding_acceptance_rate': coding_acceptance_rate,
            'interviews_this_month': interviews_this_month,
        },
        'score_trend': score_trend,
        'competencies': competencies,
        'categories': categories,
        'difficulty_breakdown': difficulty_breakdown,
        'coding_analytics': {
            'total_solved': coding_problems_solved,
            'total_attempted': coding_problems_attempted,
            'total_problems': total_problems,
            'easy_solved': easy_solved,
            'medium_solved': medium_solved,
            'hard_solved': hard_solved,
            'acceptance_rate': coding_acceptance_rate,
            'language_breakdown': language_breakdown,
        },
        'ai_insights': {
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommended_focus': recommended_focus,
        },
        'recent_interviews': recent_interviews,
    }
