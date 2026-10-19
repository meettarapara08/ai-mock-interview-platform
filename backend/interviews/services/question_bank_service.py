"""
Fallback question bank for when Gemini AI is unavailable.

Provides pre-defined questions grouped by interview type, difficulty, and general job roles.
"""

import random
import logging

from interviews.models import QuestionBank

logger = logging.getLogger(__name__)

# ─── Built-in Fallback Questions ───
# These are used when the QuestionBank DB table is empty and Gemini is unavailable.

BUILTIN_QUESTIONS = {
    'technical': {
        'easy': [
            "What are the basic data types in your preferred programming language?",
            "Explain the difference between a stack and a queue.",
            "What is the purpose of version control systems like Git?",
            "Describe the difference between an array and a linked list.",
            "What is an API and how does it work?",
            "Explain the concept of object-oriented programming.",
            "What is the difference between HTTP GET and POST methods?",
        ],
        'medium': [
            "Explain the concept of time complexity and Big O notation with examples.",
            "What are design patterns? Describe one you have used in a project.",
            "How would you optimise a slow database query?",
            "Explain the difference between SQL and NoSQL databases and when to use each.",
            "Describe how you would implement authentication in a web application.",
            "What is the difference between concurrency and parallelism?",
            "Explain RESTful API design principles and best practices.",
        ],
        'hard': [
            "Design a scalable system for handling millions of concurrent users.",
            "Explain the CAP theorem and its implications for distributed systems.",
            "How would you implement a real-time notification system at scale?",
            "Describe the trade-offs between microservices and monolithic architectures.",
            "Explain how garbage collection works in your preferred language runtime.",
            "Design a rate limiter that works across multiple servers.",
            "How would you handle data consistency in a distributed database?",
        ],
    },
    'behavioral': {
        'easy': [
            "Tell me about yourself and your background.",
            "What motivated you to apply for this position?",
            "Describe a time when you worked well in a team.",
            "What are your greatest strengths?",
            "How do you handle feedback from your peers or manager?",
            "Tell me about a project you are proud of.",
            "How do you prioritise your tasks when you have multiple deadlines?",
        ],
        'medium': [
            "Describe a challenging situation at work and how you handled it.",
            "Tell me about a time you had to learn something new quickly.",
            "How do you handle disagreements with team members?",
            "Describe a situation where you had to make a difficult decision with limited information.",
            "Tell me about a time you failed and what you learned from it.",
            "How do you handle working under pressure with tight deadlines?",
            "Describe a time when you had to persuade others to accept your idea.",
        ],
        'hard': [
            "Describe a time when you had to lead a team through a significant change.",
            "Tell me about a situation where you had to balance multiple stakeholder interests.",
            "How have you handled a project that was at risk of failure?",
            "Describe a situation where you had to make an unpopular decision.",
            "Tell me about a time you identified and resolved a systemic issue in your organisation.",
            "How do you approach mentoring junior team members?",
            "Describe a time when you had to adapt your communication style for different audiences.",
        ],
    },
    'hr': {
        'easy': [
            "Why are you interested in working at our company?",
            "Where do you see yourself in five years?",
            "What is your expected salary range?",
            "What type of work environment do you prefer?",
            "How did you hear about this position?",
            "Are you willing to relocate if required?",
            "What do you know about our company?",
        ],
        'medium': [
            "Why are you leaving your current job?",
            "How do you handle stress and maintain work-life balance?",
            "What makes you a good cultural fit for our team?",
            "How do you stay updated with industry trends?",
            "Describe your ideal manager and working relationship.",
            "What are your long-term career goals?",
            "How do you handle constructive criticism?",
        ],
        'hard': [
            "If you received offers from multiple companies, how would you make your decision?",
            "What would you do in the first 90 days of this role?",
            "How do you evaluate whether a company's values align with your own?",
            "Describe a situation where company policy conflicted with what you thought was right.",
            "What is the most important thing you have learned in your career?",
            "How would you handle a situation where you disagree with company direction?",
            "What legacy do you want to leave at each company you work for?",
        ],
    },
    'managerial': {
        'easy': [
            "What is your management style?",
            "How do you motivate team members?",
            "Describe how you delegate tasks within a team.",
            "What tools do you use for project management?",
            "How do you handle team meetings effectively?",
            "What qualities make a good leader?",
            "How do you set goals for your team?",
        ],
        'medium': [
            "How do you handle underperforming team members?",
            "Describe your approach to conflict resolution within a team.",
            "How do you balance meeting deadlines with maintaining team morale?",
            "Tell me about a time you successfully managed a cross-functional project.",
            "How do you make decisions when you have incomplete information?",
            "Describe how you build trust with a new team.",
            "How do you handle competing priorities from different stakeholders?",
        ],
        'hard': [
            "How would you restructure a struggling team to improve performance?",
            "Describe your approach to managing organisational change.",
            "How do you develop future leaders within your team?",
            "Tell me about a time you had to make a strategic decision that affected the entire organisation.",
            "How do you measure the success of your team beyond standard metrics?",
            "Describe how you would handle a situation where your team disagrees with upper management.",
            "How do you foster innovation while maintaining operational stability?",
        ],
    },
}


def get_fallback_questions(interview_type, difficulty, num_questions, job_role=''):
    """
    Get fallback questions from the QuestionBank DB or built-in defaults.

    Args:
        interview_type: One of 'technical', 'behavioral', 'hr', 'managerial'
        difficulty: One of 'easy', 'medium', 'hard'
        num_questions: Number of questions to return
        job_role: Optional job role for filtering (not strictly required for fallback)

    Returns:
        A list of question strings.
    """
    questions = []

    # 1. Try the QuestionBank DB table first
    try:
        db_qs = QuestionBank.objects.filter(
            interview_type=interview_type,
            difficulty=difficulty,
        )
        if job_role:
            role_qs = db_qs.filter(job_role__icontains=job_role)
            if role_qs.exists():
                db_qs = role_qs
            # If no role-specific questions, fall through to general

        if db_qs.exists():
            all_texts = list(db_qs.values_list('question_text', flat=True))
            random.shuffle(all_texts)
            questions = all_texts[:num_questions]
    except Exception as exc:
        logger.warning('Failed to query QuestionBank: %s', exc)

    # 2. Fall back to built-in questions
    if len(questions) < num_questions:
        builtin = BUILTIN_QUESTIONS.get(interview_type, {}).get(difficulty, [])
        if builtin:
            remaining = num_questions - len(questions)
            existing_set = set(questions)
            available = [q for q in builtin if q not in existing_set]
            random.shuffle(available)
            questions.extend(available[:remaining])

    # 3. If still not enough, grab from other difficulties of the same type
    if len(questions) < num_questions:
        for diff in ['easy', 'medium', 'hard']:
            if diff == difficulty:
                continue
            extra = BUILTIN_QUESTIONS.get(interview_type, {}).get(diff, [])
            existing_set = set(questions)
            available = [q for q in extra if q not in existing_set]
            random.shuffle(available)
            questions.extend(available[:num_questions - len(questions)])
            if len(questions) >= num_questions:
                break

    return questions[:num_questions]
