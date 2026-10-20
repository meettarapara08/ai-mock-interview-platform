from datetime import timedelta
from django.contrib.auth.models import User
from django.db.models import Avg, Count, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile
from coding.models import CodingProblem, CodingTestCase, CodingSubmission
from interviews.models import (
    INTERVIEW_TYPE_CHOICES,
    InterviewEvaluation,
    InterviewSession,
    QuestionBank,
    Resume,
    JobRole,
)
from .permissions import IsAdminStaffUser
from .serializers import (
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminQuestionBankSerializer,
    AdminJobRoleSerializer,
    AdminCodingTestCaseSerializer,
    AdminCodingProblemListSerializer,
    AdminCodingProblemDetailSerializer,
)


class AdminDashboardView(APIView):
    """
    Returns aggregated real MySQL data metrics, chart time-series,
    and recent activity for the Admin Dashboard.
    Requires staff/admin privileges.
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        fourteen_days_ago = now - timedelta(days=13)  # 14 days including today

        # ─── 1. User Summary Metrics ───
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        staff_users = User.objects.filter(is_staff=True).count()
        new_users_30d = User.objects.filter(date_joined__gte=thirty_days_ago).count()

        # ─── 2. Interview Summary Metrics ───
        total_interviews = InterviewSession.objects.count()
        completed_interviews = InterviewSession.objects.filter(status='completed').count()
        in_progress_interviews = InterviewSession.objects.filter(status='in_progress').count()
        setup_interviews = InterviewSession.objects.filter(status='setup').count()

        interview_completion_rate = (
            round((completed_interviews / total_interviews) * 100, 1)
            if total_interviews > 0
            else 0.0
        )

        avg_score_data = InterviewSession.objects.filter(
            status='completed',
            overall_score__isnull=False,
        ).aggregate(avg_score=Avg('overall_score'))
        average_interview_score = (
            round(avg_score_data['avg_score'], 1)
            if avg_score_data['avg_score'] is not None
            else 0.0
        )

        # ─── 3. Coding Summary Metrics ───
        total_coding_problems = CodingProblem.objects.count()
        total_coding_submissions = CodingSubmission.objects.count()
        accepted_submissions = CodingSubmission.objects.filter(status='accepted').count()
        coding_acceptance_rate = (
            round((accepted_submissions / total_coding_submissions) * 100, 1)
            if total_coding_submissions > 0
            else 0.0
        )

        # ─── 4. Question Bank & Resumes ───
        total_question_bank = QuestionBank.objects.count()
        total_resumes = Resume.objects.count()

        # ─── 5. Interview Category Distribution ───
        category_counts = (
            InterviewSession.objects.values('interview_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        type_display_map = dict(INTERVIEW_TYPE_CHOICES)
        type_color_map = {
            'technical': '#4f46e5',
            'behavioral': '#06b6d4',
            'hr': '#f59e0b',
            'managerial': '#8b5cf6',
            'resume': '#10b981',
        }

        category_breakdown = []
        for item in category_counts:
            itype = item['interview_type']
            category_breakdown.append({
                'key': itype,
                'name': type_display_map.get(itype, itype.capitalize()),
                'count': item['count'],
                'color': type_color_map.get(itype, '#64748b'),
            })

        # ─── 6. Coding Submissions Breakdown ───
        status_counts = (
            CodingSubmission.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        status_label_map = {
            'accepted': 'Accepted',
            'wrong_answer': 'Wrong Answer',
            'time_limit_exceeded': 'Time Limit Exceeded',
            'compilation_error': 'Compilation Error',
            'runtime_error': 'Runtime Error',
            'internal_error': 'Internal Error',
        }
        status_color_map = {
            'accepted': '#16a34a',
            'wrong_answer': '#dc2626',
            'time_limit_exceeded': '#f59e0b',
            'compilation_error': '#ea580c',
            'runtime_error': '#e11d48',
            'internal_error': '#64748b',
        }

        coding_status_breakdown = []
        for item in status_counts:
            st = item['status']
            coding_status_breakdown.append({
                'key': st,
                'name': status_label_map.get(st, st.replace('_', ' ').title()),
                'count': item['count'],
                'color': status_color_map.get(st, '#94a3b8'),
            })

        # ─── 7. 14-Day Activity Trends ───
        # Build day list from 13 days ago through today
        start_date = (now - timedelta(days=13)).date()
        daily_trends = []
        day_map = {}

        for i in range(14):
            day_date = start_date + timedelta(days=i)
            day_str = day_date.strftime('%Y-%m-%d')
            label = day_date.strftime('%b %d')
            day_map[day_str] = {
                'date': day_str,
                'label': label,
                'interviews': 0,
                'submissions': 0,
                'registrations': 0,
            }

        # Query interviews grouped by date
        interview_days = (
            InterviewSession.objects.filter(created_at__date__gte=start_date)
            .values('created_at__date')
            .annotate(count=Count('id'))
        )
        for row in interview_days:
            k = row['created_at__date'].strftime('%Y-%m-%d')
            if k in day_map:
                day_map[k]['interviews'] = row['count']

        # Query submissions grouped by date
        submission_days = (
            CodingSubmission.objects.filter(created_at__date__gte=start_date)
            .values('created_at__date')
            .annotate(count=Count('id'))
        )
        for row in submission_days:
            k = row['created_at__date'].strftime('%Y-%m-%d')
            if k in day_map:
                day_map[k]['submissions'] = row['count']

        # Query user registrations grouped by date
        user_days = (
            User.objects.filter(date_joined__date__gte=start_date)
            .values('date_joined__date')
            .annotate(count=Count('id'))
        )
        for row in user_days:
            k = row['date_joined__date'].strftime('%Y-%m-%d')
            if k in day_map:
                day_map[k]['registrations'] = row['count']

        activity_trends = sorted(day_map.values(), key=lambda x: x['date'])

        # ─── 8. Recent Platform Activity Log ───
        recent_events = []

        # Recent 5 user signups
        recent_users = User.objects.order_by('-date_joined')[:5]
        for u in recent_users:
            recent_events.append({
                'id': f"user-{u.id}",
                'type': 'user_registered',
                'title': f"User Registered: {u.username}",
                'subtitle': u.email or 'No email provided',
                'user': {
                    'id': u.id,
                    'username': u.username,
                    'email': u.email,
                },
                'status': 'active' if u.is_active else 'inactive',
                'score': None,
                'timestamp': u.date_joined.isoformat(),
            })

        # Recent 5 interview sessions
        recent_sessions = (
            InterviewSession.objects.select_related('user')
            .order_by('-created_at')[:5]
        )
        for s in recent_sessions:
            recent_events.append({
                'id': f"session-{s.id}",
                'type': 'interview_session',
                'title': f"{s.get_interview_type_display()} Interview ({s.job_role})",
                'subtitle': f"Difficulty: {s.get_difficulty_display()} • Questions: {s.total_questions}",
                'user': {
                    'id': s.user.id,
                    'username': s.user.username,
                    'email': s.user.email,
                },
                'status': s.status,
                'score': round(s.overall_score, 1) if s.overall_score is not None else None,
                'timestamp': s.created_at.isoformat(),
            })

        # Recent 5 coding submissions
        recent_subs = (
            CodingSubmission.objects.select_related('user', 'problem')
            .order_by('-created_at')[:5]
        )
        for cs in recent_subs:
            recent_events.append({
                'id': f"submission-{cs.id}",
                'type': 'coding_submission',
                'title': f"Code Submitted: {cs.problem.title}",
                'subtitle': f"Language: {cs.get_language_display()} • Score: {cs.score}%",
                'user': {
                    'id': cs.user.id,
                    'username': cs.user.username,
                    'email': cs.user.email,
                },
                'status': cs.status,
                'score': cs.score,
                'timestamp': cs.created_at.isoformat(),
            })

        # Sort all recent events chronologically descending
        recent_events.sort(key=lambda x: x['timestamp'], reverse=True)
        recent_events = recent_events[:12]

        return Response({
            'summary': {
                'total_users': total_users,
                'active_users': active_users,
                'staff_users': staff_users,
                'new_users_30d': new_users_30d,
                'total_interviews': total_interviews,
                'completed_interviews': completed_interviews,
                'in_progress_interviews': in_progress_interviews,
                'setup_interviews': setup_interviews,
                'interview_completion_rate': interview_completion_rate,
                'average_interview_score': average_interview_score,
                'total_coding_problems': total_coding_problems,
                'total_coding_submissions': total_coding_submissions,
                'accepted_coding_submissions': accepted_submissions,
                'coding_acceptance_rate': coding_acceptance_rate,
                'total_question_bank': total_question_bank,
                'total_resumes': total_resumes,
            },
            'category_breakdown': category_breakdown,
            'coding_status_breakdown': coding_status_breakdown,
            'activity_trends': activity_trends,
            'recent_activity': recent_events,
        }, status=status.HTTP_200_OK)


class StandardAdminPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminUserListView(APIView):
    """
    Lists users with search, filtering, and pagination.
    Supports filtering by active status and role (staff vs candidate).
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        queryset = User.objects.select_related('profile').annotate(
            interviews_count=Count('interview_sessions', distinct=True),
            submissions_count=Count('coding_submissions', distinct=True),
        )

        # Search by username, email, first_name, last_name, or profile target_role
        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(profile__target_role__icontains=search)
            )

        # Filter by status: active, inactive, or all
        status_filter = request.query_params.get('status', 'all').lower()
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)

        # Filter by role: staff, candidate, or all
        role_filter = request.query_params.get('role', 'all').lower()
        if role_filter == 'staff':
            queryset = queryset.filter(is_staff=True)
        elif role_filter == 'candidate':
            queryset = queryset.filter(is_staff=False)

        # Ordering
        ordering = request.query_params.get('ordering', '-date_joined')
        valid_orderings = {
            '-date_joined': '-date_joined',
            'date_joined': 'date_joined',
            'username': 'username',
            '-username': '-username',
            '-interviews_count': '-interviews_count',
            '-submissions_count': '-submissions_count',
        }
        queryset = queryset.order_by(valid_orderings.get(ordering, '-date_joined'))

        # Pagination
        paginator = StandardAdminPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = AdminUserListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AdminUserListSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserDetailView(APIView):
    """
    Returns complete profile and activity history for a specific candidate/user.
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request, pk):
        queryset = User.objects.select_related('profile').annotate(
            interviews_count=Count('interview_sessions', distinct=True),
            submissions_count=Count('coding_submissions', distinct=True),
        )
        user_obj = get_object_or_404(queryset, pk=pk)
        serializer = AdminUserDetailSerializer(user_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserStatusToggleView(APIView):
    """
    Toggles the is_active status of a candidate account.
    Prevents self-deactivation by the requesting administrator.
    """
    permission_classes = [IsAdminStaffUser]

    def post(self, request, pk):
        target_user = get_object_or_404(User, pk=pk)

        if target_user == request.user:
            return Response(
                {'detail': 'You cannot deactivate your own administrative account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.is_active = not target_user.is_active
        target_user.save(update_fields=['is_active'])

        action = "activated" if target_user.is_active else "deactivated"
        return Response({
            'message': f"Account for '{target_user.username}' successfully {action}.",
            'user': AdminUserListSerializer(target_user).data,
        }, status=status.HTTP_200_OK)


class AdminQuestionBankListCreateView(APIView):
    """
    List questions with search and filtering (GET) or create a new question (POST).
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        queryset = QuestionBank.objects.all()

        # Search across question text, job role, and category
        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(question_text__icontains=search)
                | Q(job_role__icontains=search)
                | Q(category__icontains=search)
            )

        # Filter by interview_type
        interview_type = request.query_params.get('interview_type', '').strip().lower()
        if interview_type and interview_type != 'all':
            queryset = queryset.filter(interview_type=interview_type)

        # Filter by difficulty
        difficulty = request.query_params.get('difficulty', '').strip().lower()
        if difficulty and difficulty != 'all':
            queryset = queryset.filter(difficulty=difficulty)

        # Filter by job_role
        job_role = request.query_params.get('job_role', '').strip()
        if job_role and job_role != 'all':
            queryset = queryset.filter(job_role__icontains=job_role)

        # Ordering
        queryset = queryset.order_by('-created_at', '-id')

        # Pagination
        paginator = StandardAdminPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = AdminQuestionBankSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AdminQuestionBankSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AdminQuestionBankSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.save()
            return Response(
                {
                    'message': 'Question added to question bank successfully.',
                    'question': AdminQuestionBankSerializer(question).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminQuestionBankDetailView(APIView):
    """
    Retrieve (GET), Update (PUT/PATCH), or Delete (DELETE) a specific question.
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request, pk):
        question = get_object_or_404(QuestionBank, pk=pk)
        serializer = AdminQuestionBankSerializer(question)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        question = get_object_or_404(QuestionBank, pk=pk)
        serializer = AdminQuestionBankSerializer(question, data=request.data, partial=True)
        if serializer.is_valid():
            updated_question = serializer.save()
            return Response(
                {
                    'message': 'Question updated successfully.',
                    'question': AdminQuestionBankSerializer(updated_question).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        question = get_object_or_404(QuestionBank, pk=pk)
        question_id = question.id
        question.delete()
        return Response(
            {'message': f'Question #{question_id} deleted successfully.'},
            status=status.HTTP_200_OK,
        )


class AdminJobRoleListCreateView(APIView):
    """
    List job roles with search and filtering (GET) or create a new job role (POST).
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        queryset = JobRole.objects.all()

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(category__icontains=search)
                | Q(description__icontains=search)
            )

        category = request.query_params.get('category', '').strip()
        if category and category != 'all':
            queryset = queryset.filter(category__iexact=category)

        is_active = request.query_params.get('is_active', '').strip().lower()
        if is_active in ['true', '1', 'active']:
            queryset = queryset.filter(is_active=True)
        elif is_active in ['false', '0', 'inactive']:
            queryset = queryset.filter(is_active=False)

        queryset = queryset.order_by('-created_at', 'title')

        paginator = StandardAdminPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = AdminJobRoleSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AdminJobRoleSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AdminJobRoleSerializer(data=request.data)
        if serializer.is_valid():
            role = serializer.save()
            return Response(
                {
                    'message': f"Job role '{role.title}' created successfully.",
                    'role': AdminJobRoleSerializer(role).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminJobRoleDetailView(APIView):
    """
    Retrieve (GET), Update (PUT/PATCH), or Delete (DELETE) a specific job role.
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request, pk):
        role = get_object_or_404(JobRole, pk=pk)
        serializer = AdminJobRoleSerializer(role)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        role = get_object_or_404(JobRole, pk=pk)
        serializer = AdminJobRoleSerializer(role, data=request.data, partial=True)
        if serializer.is_valid():
            updated_role = serializer.save()
            return Response(
                {
                    'message': f"Job role '{updated_role.title}' updated successfully.",
                    'role': AdminJobRoleSerializer(updated_role).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        role = get_object_or_404(JobRole, pk=pk)
        title = role.title
        role.delete()
        return Response(
            {'message': f"Job role '{title}' deleted successfully."},
            status=status.HTTP_200_OK,
        )


class AdminCodingProblemListCreateView(APIView):
    """
    List coding problems with search, filtering, and stats (GET) or create a new problem (POST).
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        queryset = CodingProblem.objects.annotate(
            test_cases_count=Count('test_cases', distinct=True),
            submissions_count=Count('submissions', distinct=True),
        )

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(category__icontains=search)
                | Q(description__icontains=search)
                | Q(slug__icontains=search)
            )

        difficulty = request.query_params.get('difficulty', '').strip().lower()
        if difficulty and difficulty != 'all':
            queryset = queryset.filter(difficulty=difficulty)

        category = request.query_params.get('category', '').strip()
        if category and category != 'all':
            queryset = queryset.filter(category__iexact=category)

        queryset = queryset.order_by('order', '-created_at', 'id')

        paginator = StandardAdminPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = AdminCodingProblemListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AdminCodingProblemListSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AdminCodingProblemDetailSerializer(data=request.data)
        if serializer.is_valid():
            problem = serializer.save()
            reloaded = CodingProblem.objects.annotate(
                test_cases_count=Count('test_cases', distinct=True),
                submissions_count=Count('submissions', distinct=True),
            ).get(pk=problem.pk)
            return Response(
                {
                    'message': f"Coding problem '{problem.title}' created successfully.",
                    'problem': AdminCodingProblemDetailSerializer(reloaded).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCodingProblemDetailView(APIView):
    """
    Retrieve (GET), Update (PUT/PATCH), or Delete (DELETE) a specific coding problem.
    """
    permission_classes = [IsAdminStaffUser]

    def get(self, request, pk):
        queryset = CodingProblem.objects.annotate(
            test_cases_count=Count('test_cases', distinct=True),
            submissions_count=Count('submissions', distinct=True),
        ).prefetch_related('test_cases')
        problem = get_object_or_404(queryset, pk=pk)
        serializer = AdminCodingProblemDetailSerializer(problem)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        problem = get_object_or_404(CodingProblem, pk=pk)
        serializer = AdminCodingProblemDetailSerializer(problem, data=request.data, partial=True)
        if serializer.is_valid():
            updated_problem = serializer.save()
            reloaded = CodingProblem.objects.annotate(
                test_cases_count=Count('test_cases', distinct=True),
                submissions_count=Count('submissions', distinct=True),
            ).prefetch_related('test_cases').get(pk=updated_problem.pk)
            return Response(
                {
                    'message': f"Coding problem '{updated_problem.title}' updated successfully.",
                    'problem': AdminCodingProblemDetailSerializer(reloaded).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        problem = get_object_or_404(CodingProblem, pk=pk)
        title = problem.title
        problem.delete()
        return Response(
            {'message': f"Coding problem '{title}' deleted successfully."},
            status=status.HTTP_200_OK,
        )


class AdminCodingTestCaseCreateView(APIView):
    """
    Add a new sample or hidden test case to a specific coding problem.
    """
    permission_classes = [IsAdminStaffUser]

    def post(self, request, problem_id):
        problem = get_object_or_404(CodingProblem, pk=problem_id)
        serializer = AdminCodingTestCaseSerializer(data=request.data)
        if serializer.is_valid():
            test_case = serializer.save(problem=problem)
            return Response(
                {
                    'message': 'Test case created successfully.',
                    'test_case': AdminCodingTestCaseSerializer(test_case).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCodingTestCaseDetailView(APIView):
    """
    Update (PATCH/PUT) or Delete (DELETE) a test case.
    """
    permission_classes = [IsAdminStaffUser]

    def patch(self, request, pk):
        test_case = get_object_or_404(CodingTestCase, pk=pk)
        serializer = AdminCodingTestCaseSerializer(test_case, data=request.data, partial=True)
        if serializer.is_valid():
            updated_case = serializer.save()
            return Response(
                {
                    'message': 'Test case updated successfully.',
                    'test_case': AdminCodingTestCaseSerializer(updated_case).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        test_case = get_object_or_404(CodingTestCase, pk=pk)
        case_id = test_case.id
        test_case.delete()
        return Response(
            {'message': f'Test case #{case_id} deleted successfully.'},
            status=status.HTTP_200_OK,
        )



