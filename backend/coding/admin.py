from django.contrib import admin
from .models import CodingProblem, CodingTestCase, CodingSubmission


class CodingTestCaseInline(admin.TabularInline):
    model = CodingTestCase
    extra = 1
    fields = ('order', 'is_sample', 'input_data', 'expected_output', 'explanation')


@admin.register(CodingProblem)
class CodingProblemAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'difficulty', 'category', 'order', 'created_at')
    list_filter = ('difficulty', 'category')
    search_fields = ('title', 'description', 'category')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [CodingTestCaseInline]


@admin.register(CodingTestCase)
class CodingTestCaseAdmin(admin.ModelAdmin):
    list_display = ('problem', 'order', 'is_sample', 'created_brief')
    list_filter = ('is_sample', 'problem')
    search_fields = ('problem__title', 'input_data', 'expected_output')

    def created_brief(self, obj):
        return f"{obj.input_data[:30]} -> {obj.expected_output[:30]}"
    created_brief.short_description = "I/O Preview"


@admin.register(CodingSubmission)
class CodingSubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'problem', 'language', 'status', 'score', 'execution_time_ms', 'created_at')
    list_filter = ('status', 'language', 'created_at')
    search_fields = ('user__username', 'problem__title', 'code')
    readonly_fields = ('created_at',)
