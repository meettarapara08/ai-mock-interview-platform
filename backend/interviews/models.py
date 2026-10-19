from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


# ─── Choices ───

INTERVIEW_TYPE_CHOICES = [
    ('technical', 'Technical'),
    ('behavioral', 'Behavioral'),
    ('hr', 'HR'),
    ('managerial', 'Managerial'),
    ('resume', 'Resume-Based'),
]

DIFFICULTY_CHOICES = [
    ('easy', 'Easy'),
    ('medium', 'Medium'),
    ('hard', 'Hard'),
]

SESSION_STATUS_CHOICES = [
    ('setup', 'Setup'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
]

QUESTION_SOURCE_CHOICES = [
    ('ai_generated', 'AI Generated'),
    ('fallback_bank', 'Fallback Bank'),
]

RESUME_FORMAT_CHOICES = [
    ('pdf', 'PDF'),
    ('docx', 'DOCX'),
]

RESUME_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
]


# ─── Models ───

class Resume(models.Model):
    """Uploaded and parsed user resume."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='resumes',
    )
    file = models.FileField(upload_to='resumes/%Y/%m/')
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=10, choices=RESUME_FORMAT_CHOICES)
    raw_text = models.TextField(blank=True)
    candidate_name = models.CharField(max_length=150, blank=True)
    target_role = models.CharField(max_length=150, blank=True)
    skills = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)
    projects = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True)
    processing_status = models.CharField(
        max_length=20,
        choices=RESUME_STATUS_CHOICES,
        default='pending',
    )
    error_message = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return f"Resume for {self.user.username} ({self.file_name})"


class InterviewSession(models.Model):
    """Represents a single interview practice session for a user."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='interview_sessions',
    )
    resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='interview_sessions',
    )
    interview_type = models.CharField(
        max_length=20,
        choices=INTERVIEW_TYPE_CHOICES,
    )
    job_role = models.CharField(max_length=150)
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='medium',
    )
    total_questions = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(3), MaxValueValidator(15)],
    )
    current_question_index = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=SESSION_STATUS_CHOICES,
        default='setup',
    )
    overall_score = models.FloatField(null=True, blank=True)
    is_ai_generated = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return (
            f"{self.get_interview_type_display()} Interview - "
            f"{self.job_role} ({self.get_status_display()})"
        )


class InterviewQuestion(models.Model):
    """A single question within an interview session."""
    session = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name='questions',
    )
    question_text = models.TextField()
    question_order = models.PositiveIntegerField()
    is_follow_up = models.BooleanField(default=False)
    source = models.CharField(
        max_length=20,
        choices=QUESTION_SOURCE_CHOICES,
        default='ai_generated',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['question_order']
        unique_together = [('session', 'question_order')]

    def __str__(self):
        return f"Q{self.question_order + 1}: {self.question_text[:80]}"


class InterviewAnswer(models.Model):
    """User's answer to an interview question. OneToOne prevents duplicates."""
    question = models.OneToOneField(
        InterviewQuestion,
        on_delete=models.CASCADE,
        related_name='answer',
    )
    answer_text = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer to Q{self.question.question_order + 1}"


class InterviewEvaluation(models.Model):
    """AI evaluation of an interview answer."""
    answer = models.OneToOneField(
        InterviewAnswer,
        on_delete=models.CASCADE,
        related_name='evaluation',
    )
    knowledge_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    relevance_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    completeness_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    communication_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    overall_score = models.FloatField()
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    suggestions = models.JSONField(default=list)
    feedback_text = models.TextField(blank=True)
    is_ai_evaluated = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Eval for Q{self.answer.question.question_order + 1}: {self.overall_score:.1f}"


class QuestionBank(models.Model):
    """Pre-defined fallback questions used when Gemini is unavailable."""
    interview_type = models.CharField(
        max_length=20,
        choices=INTERVIEW_TYPE_CHOICES,
    )
    job_role = models.CharField(max_length=150, blank=True, default='General')
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='medium',
    )
    question_text = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['interview_type', 'difficulty']

    def __str__(self):
        return f"[{self.get_interview_type_display()}/{self.difficulty}] {self.question_text[:60]}"
