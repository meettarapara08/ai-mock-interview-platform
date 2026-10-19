from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from interviews.models import InterviewSession, INTERVIEW_TYPE_CHOICES, DIFFICULTY_CHOICES
from interviews.serializers import (
    InterviewSessionListSerializer,
    InterviewSessionDetailSerializer,
    InterviewSessionCreateSerializer,
    InterviewQuestionBriefSerializer,
    InterviewEvaluationSerializer,
    AnswerSubmitSerializer,
)
from interviews.services.interview_service import (
    start_session,
    get_current_question,
    submit_answer,
    complete_session,
    get_session_report,
    get_user_dashboard_analytics,
    InvalidStateError,
    DuplicateAnswerError,
    InterviewServiceError,
)


# ─── Helper ───

def _get_user_session(request, session_id):
    """Retrieve session owned by the current user or return (None, error_response)."""
    try:
        session = InterviewSession.objects.get(pk=session_id, user=request.user)
        return session, None
    except InterviewSession.DoesNotExist:
        return None, Response(
            {'detail': 'Interview session not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )


# ─── Views ───

class InterviewConfigView(APIView):
    """Return available interview types, difficulties, and suggested job roles."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Pull target_role from user's profile if available
        profile = getattr(request.user, 'profile', None)
        default_role = profile.target_role if profile else 'Software Engineer'

        return Response({
            'interview_types': [
                {'value': val, 'label': label}
                for val, label in INTERVIEW_TYPE_CHOICES
            ],
            'difficulties': [
                {'value': val, 'label': label}
                for val, label in DIFFICULTY_CHOICES
            ],
            'suggested_job_roles': [
                'Software Engineer',
                'Frontend Developer',
                'Backend Developer',
                'Full Stack Developer',
                'Data Scientist',
                'DevOps Engineer',
                'Product Manager',
                'QA Engineer',
                'Mobile Developer',
                'Cloud Engineer',
            ],
            'default_job_role': default_role,
            'question_range': {'min': 3, 'max': 15, 'default': 5},
        })


class InterviewSessionListCreateView(APIView):
    """List user's sessions (GET) or create a new session (POST)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = InterviewSession.objects.filter(user=request.user)

        # Optional filters
        interview_type = request.query_params.get('type')
        session_status = request.query_params.get('status')
        if interview_type:
            sessions = sessions.filter(interview_type=interview_type)
        if session_status:
            sessions = sessions.filter(status=session_status)

        serializer = InterviewSessionListSerializer(sessions, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = InterviewSessionCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        if serializer.is_valid():
            session = serializer.save()
            return Response(
                InterviewSessionListSerializer(session).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InterviewSessionDetailView(APIView):
    """Get detailed view of a single session."""
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session, err = _get_user_session(request, session_id)
        if err:
            return err
        serializer = InterviewSessionDetailSerializer(session)
        return Response(serializer.data)


class InterviewStartView(APIView):
    """Start a session: generate questions and transition to in_progress."""
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session, err = _get_user_session(request, session_id)
        if err:
            return err

        # Get user skills from profile for better question generation
        profile = getattr(request.user, 'profile', None)
        user_skills = profile.skills if profile else ''

        try:
            first_question = start_session(session, user_skills=user_skills)
        except InvalidStateError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        except InterviewServiceError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        session.refresh_from_db()
        return Response({
            'id': session.pk,
            'status': session.status,
            'current_question': InterviewQuestionBriefSerializer(first_question).data,
            'total_questions': session.total_questions,
            'current_question_index': session.current_question_index,
            'is_ai_generated': session.is_ai_generated,
        })


class CurrentQuestionView(APIView):
    """Get the current unanswered question in the session."""
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session, err = _get_user_session(request, session_id)
        if err:
            return err

        if session.status != 'in_progress':
            return Response(
                {'detail': f"Session is '{session.get_status_display()}'. No active question."},
                status=status.HTTP_409_CONFLICT,
            )

        question = get_current_question(session)
        if question is None:
            return Response(
                {'detail': 'No more questions available.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'current_question': InterviewQuestionBriefSerializer(question).data,
            'current_question_index': session.current_question_index,
            'total_questions': session.total_questions,
        })


class AnswerSubmitView(APIView):
    """Submit an answer for the current question."""
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session, err = _get_user_session(request, session_id)
        if err:
            return err

        serializer = AnswerSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = submit_answer(
                session=session,
                answer_text=serializer.validated_data['answer_text'],
            )
        except InvalidStateError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        except DuplicateAnswerError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        except InterviewServiceError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_data = {
            'is_session_complete': result['is_session_complete'],
            'current_question_index': session.current_question_index,
            'total_questions': session.total_questions,
        }

        # Include evaluation if available
        if result['evaluation'] is not None:
            response_data['evaluation'] = InterviewEvaluationSerializer(
                result['evaluation']
            ).data
        else:
            response_data['evaluation'] = None
            response_data['evaluation_note'] = (
                'AI evaluation was unavailable for this answer. '
                'Your answer has been recorded.'
            )

        # Include next question if available
        if result['next_question'] is not None:
            response_data['next_question'] = InterviewQuestionBriefSerializer(
                result['next_question']
            ).data
        else:
            response_data['next_question'] = None

        return Response(response_data)


class InterviewCompleteView(APIView):
    """Complete an in-progress interview session."""
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session, err = _get_user_session(request, session_id)
        if err:
            return err

        try:
            session = complete_session(session)
        except InvalidStateError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(InterviewSessionListSerializer(session).data)


class InterviewReportView(APIView):
    """Get the full report for a session."""
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session, err = _get_user_session(request, session_id)
        if err:
            return err

        report = get_session_report(session)
        return Response(report)


class DashboardAnalyticsView(APIView):
    """Get user-specific aggregated interview and performance metrics for the dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        analytics = get_user_dashboard_analytics(request.user)
        return Response(analytics)
