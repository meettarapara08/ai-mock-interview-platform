from django.urls import path
from .views import (
    ProblemListView,
    ProblemDetailView,
    RunCodeView,
    SubmitCodeView,
    ProblemSubmissionsView,
    SubmissionDetailView,
)

urlpatterns = [
    path('problems/', ProblemListView.as_view(), name='coding-problem-list'),
    path('problems/<slug:slug>/', ProblemDetailView.as_view(), name='coding-problem-detail'),
    path('problems/<slug:slug>/run/', RunCodeView.as_view(), name='coding-problem-run'),
    path('problems/<slug:slug>/submit/', SubmitCodeView.as_view(), name='coding-problem-submit'),
    path('problems/<slug:slug>/submissions/', ProblemSubmissionsView.as_view(), name='coding-problem-submissions'),
    path('submissions/<int:pk>/', SubmissionDetailView.as_view(), name='coding-submission-detail'),
]
