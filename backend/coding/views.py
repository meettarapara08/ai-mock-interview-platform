from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import CodingProblem, CodingSubmission
from .serializers import (
    CodingProblemListSerializer,
    CodingProblemDetailSerializer,
    CodingSubmissionListSerializer,
    CodingSubmissionDetailSerializer,
    RunCodeRequestSerializer,
    SubmitCodeRequestSerializer,
)
from .services.executor import execution_service


class ProblemListView(APIView):
    """List coding problems with optional filtering by difficulty, category, and search query."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = CodingProblem.objects.all().order_by('order', 'id')

        # Filter by difficulty
        difficulty = request.query_params.get('difficulty')
        if difficulty and difficulty.lower() in ('easy', 'medium', 'hard'):
            queryset = queryset.filter(difficulty=difficulty.lower())

        # Filter by category
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        # Search by query
        search = request.query_params.get('search') or request.query_params.get('q')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(category__icontains=search) |
                Q(description__icontains=search)
            )

        serializer = CodingProblemListSerializer(
            queryset,
            many=True,
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProblemDetailView(APIView):
    """Retrieve detailed problem statement and sample test cases."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        problem = get_object_or_404(CodingProblem, slug=slug)
        serializer = CodingProblemDetailSerializer(
            problem,
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class RunCodeView(APIView):
    """
    Run user code against sample test cases or a single custom input.
    Does not persist a submission record to the database.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        problem = get_object_or_404(CodingProblem, slug=slug)
        serializer = RunCodeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        language = serializer.validated_data['language']
        code = serializer.validated_data['code']
        custom_input = serializer.validated_data.get('custom_input', '').strip()

        # Custom input test execution
        if custom_input:
            result = execution_service.execute_single_case(
                language=language,
                code=code,
                stdin_data=custom_input,
                expected_output="",
            )
            return Response({
                'is_custom': True,
                'test_results': [{
                    'case_index': 1,
                    'input': custom_input,
                    'expected': '',
                    'actual': result.get('actual_output', ''),
                    'stdout': result.get('stdout', ''),
                    'stderr': result.get('stderr', ''),
                    'passed': result.get('status') not in ('compilation_error', 'runtime_error', 'time_limit_exceeded', 'internal_error'),
                    'status': result.get('status', 'accepted'),
                    'execution_time_ms': result.get('execution_time_ms', 0),
                    'error_message': result.get('error_message', ''),
                }],
                'passed': 1 if result.get('status') == 'accepted' else 0,
                'total': 1,
                'all_passed': result.get('status') == 'accepted',
            }, status=status.HTTP_200_OK)

        # Run against sample test cases
        sample_cases = problem.test_cases.filter(is_sample=True).order_by('order', 'id')
        if not sample_cases.exists():
            # If no sample cases exist, fallback to first 2 test cases
            sample_cases = problem.test_cases.all().order_by('order', 'id')[:2]

        results = []
        passed_count = 0

        for idx, tc in enumerate(sample_cases, start=1):
            res = execution_service.execute_single_case(
                language=language,
                code=code,
                stdin_data=tc.input_data,
                expected_output=tc.expected_output,
            )

            is_passed = res.get('passed', False)
            if is_passed:
                passed_count += 1

            results.append({
                'case_index': idx,
                'case_id': tc.id,
                'input': tc.input_data,
                'expected': tc.expected_output,
                'actual': res.get('actual_output', ''),
                'stdout': res.get('stdout', ''),
                'stderr': res.get('stderr', ''),
                'passed': is_passed,
                'status': res.get('status', 'wrong_answer'),
                'execution_time_ms': res.get('execution_time_ms', 0),
                'error_message': res.get('error_message', ''),
            })

            # If compilation error, stop further cases immediately
            if res.get('status') == 'compilation_error':
                break

        total = len(sample_cases)
        return Response({
            'is_custom': False,
            'test_results': results,
            'passed': passed_count,
            'total': total,
            'all_passed': (passed_count == total and total > 0),
        }, status=status.HTTP_200_OK)


class SubmitCodeView(APIView):
    """
    Submit user code for official evaluation against all test cases (sample + hidden).
    Saves a CodingSubmission record.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        problem = get_object_or_404(CodingProblem, slug=slug)
        serializer = SubmitCodeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        language = serializer.validated_data['language']
        code = serializer.validated_data['code']

        all_test_cases = problem.test_cases.all().order_by('order', 'id')
        total_cases = all_test_cases.count()

        if total_cases == 0:
            return Response(
                {'error': 'No test cases configured for this problem.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        test_results = []
        passed_count = 0
        overall_status = 'accepted'
        first_error_message = ""
        max_time_ms = 0.0

        for idx, tc in enumerate(all_test_cases, start=1):
            res = execution_service.execute_single_case(
                language=language,
                code=code,
                stdin_data=tc.input_data,
                expected_output=tc.expected_output,
            )

            is_passed = res.get('passed', False)
            case_time = res.get('execution_time_ms', 0.0)
            if case_time > max_time_ms:
                max_time_ms = case_time

            if is_passed:
                passed_count += 1
            elif not first_error_message:
                first_error_message = res.get('error_message') or res.get('stderr') or 'Wrong Answer'

            case_status = res.get('status', 'wrong_answer')
            if case_status != 'accepted' and overall_status == 'accepted':
                overall_status = case_status

            test_results.append({
                'case_index': idx,
                'is_sample': tc.is_sample,
                'input': tc.input_data if tc.is_sample else "[Hidden Test Case]",
                'expected': tc.expected_output if tc.is_sample else "[Hidden Output]",
                'actual': res.get('actual_output', '') if tc.is_sample else ("Match" if is_passed else "Mismatch"),
                'passed': is_passed,
                'status': case_status,
                'execution_time_ms': case_time,
                'error_message': res.get('error_message', ''),
            })

            # If compile error, no need to run remaining tests
            if case_status == 'compilation_error':
                overall_status = 'compilation_error'
                break

        score = int(round((passed_count / total_cases) * 100)) if total_cases > 0 else 0
        if passed_count == total_cases and total_cases > 0:
            overall_status = 'accepted'

        # Persist submission record in MySQL
        submission = CodingSubmission.objects.create(
            user=request.user,
            problem=problem,
            language=language,
            code=code,
            status=overall_status,
            score=score,
            passed_test_cases=passed_count,
            total_test_cases=total_cases,
            execution_time_ms=max_time_ms,
            error_message=first_error_message,
            test_results=test_results,
        )

        detail_serializer = CodingSubmissionDetailSerializer(submission)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class ProblemSubmissionsView(APIView):
    """Retrieve user's submission history for a specific problem."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        problem = get_object_or_404(CodingProblem, slug=slug)
        submissions = CodingSubmission.objects.filter(
            problem=problem,
            user=request.user,
        ).order_by('-created_at')

        serializer = CodingSubmissionListSerializer(submissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SubmissionDetailView(APIView):
    """Retrieve full details for a single submission, enforcing ownership."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        submission = get_object_or_404(
            CodingSubmission,
            pk=pk,
            user=request.user,
        )
        serializer = CodingSubmissionDetailSerializer(submission)
        return Response(serializer.data, status=status.HTTP_200_OK)
