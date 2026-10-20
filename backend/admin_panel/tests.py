from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.serializers import UserSerializer
from coding.models import CodingProblem, CodingTestCase, CodingSubmission
from interviews.models import InterviewSession, QuestionBank, JobRole


class AdminPanelPermissionsAndDashboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('admin_dashboard')

        # Create regular user
        self.regular_user = User.objects.create_user(
            username='candidate_jane',
            email='jane@example.com',
            password='Password123!',
        )

        # Create staff user
        self.staff_user = User.objects.create_user(
            username='admin_boss',
            email='admin@example.com',
            password='AdminPassword123!',
            is_staff=True,
        )

        # Create sample data in MySQL / test DB
        self.session = InterviewSession.objects.create(
            user=self.regular_user,
            interview_type='technical',
            job_role='Software Engineer',
            difficulty='medium',
            total_questions=5,
            status='completed',
            overall_score=88.5,
        )

        self.problem = CodingProblem.objects.create(
            title='Two Sum',
            slug='two-sum',
            difficulty='easy',
            category='Arrays',
            description='Find two indices that sum to target.',
        )

        self.submission = CodingSubmission.objects.create(
            user=self.regular_user,
            problem=self.problem,
            language='python',
            code='def solution(): return [0, 1]',
            status='accepted',
            score=100,
        )

        self.question = QuestionBank.objects.create(
            interview_type='technical',
            job_role='Software Engineer',
            difficulty='easy',
            question_text='What is polymorphism?',
        )

    def test_unauthenticated_user_denied(self):
        """Unauthenticated requests must be rejected with 403 Forbidden."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_denied(self):
        """Non-staff authenticated users must receive 403 Forbidden."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_access_dashboard(self):
        """Staff user receives 200 OK and accurate aggregated data."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('summary', data)
        self.assertIn('category_breakdown', data)
        self.assertIn('coding_status_breakdown', data)
        self.assertIn('activity_trends', data)
        self.assertIn('recent_activity', data)

        summary = data['summary']
        self.assertEqual(summary['total_users'], 2)
        self.assertEqual(summary['staff_users'], 1)
        self.assertEqual(summary['total_interviews'], 1)
        self.assertEqual(summary['completed_interviews'], 1)
        self.assertEqual(summary['average_interview_score'], 88.5)
        self.assertEqual(summary['total_coding_problems'], 1)
        self.assertEqual(summary['total_coding_submissions'], 1)
        self.assertEqual(summary['accepted_coding_submissions'], 1)
        self.assertEqual(summary['coding_acceptance_rate'], 100.0)
        self.assertEqual(summary['total_question_bank'], 1)

        # Verify recent activity includes both interview and coding
        event_types = [e['type'] for e in data['recent_activity']]
        self.assertIn('interview_session', event_types)
        self.assertIn('coding_submission', event_types)
        self.assertIn('user_registered', event_types)

    def test_user_serializer_exposes_staff_fields(self):
        """UserSerializer must expose is_staff and is_superuser."""
        serializer = UserSerializer(self.staff_user)
        self.assertIn('is_staff', serializer.data)
        self.assertIn('is_superuser', serializer.data)
        self.assertTrue(serializer.data['is_staff'])

        reg_serializer = UserSerializer(self.regular_user)
        self.assertFalse(reg_serializer.data['is_staff'])

    def test_admin_user_list_and_search(self):
        """Staff user can list users and search by username/email."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('admin_user_list')

        # List all
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)

        # Search for jane
        search_res = self.client.get(url, {'search': 'jane'})
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        self.assertEqual(search_res.data['count'], 1)
        self.assertEqual(search_res.data['results'][0]['username'], 'candidate_jane')

    def test_admin_user_detail(self):
        """Staff user can retrieve detailed profile of a candidate."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('admin_user_detail', kwargs={'pk': self.regular_user.pk})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'candidate_jane')
        self.assertEqual(res.data['interviews_count'], 1)
        self.assertEqual(res.data['submissions_count'], 1)
        self.assertEqual(len(res.data['recent_interviews']), 1)
        self.assertEqual(len(res.data['recent_submissions']), 1)

    def test_admin_toggle_user_status(self):
        """Staff user can activate/deactivate candidates."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('admin_user_toggle_status', kwargs={'pk': self.regular_user.pk})

        # Deactivate
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertFalse(self.regular_user.is_active)

        # Reactivate
        res2 = self.client.post(url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_active)

    def test_self_deactivation_prevented(self):
        """Staff user cannot deactivate their own account."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('admin_user_toggle_status', kwargs={'pk': self.staff_user.pk})
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot deactivate your own', res.data['detail'])

    def test_admin_question_list_and_filter(self):
        """Staff user can list questions and filter by difficulty and type."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('admin_question_list_create')

        # List all
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)

        # Filter by interview_type
        res_tech = self.client.get(url, {'interview_type': 'technical'})
        self.assertEqual(res_tech.data['count'], 1)

        res_hr = self.client.get(url, {'interview_type': 'hr'})
        self.assertEqual(res_hr.data['count'], 0)

    def test_admin_create_question_success(self):
        """Staff user can create a new valid question bank entry."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('admin_question_list_create')

        payload = {
            'interview_type': 'behavioral',
            'job_role': 'Product Manager',
            'difficulty': 'hard',
            'question_text': 'Tell me about a time you resolved a major stakeholder dispute.',
            'category': 'Conflict Resolution',
        }
        res = self.client.post(url, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['question']['job_role'], 'Product Manager')
        self.assertEqual(QuestionBank.objects.filter(interview_type='behavioral').count(), 1)

    def test_admin_create_question_validation_error(self):
        """Short question text must return 400 Bad Request."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('admin_question_list_create')

        payload = {
            'interview_type': 'technical',
            'difficulty': 'easy',
            'question_text': 'Hi',
        }
        res = self.client.post(url, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('question_text', res.data)

    def test_admin_update_and_delete_question(self):
        """Staff user can update and delete a question bank entry."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('admin_question_detail', kwargs={'pk': self.question.pk})

        # Update
        patch_res = self.client.patch(url, {'question_text': 'Explain abstraction and encapsulation in detail.'})
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.question.refresh_from_db()
        self.assertEqual(self.question.question_text, 'Explain abstraction and encapsulation in detail.')

        # Delete
        del_res = self.client.delete(url)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(QuestionBank.objects.filter(pk=self.question.pk).exists())

    def test_admin_job_roles_crud(self):
        """Staff user can list, create, update, and delete job roles with skill arrays."""
        self.client.force_authenticate(user=self.staff_user)
        list_url = reverse('admin_role_list_create')

        # Create
        payload = {
            'title': 'AI/ML Engineer',
            'category': 'Data & AI',
            'description': 'Machine learning models and prompt engineering.',
            'skills': ['Python', 'PyTorch', 'LangChain'],
            'is_active': True,
        }
        create_res = self.client.post(list_url, payload, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        role_id = create_res.data['role']['id']
        self.assertEqual(create_res.data['role']['slug'], 'aiml-engineer')
        self.assertEqual(len(create_res.data['role']['skills']), 3)

        # List
        get_res = self.client.get(list_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['count'], 1)

        # Dynamic Interview Config check
        config_url = reverse('interview_config')
        config_res = self.client.get(config_url)
        self.assertEqual(config_res.status_code, status.HTTP_200_OK)
        self.assertIn('AI/ML Engineer', config_res.data['suggested_job_roles'])

        # Update
        detail_url = reverse('admin_role_detail', kwargs={'pk': role_id})
        patch_res = self.client.patch(detail_url, {'is_active': False}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertFalse(patch_res.data['role']['is_active'])

        # Delete
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(JobRole.objects.filter(pk=role_id).exists())

    def test_admin_coding_problem_and_test_cases_crud(self):
        """Staff user can create, update, manage test cases, and delete coding problems."""
        self.client.force_authenticate(user=self.staff_user)
        problems_url = reverse('admin_coding_problem_list_create')

        # Create problem
        prob_payload = {
            'title': 'Valid Palindrome',
            'difficulty': 'easy',
            'category': 'Strings',
            'description': 'Determine if string is a palindrome.',
            'starter_code': {
                'python': 'def isPalindrome(s: str) -> bool:\n    pass',
                'java': 'class Solution { public boolean isPalindrome(String s) { } }',
            },
        }
        create_prob_res = self.client.post(problems_url, prob_payload, format='json')
        self.assertEqual(create_prob_res.status_code, status.HTTP_201_CREATED)
        problem_id = create_prob_res.data['problem']['id']
        self.assertEqual(create_prob_res.data['problem']['slug'], 'valid-palindrome')

        # Add sample test case
        tc_create_url = reverse('admin_coding_test_case_create', kwargs={'problem_id': problem_id})
        tc_payload = {
            'input_data': 'racecar',
            'expected_output': 'true',
            'is_sample': True,
            'explanation': 'Reads same forwards and backwards.',
            'order': 1,
        }
        tc_res = self.client.post(tc_create_url, tc_payload, format='json')
        self.assertEqual(tc_res.status_code, status.HTTP_201_CREATED)
        tc_id = tc_res.data['test_case']['id']

        # Add hidden test case
        tc_payload_hidden = {
            'input_data': 'hello',
            'expected_output': 'false',
            'is_sample': False,
            'order': 2,
        }
        self.client.post(tc_create_url, tc_payload_hidden, format='json')

        # Retrieve detail with test cases
        detail_url = reverse('admin_coding_problem_detail', kwargs={'pk': problem_id})
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(detail_res.data['test_cases']), 2)
        self.assertEqual(detail_res.data['test_cases_count'], 2)

        # Update test case
        tc_detail_url = reverse('admin_coding_test_case_detail', kwargs={'pk': tc_id})
        patch_tc = self.client.patch(tc_detail_url, {'expected_output': 'true\n'}, format='json')
        self.assertEqual(patch_tc.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_tc.data['test_case']['expected_output'], 'true\n')

        # Delete test case
        del_tc = self.client.delete(tc_detail_url)
        self.assertEqual(del_tc.status_code, status.HTTP_200_OK)
        self.assertFalse(CodingTestCase.objects.filter(pk=tc_id).exists())

        # Update problem
        patch_prob = self.client.patch(detail_url, {'difficulty': 'medium'}, format='json')
        self.assertEqual(patch_prob.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_prob.data['problem']['difficulty'], 'medium')

        # Delete problem
        del_prob = self.client.delete(detail_url)
        self.assertEqual(del_prob.status_code, status.HTTP_200_OK)
        self.assertFalse(CodingProblem.objects.filter(pk=problem_id).exists())

    def test_non_staff_forbidden_on_roles_and_coding(self):
        """Unauthenticated and regular users receive 403 Forbidden on all roles & coding admin endpoints."""
        roles_url = reverse('admin_role_list_create')
        coding_url = reverse('admin_coding_problem_list_create')

        # Unauthenticated
        self.assertEqual(self.client.get(roles_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(coding_url).status_code, status.HTTP_403_FORBIDDEN)

        # Regular user
        self.client.force_authenticate(user=self.regular_user)
        self.assertEqual(self.client.get(roles_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.post(roles_url, {'title': 'Hacker'}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(coding_url).status_code, status.HTTP_403_FORBIDDEN)



