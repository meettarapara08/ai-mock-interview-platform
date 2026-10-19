from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile, Notification

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)
        # Create welcome notification for new users
        Notification.objects.get_or_create(
            user=instance,
            title="Welcome to AI Mock Interview Platform!",
            defaults={
                'message': "Get started by setting up your profile or launching your first mock interview.",
                'notification_type': 'system',
                'link': '/interview/setup',
            }
        )
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()


@receiver(post_save, sender='interviews.InterviewSession')
def create_interview_completion_notification(sender, instance, **kwargs):
    """Notify user when an interview session is marked completed."""
    if instance.status == 'completed':
        link = f'/interview/result/{instance.pk}'
        # Avoid duplicate notifications for the same interview
        if not Notification.objects.filter(user=instance.user, link=link).exists():
            score_str = f" with a score of {int(instance.overall_score)}%" if instance.overall_score is not None else ""
            type_label = instance.get_interview_type_display() if hasattr(instance, 'get_interview_type_display') else instance.interview_type
            Notification.objects.create(
                user=instance.user,
                title="Interview Completed!",
                message=f"You completed your {type_label} interview for {instance.job_role}{score_str}.",
                notification_type='interview',
                link=link,
            )

