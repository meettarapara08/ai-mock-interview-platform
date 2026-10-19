from django.db import models
from django.contrib.auth.models import User

EXPERIENCE_LEVEL_CHOICES = [
    ('entry', 'Entry Level / Student'),
    ('mid', 'Mid Level (1-3 yrs)'),
    ('senior', 'Senior (3-7 yrs)'),
    ('lead', 'Lead / Staff (7+ yrs)'),
]

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    target_role = models.CharField(max_length=150, default='Software Engineer', blank=True)
    experience_level = models.CharField(max_length=30, choices=EXPERIENCE_LEVEL_CHOICES, default='entry')
    phone = models.CharField(max_length=30, blank=True)
    bio = models.TextField(blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated skills (e.g. React, Python, Django)")
    education = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


NOTIFICATION_TYPE_CHOICES = [
    ('system', 'System'),
    ('interview', 'Interview'),
    ('coding', 'Coding'),
    ('achievement', 'Achievement'),
]


class Notification(models.Model):
    """Represents a notification for a user."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='system',
    )
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"

