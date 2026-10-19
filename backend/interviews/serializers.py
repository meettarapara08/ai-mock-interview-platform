from rest_framework import serializers
from interviews.models import (
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
    InterviewEvaluation,
    Resume,
    INTERVIEW_TYPE_CHOICES,
    DIFFICULTY_CHOICES,
)


class InterviewEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewEvaluation
        fields = [
            'id',
            'knowledge_score',
            'relevance_score',
            'completeness_score',
            'communication_score',
            'overall_score',
            'strengths',
            'weaknesses',
            'suggestions',
            'feedback_text',
            'is_ai_evaluated',
            'created_at',
        ]
        read_only_fields = fields


class InterviewAnswerSerializer(serializers.ModelSerializer):
    evaluation = InterviewEvaluationSerializer(read_only=True)

    class Meta:
        model = InterviewAnswer
        fields = ['id', 'answer_text', 'submitted_at', 'evaluation']
        read_only_fields = ['id', 'submitted_at', 'evaluation']


class InterviewQuestionSerializer(serializers.ModelSerializer):
    answer = InterviewAnswerSerializer(read_only=True)

    class Meta:
        model = InterviewQuestion
        fields = [
            'id',
            'question_text',
            'question_order',
            'is_follow_up',
            'source',
            'created_at',
            'answer',
        ]
        read_only_fields = fields


class InterviewQuestionBriefSerializer(serializers.ModelSerializer):
    """Lighter serializer for question display during an active session (no answer)."""
    class Meta:
        model = InterviewQuestion
        fields = [
            'id',
            'question_text',
            'question_order',
            'is_follow_up',
            'source',
        ]
        read_only_fields = fields


class ResumeSerializer(serializers.ModelSerializer):
    """Full serializer for Resume model with extracted fields."""
    class Meta:
        model = Resume
        fields = [
            'id',
            'file',
            'file_name',
            'file_size',
            'file_type',
            'candidate_name',
            'target_role',
            'skills',
            'experience',
            'projects',
            'education',
            'certifications',
            'summary',
            'processing_status',
            'error_message',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'file_name', 'file_size', 'file_type',
            'candidate_name', 'target_role', 'skills', 'experience',
            'projects', 'education', 'certifications', 'summary',
            'processing_status', 'error_message', 'created_at', 'updated_at',
        ]


class ResumeUploadSerializer(serializers.Serializer):
    """Validates uploaded resume file type and size."""
    file = serializers.FileField(required=True)

    def validate_file(self, value):
        name = value.name.lower()
        if not (name.endswith('.pdf') or name.endswith('.docx')):
            raise serializers.ValidationError(
                "Only PDF (.pdf) and Word (.docx) documents are supported."
            )
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "File size exceeds 5MB limit. Please upload a smaller document."
            )
        return value


class InterviewSessionListSerializer(serializers.ModelSerializer):
    """Serializer for listing interview sessions (history)."""
    interview_type_display = serializers.CharField(
        source='get_interview_type_display', read_only=True,
    )
    difficulty_display = serializers.CharField(
        source='get_difficulty_display', read_only=True,
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True,
    )
    questions_answered = serializers.SerializerMethodField()
    resume_id = serializers.PrimaryKeyRelatedField(
        source='resume', read_only=True,
    )

    class Meta:
        model = InterviewSession
        fields = [
            'id',
            'resume_id',
            'interview_type',
            'interview_type_display',
            'job_role',
            'difficulty',
            'difficulty_display',
            'total_questions',
            'current_question_index',
            'status',
            'status_display',
            'overall_score',
            'is_ai_generated',
            'created_at',
            'completed_at',
            'questions_answered',
        ]
        read_only_fields = fields

    def get_questions_answered(self, obj):
        return obj.questions.filter(answer__isnull=False).count()


class InterviewSessionDetailSerializer(InterviewSessionListSerializer):
    """Serializer with nested questions for session detail view."""
    questions = InterviewQuestionSerializer(many=True, read_only=True)
    resume = ResumeSerializer(read_only=True)

    class Meta(InterviewSessionListSerializer.Meta):
        fields = InterviewSessionListSerializer.Meta.fields + ['questions', 'resume']


class InterviewSessionCreateSerializer(serializers.Serializer):
    """Validates input for creating a new interview session."""
    interview_type = serializers.ChoiceField(choices=INTERVIEW_TYPE_CHOICES)
    job_role = serializers.CharField(max_length=150, required=True)
    difficulty = serializers.ChoiceField(choices=DIFFICULTY_CHOICES, default='medium')
    total_questions = serializers.IntegerField(min_value=3, max_value=15, default=5)
    resume_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_job_role(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Job role cannot be empty.")
        return val

    def validate(self, attrs):
        user = self.context['request'].user
        interview_type = attrs.get('interview_type')
        resume_id = attrs.get('resume_id')

        if interview_type == 'resume':
            resume = None
            if resume_id:
                resume = Resume.objects.filter(id=resume_id, user=user).first()
                if not resume:
                    raise serializers.ValidationError({
                        'resume_id': "Specified resume does not exist or does not belong to you."
                    })
            else:
                resume = Resume.objects.filter(user=user, is_active=True).first()
                if not resume:
                    raise serializers.ValidationError({
                        'resume_id': "Please upload a resume first to start a resume-based interview."
                    })
            attrs['resolved_resume'] = resume

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        resume = validated_data.get('resolved_resume')
        return InterviewSession.objects.create(
            user=user,
            resume=resume,
            interview_type=validated_data['interview_type'],
            job_role=validated_data['job_role'],
            difficulty=validated_data.get('difficulty', 'medium'),
            total_questions=validated_data.get('total_questions', 5),
            status='setup',
        )


class AnswerSubmitSerializer(serializers.Serializer):
    """Validates answer submission input."""
    answer_text = serializers.CharField(min_length=10, required=True)

    def validate_answer_text(self, value):
        val = value.strip()
        if len(val) < 10:
            raise serializers.ValidationError(
                "Answer must be at least 10 characters long."
            )
        return val
