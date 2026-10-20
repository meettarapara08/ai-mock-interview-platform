from django.urls import path
from .views import (
    AdminDashboardView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserStatusToggleView,
    AdminQuestionBankListCreateView,
    AdminQuestionBankDetailView,
    AdminJobRoleListCreateView,
    AdminJobRoleDetailView,
    AdminCodingProblemListCreateView,
    AdminCodingProblemDetailView,
    AdminCodingTestCaseCreateView,
    AdminCodingTestCaseDetailView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('users/<int:pk>/toggle-status/', AdminUserStatusToggleView.as_view(), name='admin_user_toggle_status'),
    path('questions/', AdminQuestionBankListCreateView.as_view(), name='admin_question_list_create'),
    path('questions/<int:pk>/', AdminQuestionBankDetailView.as_view(), name='admin_question_detail'),
    # Job Roles & Skills Management
    path('roles/', AdminJobRoleListCreateView.as_view(), name='admin_role_list_create'),
    path('roles/<int:pk>/', AdminJobRoleDetailView.as_view(), name='admin_role_detail'),
    # Coding Problem Management
    path('coding/problems/', AdminCodingProblemListCreateView.as_view(), name='admin_coding_problem_list_create'),
    path('coding/problems/<int:pk>/', AdminCodingProblemDetailView.as_view(), name='admin_coding_problem_detail'),
    path('coding/problems/<int:problem_id>/test-cases/', AdminCodingTestCaseCreateView.as_view(), name='admin_coding_test_case_create'),
    path('coding/test-cases/<int:pk>/', AdminCodingTestCaseDetailView.as_view(), name='admin_coding_test_case_detail'),
]

