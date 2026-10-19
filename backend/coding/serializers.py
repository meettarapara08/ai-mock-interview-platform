from rest_framework import serializers
from .models import CodingProblem, CodingTestCase, CodingSubmission


class CodingTestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingTestCase
        fields = ['id', 'input_data', 'expected_output', 'is_sample', 'explanation', 'order']


class CodingProblemListSerializer(serializers.ModelSerializer):
    total_test_cases = serializers.SerializerMethodField()
    user_status = serializers.SerializerMethodField()

    class Meta:
        model = CodingProblem
        fields = [
            'id',
            'title',
            'slug',
            'difficulty',
            'category',
            'order',
            'total_test_cases',
            'user_status',
            'created_at',
        ]

    def get_total_test_cases(self, obj):
        return obj.test_cases.count()

    def get_user_status(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user or not user.is_authenticated:
            return 'unsolved'

        submissions = obj.submissions.filter(user=user)
        if submissions.filter(status='accepted').exists():
            return 'solved'
        elif submissions.exists():
            return 'attempted'
        return 'unsolved'


class CodingProblemDetailSerializer(serializers.ModelSerializer):
    sample_test_cases = serializers.SerializerMethodField()
    user_status = serializers.SerializerMethodField()

    class Meta:
        model = CodingProblem
        fields = [
            'id',
            'title',
            'slug',
            'difficulty',
            'category',
            'description',
            'input_format',
            'output_format',
            'constraints',
            'starter_code',
            'sample_test_cases',
            'user_status',
            'order',
            'created_at',
        ]

    def get_sample_test_cases(self, obj):
        samples = obj.test_cases.filter(is_sample=True).order_by('order', 'id')
        return CodingTestCaseSerializer(samples, many=True).data

    def get_user_status(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user or not user.is_authenticated:
            return 'unsolved'

        submissions = obj.submissions.filter(user=user)
        if submissions.filter(status='accepted').exists():
            return 'solved'
        elif submissions.exists():
            return 'attempted'
        return 'unsolved'


class CodingSubmissionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingSubmission
        fields = [
            'id',
            'language',
            'status',
            'score',
            'passed_test_cases',
            'total_test_cases',
            'execution_time_ms',
            'created_at',
        ]


class CodingSubmissionDetailSerializer(serializers.ModelSerializer):
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    problem_slug = serializers.CharField(source='problem.slug', read_only=True)

    class Meta:
        model = CodingSubmission
        fields = [
            'id',
            'problem_title',
            'problem_slug',
            'language',
            'code',
            'status',
            'score',
            'passed_test_cases',
            'total_test_cases',
            'execution_time_ms',
            'error_message',
            'test_results',
            'created_at',
        ]


class RunCodeRequestSerializer(serializers.Serializer):
    language = serializers.ChoiceField(choices=['python', 'java', 'cpp'])
    code = serializers.CharField(max_length=65536)
    custom_input = serializers.CharField(required=False, allow_blank=True, default="")


class SubmitCodeRequestSerializer(serializers.Serializer):
    language = serializers.ChoiceField(choices=['python', 'java', 'cpp'])
    code = serializers.CharField(max_length=65536)
