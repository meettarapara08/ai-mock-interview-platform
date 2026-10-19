from django.contrib import admin
from interviews.models import (
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
    InterviewEvaluation,
    QuestionBank,
)


class InterviewQuestionInline(admin.TabularInline):
    model = InterviewQuestion
    extra = 0
    readonly_fields = ['question_text', 'question_order', 'is_follow_up', 'source', 'created_at']


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'interview_type', 'job_role', 'difficulty',
        'status', 'overall_score', 'created_at',
    ]
    list_filter = ['interview_type', 'difficulty', 'status']
    search_fields = ['user__username', 'job_role']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    inlines = [InterviewQuestionInline]


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'question_order', 'is_follow_up', 'source']
    list_filter = ['source', 'is_follow_up']


@admin.register(InterviewAnswer)
class InterviewAnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'question', 'submitted_at']
    readonly_fields = ['submitted_at']


@admin.register(InterviewEvaluation)
class InterviewEvaluationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'answer', 'overall_score', 'knowledge_score',
        'relevance_score', 'is_ai_evaluated',
    ]
    list_filter = ['is_ai_evaluated']


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ['id', 'interview_type', 'difficulty', 'job_role', 'category']
    list_filter = ['interview_type', 'difficulty']
    search_fields = ['question_text', 'job_role']
