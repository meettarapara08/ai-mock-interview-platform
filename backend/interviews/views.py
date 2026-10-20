from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.exceptions import ValidationError

from interviews.models import (
    InterviewSession,
    Resume,
    JobRole,
    INTERVIEW_TYPE_CHOICES,
    DIFFICULTY_CHOICES,
)
from interviews.serializers import (
    InterviewSessionListSerializer,
    InterviewSessionDetailSerializer,
    InterviewSessionCreateSerializer,
    InterviewQuestionBriefSerializer,
    InterviewEvaluationSerializer,
    AnswerSubmitSerializer,
    ResumeSerializer,
    ResumeUploadSerializer,
)
from interviews.services.interview_service import (
    start_session,
    get_current_question,
    submit_answer,
    complete_session,
    get_session_report,
    get_user_dashboard_analytics,
    get_detailed_user_analytics,
    InvalidStateError,
    DuplicateAnswerError,
    InterviewServiceError,
)
from interviews.services.resume_parser_service import parse_resume_document


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

        active_resume = Resume.objects.filter(user=request.user, is_active=True).first()

        # Suggested job roles from JobRole model with fallback
        db_roles = list(JobRole.objects.filter(is_active=True).values_list('title', flat=True))
        fallback_roles = [
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
        ]
        suggested_roles = db_roles if db_roles else fallback_roles

        return Response({
            'interview_types': [
                {'value': val, 'label': label}
                for val, label in INTERVIEW_TYPE_CHOICES
            ],
            'difficulties': [
                {'value': val, 'label': label}
                for val, label in DIFFICULTY_CHOICES
            ],
            'suggested_job_roles': suggested_roles,
            'default_job_role': active_resume.target_role if active_resume and active_resume.target_role else default_role,
            'question_range': {'min': 3, 'max': 15, 'default': 5},
            'has_active_resume': active_resume is not None,
            'active_resume_id': active_resume.id if active_resume else None,
            'active_resume_role': active_resume.target_role if active_resume else None,
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


class UserDetailedAnalyticsView(APIView):
    """Get comprehensive user progress and analytics for the dedicated Progress & Analytics page."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        analytics = get_detailed_user_analytics(request.user)
        return Response(analytics)


# ─── Resume Views ───

class ResumeUploadView(APIView):
    """Upload and parse a resume document (PDF or DOCX)."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data['file']
        file_name = uploaded_file.name
        file_size = uploaded_file.size
        lower_name = file_name.lower()
        file_type = 'pdf' if lower_name.endswith('.pdf') else 'docx'

        # Read file bytes in memory for extraction
        try:
            file_bytes = uploaded_file.read()
        except Exception as exc:
            return Response(
                {'detail': f'Failed to read uploaded file: {exc}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create resume record
        resume = Resume.objects.create(
            user=request.user,
            file=uploaded_file,
            file_name=file_name,
            file_size=file_size,
            file_type=file_type,
            processing_status='processing',
            is_active=True,
        )

        # Parse document and extract structured info
        try:
            parse_resume_document(resume, file_bytes)
        except ValidationError as exc:
            return Response(
                {
                    'detail': str(exc.message if hasattr(exc, 'message') else exc),
                    'resume': ResumeSerializer(resume).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {
                    'detail': f'Unexpected error parsing resume: {exc}',
                    'resume': ResumeSerializer(resume).data,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        resume.refresh_from_db()
        return Response(
            ResumeSerializer(resume).data,
            status=status.HTTP_201_CREATED,
        )


class ResumeListView(APIView):
    """List all resumes uploaded by the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resumes = Resume.objects.filter(user=request.user)
        serializer = ResumeSerializer(resumes, many=True)
        return Response(serializer.data)


class ActiveResumeView(APIView):
    """Get the currently active resume for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resume = Resume.objects.filter(user=request.user, is_active=True).first()
        if not resume:
            resume = Resume.objects.filter(user=request.user).first()

        if not resume:
            return Response({'resume': None})

        return Response({'resume': ResumeSerializer(resume).data})


class ResumeDetailView(APIView):
    """Retrieve or delete a single resume owned by the current user."""
    permission_classes = [IsAuthenticated]

    def _get_resume(self, request, resume_id):
        try:
            return Resume.objects.get(pk=resume_id, user=request.user), None
        except Resume.DoesNotExist:
            return None, Response(
                {'detail': 'Resume not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    def get(self, request, resume_id):
        resume, err = self._get_resume(request, resume_id)
        if err:
            return err
        return Response(ResumeSerializer(resume).data)

    def delete(self, request, resume_id):
        resume, err = self._get_resume(request, resume_id)
        if err:
            return err

        was_active = resume.is_active

        # Delete the stored file from disk safely
        if resume.file:
            try:
                resume.file.delete(save=False)
            except Exception:
                pass

        resume.delete()

        # If deleted resume was active, set the latest remaining resume as active
        if was_active:
            next_active = Resume.objects.filter(user=request.user).first()
            if next_active:
                next_active.is_active = True
                next_active.save(update_fields=['is_active'])

        return Response(
            {'detail': 'Resume deleted successfully.'},
            status=status.HTTP_200_OK,
        )
