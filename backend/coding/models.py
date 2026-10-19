from django.db import models
from django.contrib.auth.models import User


DIFFICULTY_CHOICES = [
    ('easy', 'Easy'),
    ('medium', 'Medium'),
    ('hard', 'Hard'),
]

LANGUAGE_CHOICES = [
    ('python', 'Python 3'),
    ('java', 'Java'),
    ('cpp', 'C++'),
]

SUBMISSION_STATUS_CHOICES = [
    ('accepted', 'Accepted'),
    ('wrong_answer', 'Wrong Answer'),
    ('time_limit_exceeded', 'Time Limit Exceeded'),
    ('compilation_error', 'Compilation Error'),
    ('runtime_error', 'Runtime Error'),
    ('internal_error', 'Internal Error'),
]


class CodingProblem(models.Model):
    """Represents a coding problem for algorithm & data structure practice."""
    title = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='easy',
        db_index=True,
    )
    category = models.CharField(max_length=100, db_index=True)
    description = models.TextField(help_text="Detailed problem statement")
    input_format = models.TextField(blank=True, default="")
    output_format = models.TextField(blank=True, default="")
    constraints = models.TextField(blank=True, default="")
    starter_code = models.JSONField(
        default=dict,
        help_text="Dictionary of starter code snippets keyed by language ('python', 'java', 'cpp')",
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        indexes = [
            models.Index(fields=['difficulty', 'category']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_difficulty_display()})"


class CodingTestCase(models.Model):
    """Test case for a coding problem, including sample (public) and hidden test cases."""
    problem = models.ForeignKey(
        CodingProblem,
        on_delete=models.CASCADE,
        related_name='test_cases',
    )
    input_data = models.TextField(help_text="Standard input provided to user program")
    expected_output = models.TextField(help_text="Expected standard output")
    is_sample = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True if this test case is displayed in examples and used for Run Code",
    )
    explanation = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        kind = "Sample" if self.is_sample else "Hidden"
        return f"{self.problem.title} - {kind} Case #{self.order}"


class CodingSubmission(models.Model):
    """Records a user's code submission and execution evaluation results."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coding_submissions',
        db_index=True,
    )
    problem = models.ForeignKey(
        CodingProblem,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True,
    )
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    code = models.TextField()
    status = models.CharField(
        max_length=30,
        choices=SUBMISSION_STATUS_CHOICES,
        default='wrong_answer',
        db_index=True,
    )
    score = models.PositiveIntegerField(default=0, help_text="Percentage score 0-100")
    passed_test_cases = models.PositiveIntegerField(default=0)
    total_test_cases = models.PositiveIntegerField(default=0)
    execution_time_ms = models.FloatField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    test_results = models.JSONField(
        default=list,
        help_text="Detailed per-case results (status, passed, execution_time, input, expected, actual, stdout)",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'problem', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.problem.title} ({self.status}) [{self.score}%]"
