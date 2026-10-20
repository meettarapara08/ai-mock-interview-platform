from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils.text import slugify
from accounts.models import Profile
from interviews.models import InterviewSession, QuestionBank, JobRole
from coding.models import CodingProblem, CodingTestCase, CodingSubmission


class AdminUserListSerializer(serializers.ModelSerializer):
    target_role = serializers.SerializerMethodField()
    experience_level = serializers.SerializerMethodField()
    interviews_count = serializers.IntegerField(default=0, read_only=True)
    submissions_count = serializers.IntegerField(default=0, read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
            'target_role',
            'experience_level',
            'interviews_count',
            'submissions_count',
        ]
        read_only_fields = fields

    def get_target_role(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.target_role
        return 'Software Engineer'

    def get_experience_level(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.experience_level
        return 'entry'


class AdminProfileDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'target_role',
            'experience_level',
            'phone',
            'bio',
            'skills',
            'education',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class AdminRecentInterviewSerializer(serializers.ModelSerializer):
    interview_type_display = serializers.CharField(source='get_interview_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = InterviewSession
        fields = [
            'id',
            'interview_type',
            'interview_type_display',
            'job_role',
            'difficulty',
            'status',
            'status_display',
            'overall_score',
            'created_at',
            'completed_at',
        ]
        read_only_fields = fields


class AdminRecentSubmissionSerializer(serializers.ModelSerializer):
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    problem_slug = serializers.CharField(source='problem.slug', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    language_display = serializers.CharField(source='get_language_display', read_only=True)

    class Meta:
        model = CodingSubmission
        fields = [
            'id',
            'problem_title',
            'problem_slug',
            'language',
            'language_display',
            'status',
            'status_display',
            'score',
            'execution_time_ms',
            'created_at',
        ]
        read_only_fields = fields


class AdminUserDetailSerializer(serializers.ModelSerializer):
    profile = AdminProfileDetailSerializer(read_only=True)
    interviews_count = serializers.IntegerField(default=0, read_only=True)
    submissions_count = serializers.IntegerField(default=0, read_only=True)
    recent_interviews = serializers.SerializerMethodField()
    recent_submissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
            'last_login',
            'profile',
            'interviews_count',
            'submissions_count',
            'recent_interviews',
            'recent_submissions',
        ]
        read_only_fields = fields

    def get_recent_interviews(self, obj):
        sessions = obj.interview_sessions.order_by('-created_at')[:5]
        return AdminRecentInterviewSerializer(sessions, many=True).data

    def get_recent_submissions(self, obj):
        submissions = obj.coding_submissions.select_related('problem').order_by('-created_at')[:5]
        return AdminRecentSubmissionSerializer(submissions, many=True).data


class AdminQuestionBankSerializer(serializers.ModelSerializer):
    interview_type_display = serializers.CharField(source='get_interview_type_display', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)

    class Meta:
        model = QuestionBank
        fields = [
            'id',
            'interview_type',
            'interview_type_display',
            'job_role',
            'difficulty',
            'difficulty_display',
            'question_text',
            'category',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_question_text(self, value):
        val = value.strip()
        if len(val) < 5:
            raise serializers.ValidationError("Question text must be at least 5 characters long.")
        return val

    def validate_job_role(self, value):
        val = value.strip()
        return val if val else 'General'


class AdminJobRoleSerializer(serializers.ModelSerializer):
    skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
    )

    class Meta:
        model = JobRole
        fields = [
            'id',
            'title',
            'slug',
            'category',
            'description',
            'skills',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'slug': {'required': False},
        }

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'skills' in data and isinstance(data['skills'], str):
            parts = [s.strip() for s in data['skills'].split(',') if s.strip()]
            data['skills'] = parts
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'])
        elif data.get('slug'):
            data['slug'] = slugify(data['slug'])
        return super().to_internal_value(data)

    def validate_title(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Job role title cannot be empty.")
        return val



class AdminCodingTestCaseSerializer(serializers.ModelSerializer):
    input_data = serializers.CharField(trim_whitespace=False, allow_blank=True, default="")
    expected_output = serializers.CharField(trim_whitespace=False)

    class Meta:
        model = CodingTestCase
        fields = [
            'id',
            'problem',
            'input_data',
            'expected_output',
            'is_sample',
            'explanation',
            'order',
        ]
        read_only_fields = ['id', 'problem']


class AdminCodingProblemListSerializer(serializers.ModelSerializer):
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    test_cases_count = serializers.IntegerField(default=0, read_only=True)
    submissions_count = serializers.IntegerField(default=0, read_only=True)

    class Meta:
        model = CodingProblem
        fields = [
            'id',
            'title',
            'slug',
            'difficulty',
            'difficulty_display',
            'category',
            'description',
            'order',
            'created_at',
            'updated_at',
            'test_cases_count',
            'submissions_count',
        ]
        read_only_fields = fields


class AdminCodingProblemDetailSerializer(serializers.ModelSerializer):
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    test_cases = AdminCodingTestCaseSerializer(many=True, read_only=True)
    test_cases_count = serializers.IntegerField(default=0, read_only=True)
    submissions_count = serializers.IntegerField(default=0, read_only=True)

    class Meta:
        model = CodingProblem
        fields = [
            'id',
            'title',
            'slug',
            'difficulty',
            'difficulty_display',
            'category',
            'description',
            'input_format',
            'output_format',
            'constraints',
            'starter_code',
            'order',
            'created_at',
            'updated_at',
            'test_cases',
            'test_cases_count',
            'submissions_count',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'test_cases', 'test_cases_count', 'submissions_count']
        extra_kwargs = {
            'slug': {'required': False},
        }

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'])
        elif data.get('slug'):
            data['slug'] = slugify(data['slug'])
        return super().to_internal_value(data)

    def validate_title(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Problem title cannot be empty.")
        return val



