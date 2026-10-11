from django.test import TestCase, Client
from django.contrib.auth.models import User
from accounts.models import Profile

class AccountsAuthTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'User',
            'target_role': 'Frontend Developer',
            'experience_level': 'mid',
        }

    def test_csrf_token_endpoint(self):
        response = self.client.get('/api/auth/csrf/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('csrfToken', response.json())
        self.assertTrue(len(response.json()['csrfToken']) > 0)

    def test_user_registration(self):
        response = self.client.post('/api/auth/register/', self.register_data, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('user', data)
        self.assertEqual(data['user']['username'], 'testuser')
        self.assertEqual(data['user']['email'], 'testuser@example.com')
        self.assertEqual(data['user']['profile']['target_role'], 'Frontend Developer')
        self.assertEqual(data['user']['profile']['experience_level'], 'mid')

        # Verify password is not plaintext
        user = User.objects.get(username='testuser')
        self.assertTrue(user.check_password('SecurePassword123!'))

        # Verify authenticated via session
        me_resp = self.client.get('/api/auth/me/')
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()['username'], 'testuser')

    def test_user_login_and_logout(self):
        # Register first
        self.client.post('/api/auth/register/', self.register_data, content_type='application/json')
        # Logout
        logout_resp = self.client.post('/api/auth/logout/')
        self.assertEqual(logout_resp.status_code, 200)

        # Unauthenticated request should fail
        me_resp = self.client.get('/api/auth/me/')
        self.assertEqual(me_resp.status_code, 403)

        # Login with email
        login_resp = self.client.post(
            '/api/auth/login/',
            {'username': 'testuser@example.com', 'password': 'SecurePassword123!'},
            content_type='application/json'
        )
        self.assertEqual(login_resp.status_code, 200)

        # Now me should succeed
        me_resp2 = self.client.get('/api/auth/me/')
        self.assertEqual(me_resp2.status_code, 200)

    def test_profile_update(self):
        self.client.post('/api/auth/register/', self.register_data, content_type='application/json')

        update_payload = {
            'first_name': 'UpdatedFirst',
            'target_role': 'Full Stack Engineer',
            'skills': 'React, Python, Django, MySQL',
            'bio': 'Passionate builder',
        }
        resp = self.client.patch('/api/profile/', update_payload, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['user']
        self.assertEqual(data['first_name'], 'UpdatedFirst')
        self.assertEqual(data['profile']['target_role'], 'Full Stack Engineer')
        self.assertEqual(data['profile']['skills'], 'React, Python, Django, MySQL')
        self.assertEqual(data['profile']['bio'], 'Passionate builder')

    def test_change_password(self):
        self.client.post('/api/auth/register/', self.register_data, content_type='application/json')

        # Change password
        resp = self.client.post(
            '/api/auth/change-password/',
            {'old_password': 'SecurePassword123!', 'new_password': 'NewPassword456!'},
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)

        # Verify old password fails
        self.client.post('/api/auth/logout/')
        bad_login = self.client.post(
            '/api/auth/login/',
            {'username': 'testuser', 'password': 'SecurePassword123!'},
            content_type='application/json'
        )
        self.assertEqual(bad_login.status_code, 400)

        # Verify new password succeeds
        good_login = self.client.post(
            '/api/auth/login/',
            {'username': 'testuser', 'password': 'NewPassword456!'},
            content_type='application/json'
        )
        self.assertEqual(good_login.status_code, 200)
