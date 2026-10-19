import os
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from interviews.models import InterviewSession, InterviewQuestion, InterviewAnswer, Resume


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
        self.assertEqual(len(data['interview_types']), 5)
        type_values = [t['value'] for t in data['interview_types']]
        self.assertIn('resume', type_values)
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

    # ─── Resume Tests ───

    def _create_sample_pdf_bytes(self):
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text(
            (50, 72),
            "John Doe\nSoftware Engineer\nSkills: Python, Django, React, PostgreSQL, Docker\n"
            "Experience: Built scalable microservices at Acme Corp.\n"
            "Projects: E-Commerce Store with Django and React."
        )
        pdf_bytes = doc.write()
        doc.close()
        return pdf_bytes

    def _create_sample_docx_bytes(self):
        import docx
        import io
        doc = docx.Document()
        doc.add_heading("Jane Smith", 0)
        doc.add_paragraph("Full Stack Developer with experience in Python, React, and AWS.")
        doc.add_paragraph("Projects: Realtime Chat Application using WebSockets and Redis.")
        stream = io.BytesIO()
        doc.save(stream)
        return stream.getvalue()

    def test_resume_upload_pdf(self):
        pdf_bytes = self._create_sample_pdf_bytes()
        upload_file = SimpleUploadedFile("my_resume.pdf", pdf_bytes, content_type="application/pdf")

        response = self.client.post(
            '/api/interviews/resumes/upload/',
            {'file': upload_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['file_name'], 'my_resume.pdf')
        self.assertEqual(data['file_type'], 'pdf')
        self.assertEqual(data['processing_status'], 'completed')
        self.assertTrue(data['is_active'])
        self.assertIn('skills', data)
        self.assertGreater(len(data['skills']), 0)

    def test_resume_upload_docx(self):
        docx_bytes = self._create_sample_docx_bytes()
        upload_file = SimpleUploadedFile(
            "my_resume.docx",
            docx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        response = self.client.post(
            '/api/interviews/resumes/upload/',
            {'file': upload_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['file_name'], 'my_resume.docx')
        self.assertEqual(data['file_type'], 'docx')
        self.assertEqual(data['processing_status'], 'completed')

    def test_resume_upload_unsupported_file_type(self):
        upload_file = SimpleUploadedFile("script.exe", b"binarycontent", content_type="application/octet-stream")
        response = self.client.post(
            '/api/interviews/resumes/upload/',
            {'file': upload_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, 400)

    def test_get_active_resume(self):
        # When no resume exists
        response = self.client.get('/api/interviews/resumes/active/')
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()['resume'])

        # Upload a resume
        pdf_bytes = self._create_sample_pdf_bytes()
        upload_file = SimpleUploadedFile("my_resume.pdf", pdf_bytes, content_type="application/pdf")
        self.client.post('/api/interviews/resumes/upload/', {'file': upload_file}, format='multipart')

        response = self.client.get('/api/interviews/resumes/active/')
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()['resume'])
        self.assertEqual(response.json()['resume']['file_name'], 'my_resume.pdf')

    def test_resume_isolation_and_delete(self):
        # Create resume for user
        pdf_bytes = self._create_sample_pdf_bytes()
        upload_file = SimpleUploadedFile("user_resume.pdf", pdf_bytes, content_type="application/pdf")
        res = self.client.post('/api/interviews/resumes/upload/', {'file': upload_file}, format='multipart')
        resume_id = res.json()['id']

        # Log in as other_user and verify 404
        self.client.login(username='otheruser', password='OtherPassword123!')
        res_other = self.client.get(f'/api/interviews/resumes/{resume_id}/')
        self.assertEqual(res_other.status_code, 404)

        del_other = self.client.delete(f'/api/interviews/resumes/{resume_id}/')
        self.assertEqual(del_other.status_code, 404)

        # Log back in as owner and delete successfully
        self.client.login(username='interviewtester', password='TestPassword123!')
        del_res = self.client.delete(f'/api/interviews/resumes/{resume_id}/')
        self.assertEqual(del_res.status_code, 200)

        # Verify it no longer exists
        get_res = self.client.get(f'/api/interviews/resumes/{resume_id}/')
        self.assertEqual(get_res.status_code, 404)

    def test_create_and_start_resume_session(self):
        # First try creating resume session without resume -> should fail
        response = self.client.post(
            '/api/interviews/sessions/',
            {
                'interview_type': 'resume',
                'job_role': 'Full Stack Developer',
                'difficulty': 'medium',
                'total_questions': 3,
            },
        )
        self.assertEqual(response.status_code, 400)

        # Now upload resume
        pdf_bytes = self._create_sample_pdf_bytes()
        upload_file = SimpleUploadedFile("my_resume.pdf", pdf_bytes, content_type="application/pdf")
        res_upload = self.client.post('/api/interviews/resumes/upload/', {'file': upload_file}, format='multipart')
        resume_id = res_upload.json()['id']

        # Create session with resume
        response = self.client.post(
            '/api/interviews/sessions/',
            {
                'interview_type': 'resume',
                'job_role': 'Full Stack Developer',
                'difficulty': 'medium',
                'total_questions': 3,
                'resume_id': resume_id,
            },
        )
        self.assertEqual(response.status_code, 201)
        session_id = response.json()['id']
        self.assertEqual(response.json()['interview_type'], 'resume')
        self.assertEqual(response.json()['resume_id'], resume_id)

        # Start the session
        start_res = self.client.post(f'/api/interviews/sessions/{session_id}/start/')
        self.assertEqual(start_res.status_code, 200)
        start_data = start_res.json()
        self.assertEqual(start_data['status'], 'in_progress')
        self.assertIn('current_question', start_data)
        self.assertGreater(len(start_data['current_question']['question_text']), 10)

    # ─── Detailed Analytics Tests ───

    def test_detailed_analytics_empty(self):
        response = self.client.get('/api/interviews/analytics/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('summary', data)
        self.assertIn('score_trend', data)
        self.assertIn('competencies', data)
        self.assertIn('categories', data)
        self.assertIn('difficulty_breakdown', data)
        self.assertIn('coding_analytics', data)
        self.assertIn('ai_insights', data)
        self.assertIn('recent_interviews', data)
        self.assertEqual(data['summary']['total_interviews'], 0)
        self.assertEqual(data['summary']['completed_interviews'], 0)
        self.assertEqual(len(data['score_trend']), 0)
        self.assertEqual(len(data['categories']), 5)

    def test_detailed_analytics_populated(self):
        # Create a completed session with evaluation
        session = InterviewSession.objects.create(
            user=self.user,
            interview_type='technical',
            job_role='Software Engineer',
            difficulty='medium',
            total_questions=3,
            status='completed',
            overall_score=88.5,
        )
        q = InterviewQuestion.objects.create(session=session, question_text="Q1", question_order=0)
        ans = InterviewAnswer.objects.create(question=q, answer_text="My solid answer here")
        from interviews.models import InterviewEvaluation
        InterviewEvaluation.objects.create(
            answer=ans,
            knowledge_score=90,
            relevance_score=85,
            completeness_score=88,
            communication_score=91,
            overall_score=88.5,
            strengths=["Strong fundamentals"],
            weaknesses=["Add more examples"],
            suggestions=["Keep practicing"],
        )

        response = self.client.get('/api/interviews/analytics/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['summary']['total_interviews'], 1)
        self.assertEqual(data['summary']['completed_interviews'], 1)
        self.assertEqual(data['summary']['average_interview_score'], 88.5)
        self.assertEqual(len(data['score_trend']), 1)
        self.assertEqual(data['score_trend'][0]['score'], 88.5)
        self.assertEqual(data['competencies']['knowledge']['score'], 90)
        self.assertEqual(data['competencies']['knowledge']['level'], 'Expert')
        self.assertIn("Strong fundamentals", data['ai_insights']['strengths'])

    def test_detailed_analytics_requires_auth(self):
        self.client.logout()
        response = self.client.get('/api/interviews/analytics/')
        self.assertEqual(response.status_code, 403)
