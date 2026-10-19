from unittest.mock import patch
from django.test import TestCase, Client
from django.contrib.auth.models import User
from coding.models import CodingProblem, CodingTestCase, CodingSubmission


class CodingModuleTestCase(TestCase):
    """Test suite for the Coding Practice Module."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='coder1',
            email='coder1@example.com',
            password='TestPassword123!',
        )
        self.client.login(username='coder1', password='TestPassword123!')

        self.other_user = User.objects.create_user(
            username='coder2',
            email='coder2@example.com',
            password='TestPassword123!',
        )

        # Create sample problem
        self.problem = CodingProblem.objects.create(
            title="Sample Sum",
            slug="sample-sum",
            difficulty="easy",
            category="Math",
            description="Add two numbers.",
            input_format="A and B separated by space",
            output_format="Sum of A and B",
            constraints="0 <= A, B <= 100",
            starter_code={
                "python": "import sys\nprint(sum(map(int, sys.stdin.read().split())))",
                "java": "// java starter",
                "cpp": "// cpp starter",
            },
            order=1,
        )

        # Sample test case
        self.sample_tc = CodingTestCase.objects.create(
            problem=self.problem,
            input_data="2 3",
            expected_output="5",
            is_sample=True,
            explanation="2 + 3 = 5",
            order=1,
        )

        # Hidden test case
        self.hidden_tc = CodingTestCase.objects.create(
            problem=self.problem,
            input_data="10 20",
            expected_output="30",
            is_sample=False,
            explanation="",
            order=2,
        )

    # ─── Problem List & Filtering ───

    def test_problem_list_requires_auth(self):
        self.client.logout()
        resp = self.client.get('/api/coding/problems/')
        self.assertEqual(resp.status_code, 403)

    def test_problem_list_success(self):
        resp = self.client.get('/api/coding/problems/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 1)
        self.assertEqual(data[0]['slug'], 'sample-sum')
        self.assertEqual(data[0]['total_test_cases'], 2)
        self.assertEqual(data[0]['user_status'], 'unsolved')

    def test_problem_list_filter_difficulty(self):
        resp = self.client.get('/api/coding/problems/?difficulty=easy')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(all(p['difficulty'] == 'easy' for p in data))

        resp_hard = self.client.get('/api/coding/problems/?difficulty=hard')
        self.assertEqual(resp_hard.status_code, 200)
        data_hard = resp_hard.json()
        self.assertEqual(len(data_hard), 0)

    def test_problem_list_search(self):
        resp = self.client.get('/api/coding/problems/?search=Sample')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)

    # ─── Problem Detail ───

    def test_problem_detail_excludes_hidden_tests(self):
        resp = self.client.get(f'/api/coding/problems/{self.problem.slug}/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['title'], 'Sample Sum')
        self.assertIn('sample_test_cases', data)
        self.assertEqual(len(data['sample_test_cases']), 1)
        self.assertEqual(data['sample_test_cases'][0]['input_data'], '2 3')
        # Check hidden test case is NOT leaked
        self.assertNotIn('10 20', [tc['input_data'] for tc in data['sample_test_cases']])

    # ─── Run Code ───

    @patch('coding.views.execution_service.execute_single_case')
    def test_run_code_sample_cases(self, mock_exec):
        mock_exec.return_value = {
            'passed': True,
            'status': 'accepted',
            'stdout': '5\n',
            'stderr': '',
            'execution_time_ms': 42.0,
            'expected_output': '5',
            'actual_output': '5\n',
            'error_message': '',
        }

        resp = self.client.post(
            f'/api/coding/problems/{self.problem.slug}/run/',
            {
                'language': 'python',
                'code': 'print(5)',
            },
            content_type='application/json',
        )

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['all_passed'])
        self.assertEqual(data['passed'], 1)
        self.assertEqual(len(data['test_results']), 1)

    @patch('coding.views.execution_service.execute_single_case')
    def test_run_code_custom_input(self, mock_exec):
        mock_exec.return_value = {
            'passed': True,
            'status': 'accepted',
            'stdout': '100\n',
            'stderr': '',
            'execution_time_ms': 30.0,
            'expected_output': '',
            'actual_output': '100\n',
            'error_message': '',
        }

        resp = self.client.post(
            f'/api/coding/problems/{self.problem.slug}/run/',
            {
                'language': 'python',
                'code': 'print(100)',
                'custom_input': '50 50',
            },
            content_type='application/json',
        )

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['is_custom'])
        self.assertEqual(data['test_results'][0]['actual'], '100\n')

    # ─── Submit Code ───

    @patch('coding.views.execution_service.execute_single_case')
    def test_submit_code_success(self, mock_exec):
        mock_exec.side_effect = [
            {
                'passed': True,
                'status': 'accepted',
                'stdout': '5\n',
                'stderr': '',
                'execution_time_ms': 40.0,
                'expected_output': '5',
                'actual_output': '5\n',
                'error_message': '',
            },
            {
                'passed': True,
                'status': 'accepted',
                'stdout': '30\n',
                'stderr': '',
                'execution_time_ms': 45.0,
                'expected_output': '30',
                'actual_output': '30\n',
                'error_message': '',
            },
        ]

        resp = self.client.post(
            f'/api/coding/problems/{self.problem.slug}/submit/',
            {
                'language': 'python',
                'code': 'import sys\nprint(sum(map(int, sys.stdin.read().split())))',
            },
            content_type='application/json',
        )

        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data['status'], 'accepted')
        self.assertEqual(data['score'], 100)
        self.assertEqual(data['passed_test_cases'], 2)
        self.assertEqual(data['total_test_cases'], 2)

        # Check submission in DB
        sub = CodingSubmission.objects.get(id=data['id'])
        self.assertEqual(sub.user, self.user)
        self.assertEqual(sub.status, 'accepted')

    # ─── Submissions History & Isolation ───

    def test_user_can_only_view_own_submissions(self):
        sub1 = CodingSubmission.objects.create(
            user=self.user,
            problem=self.problem,
            language='python',
            code='print(1)',
            status='accepted',
            score=100,
            passed_test_cases=2,
            total_test_cases=2,
        )

        sub2 = CodingSubmission.objects.create(
            user=self.other_user,
            problem=self.problem,
            language='python',
            code='print(2)',
            status='wrong_answer',
            score=50,
            passed_test_cases=1,
            total_test_cases=2,
        )

        # User 1 should only see their own submission
        resp = self.client.get(f'/api/coding/problems/{self.problem.slug}/submissions/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], sub1.id)

        # User 1 cannot view User 2's submission detail
        resp_forbidden = self.client.get(f'/api/coding/submissions/{sub2.id}/')
        self.assertEqual(resp_forbidden.status_code, 404)
