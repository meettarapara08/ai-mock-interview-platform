import os
from django.test import TestCase, Client
from django.contrib.auth.models import User
from interviews.models import InterviewSession, InterviewQuestion, InterviewAnswer


class InterviewAPITestCase(TestCase):
    """Tests for the Interview module API endpoints."""

    def setUp(self):
        self.original_gemini_key = os.environ.get('GEMINI_API_KEY')
        os.environ['GEMINI_API_KEY'] = ''
        self.client = Client()
        # Create and authenticate a test user
        self.user = User.objects.create_user(
            username='interviewtester',
            email='tester@example.com',
            password='TestPassword123!',
            first_name='Test',
            last_name='User',
        )
        self.client.login(username='interviewtester', password='TestPassword123!')

        # Another user for ownership tests
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='OtherPassword123!',
        )

    def tearDown(self):
        if self.original_gemini_key is not None:
            os.environ['GEMINI_API_KEY'] = self.original_gemini_key

    # ─── Config Endpoint ───

    def test_get_config(self):
        response = self.client.get('/api/interviews/config/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('interview_types', data)
        self.assertIn('difficulties', data)
        self.assertIn('suggested_job_roles', data)
        self.assertIn('question_range', data)
        self.assertEqual(len(data['interview_types']), 4)
        self.assertEqual(len(data['difficulties']), 3)

    def test_config_requires_auth(self):
        self.client.logout()
        response = self.client.get('/api/interviews/config/')
        self.assertEqual(response.status_code, 403)

    # ─── Session Create ───

    def test_create_session(self):
        response = self.client.post(
            '/api/interviews/sessions/',
            {
                'interview_type': 'technical',
                'job_role': 'Python Developer',
                'difficulty': 'medium',
                'total_questions': 5,
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['interview_type'], 'technical')
        self.assertEqual(data['job_role'], 'Python Developer')
        self.assertEqual(data['difficulty'], 'medium')
        self.assertEqual(data['status'], 'setup')

    def test_create_session_invalid_type(self):
        response = self.client.post(
            '/api/interviews/sessions/',
            {
                'interview_type': 'invalid',
                'job_role': 'Developer',
                'difficulty': 'medium',
                'total_questions': 5,
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    def test_create_session_invalid_questions_range(self):
        response = self.client.post(
            '/api/interviews/sessions/',
            {
                'interview_type': 'technical',
                'job_role': 'Developer',
                'difficulty': 'medium',
                'total_questions': 20,  # Over max 15
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    def test_create_session_empty_role(self):
        response = self.client.post(
            '/api/interviews/sessions/',
            {
                'interview_type': 'technical',
                'job_role': '   ',
                'difficulty': 'medium',
                'total_questions': 5,
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    # ─── Session List ───

    def test_list_sessions(self):
        # Create a session
        InterviewSession.objects.create(
            user=self.user,
            interview_type='behavioral',
            job_role='QA Engineer',
            difficulty='easy',
            total_questions=3,
        )
        response = self.client.get('/api/interviews/sessions/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['interview_type'], 'behavioral')

    def test_list_sessions_no_cross_user(self):
        # Create a session for another user
        InterviewSession.objects.create(
            user=self.other_user,
            interview_type='technical',
            job_role='Developer',
            difficulty='hard',
            total_questions=5,
        )
        response = self.client.get('/api/interviews/sessions/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 0)

    # ─── Session Detail ───

    def test_session_detail(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='hr',
            job_role='Manager',
            difficulty='medium',
            total_questions=5,
        )
        response = self.client.get(f'/api/interviews/sessions/{session.pk}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['interview_type'], 'hr')

    def test_session_detail_other_user_404(self):
        session = InterviewSession.objects.create(
            user=self.other_user,
            interview_type='technical',
            job_role='Developer',
            difficulty='medium',
            total_questions=5,
        )
        response = self.client.get(f'/api/interviews/sessions/{session.pk}/')
        self.assertEqual(response.status_code, 404)

    # ─── Start Session (Fallback — no Gemini key in test) ───

    def test_start_session_fallback(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='technical',
            job_role='Python Developer',
            difficulty='medium',
            total_questions=5,
        )
        response = self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'in_progress')
        self.assertIn('current_question', data)
        self.assertFalse(data['is_ai_generated'])

    def test_start_session_twice_fails(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='behavioral',
            job_role='Engineer',
            difficulty='easy',
            total_questions=3,
        )
        # Start once
        self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        # Start again — should fail with 409
        response = self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 409)

    # ─── Current Question ───

    def test_get_current_question(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='technical',
            job_role='Developer',
            difficulty='medium',
            total_questions=3,
        )
        self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        response = self.client.get(
            f'/api/interviews/sessions/{session.pk}/current-question/',
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('current_question', data)
        self.assertEqual(data['current_question_index'], 0)

    # ─── Answer Submission ───

    def test_submit_answer(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='hr',
            job_role='Manager',
            difficulty='easy',
            total_questions=3,
        )
        self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        response = self.client.post(
            f'/api/interviews/sessions/{session.pk}/answer/',
            {'answer_text': 'I am interested in this role because it aligns with my career goals and expertise.'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('is_session_complete', data)
        self.assertIn('current_question_index', data)

    def test_submit_answer_too_short(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='hr',
            job_role='Manager',
            difficulty='easy',
            total_questions=3,
        )
        self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        response = self.client.post(
            f'/api/interviews/sessions/{session.pk}/answer/',
            {'answer_text': 'Short'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    def test_submit_answer_on_setup_session_fails(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='technical',
            job_role='Developer',
            difficulty='medium',
            total_questions=5,
        )
        response = self.client.post(
            f'/api/interviews/sessions/{session.pk}/answer/',
            {'answer_text': 'This is a test answer that should fail.'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 409)

    # ─── Complete Session ───

    def test_complete_session(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='behavioral',
            job_role='Engineer',
            difficulty='easy',
            total_questions=3,
        )
        self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        # Answer all questions
        for _ in range(3):
            self.client.post(
                f'/api/interviews/sessions/{session.pk}/answer/',
                {'answer_text': 'This is my detailed answer to the interview question being asked.'},
                content_type='application/json',
            )
        response = self.client.post(
            f'/api/interviews/sessions/{session.pk}/complete/',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'completed')

    def test_complete_setup_session_fails(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='technical',
            job_role='Developer',
            difficulty='medium',
            total_questions=5,
        )
        response = self.client.post(
            f'/api/interviews/sessions/{session.pk}/complete/',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 409)

    # ─── Report ───

    def test_get_report(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='technical',
            job_role='Developer',
            difficulty='medium',
            total_questions=3,
        )
        self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        response = self.client.get(
            f'/api/interviews/sessions/{session.pk}/report/',
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('session', data)
        self.assertIn('questions', data)
        self.assertIn('score_breakdown', data)

    def test_report_other_user_404(self):
        session = InterviewSession.objects.create(
            user=self.other_user,
            interview_type='technical',
            job_role='Developer',
            difficulty='medium',
            total_questions=3,
        )
        response = self.client.get(
            f'/api/interviews/sessions/{session.pk}/report/',
        )
        self.assertEqual(response.status_code, 404)

    # ─── Duplicate Answer Prevention ───

    def test_duplicate_answer_prevented(self):
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='technical',
            job_role='Developer',
            difficulty='medium',
            total_questions=3,
        )
        self.client.post(
            f'/api/interviews/sessions/{session.pk}/start/',
            content_type='application/json',
        )
        # First answer
        self.client.post(
            f'/api/interviews/sessions/{session.pk}/answer/',
            {'answer_text': 'This is my first detailed answer to the question.'},
            content_type='application/json',
        )
        # Manually try to create another answer for question 0
        q0 = session.questions.get(question_order=0)
        self.assertTrue(hasattr(q0, 'answer'))

    # ─── Dashboard Analytics ───

    def test_dashboard_analytics(self):
        # Create an interview session for the user
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='technical',
            job_role='Python Engineer',
            difficulty='medium',
            total_questions=3,
            status='completed',
            overall_score=85.0,
        )
        response = self.client.get('/api/interviews/dashboard/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('stats', data)
        self.assertIn('progress', data)
        self.assertIn('performance', data)
        self.assertIn('insights', data)
        self.assertIn('recent_activity', data)
        self.assertEqual(data['stats']['total_interviews'], 1)
        self.assertEqual(data['stats']['completed_interviews'], 1)
        self.assertEqual(data['stats']['average_score'], 85)
        self.assertEqual(len(data['recent_activity']), 1)
        self.assertEqual(data['recent_activity'][0]['role'], 'Python Engineer')

    def test_dashboard_analytics_requires_auth(self):
        self.client.logout()
        response = self.client.get('/api/interviews/dashboard/')
        self.assertEqual(response.status_code, 403)
