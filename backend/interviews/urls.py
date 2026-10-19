from django.urls import path
from interviews.views import (
    InterviewConfigView,
    InterviewSessionListCreateView,
    InterviewSessionDetailView,
    InterviewStartView,
    CurrentQuestionView,
    AnswerSubmitView,
    InterviewCompleteView,
    InterviewReportView,
    DashboardAnalyticsView,
)

urlpatterns = [
    path('config/', InterviewConfigView.as_view(), name='interview_config'),
    path('dashboard/', DashboardAnalyticsView.as_view(), name='interview_dashboard'),
    path('sessions/', InterviewSessionListCreateView.as_view(), name='interview_sessions'),
    path('sessions/<int:session_id>/', InterviewSessionDetailView.as_view(), name='interview_session_detail'),
    path('sessions/<int:session_id>/start/', InterviewStartView.as_view(), name='interview_start'),
    path('sessions/<int:session_id>/current-question/', CurrentQuestionView.as_view(), name='interview_current_question'),
    path('sessions/<int:session_id>/answer/', AnswerSubmitView.as_view(), name='interview_answer'),
    path('sessions/<int:session_id>/complete/', InterviewCompleteView.as_view(), name='interview_complete'),
    path('sessions/<int:session_id>/report/', InterviewReportView.as_view(), name='interview_report'),
]
