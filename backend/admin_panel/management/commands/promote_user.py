from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    """Promote or demote a user to/from staff status.

    Usage:
        python manage.py promote_user <email> [--remove]
    """

    help = 'Promote a user to staff (is_staff=True) or demote with --remove.'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address of the user to modify')
        parser.add_argument(
            '--remove',
            action='store_true',
            help='Demote the user (set is_staff=False) instead of promoting',
        )

    def handle(self, *args, **options):
        email = options['email']
        remove = options['remove']
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f'User with email "{email}" does not exist.')

        if remove:
            if not user.is_staff:
                self.stdout.write(self.style.WARNING(f'User "{email}" is already not staff.'))
                return
            user.is_staff = False
            user.save(update_fields=['is_staff'])
            self.stdout.write(self.style.SUCCESS(f'User "{email}" has been demoted (is_staff=False).'))
        else:
            if user.is_staff:
                self.stdout.write(self.style.WARNING(f'User "{email}" is already staff.'))
                return
            user.is_staff = True
            user.save(update_fields=['is_staff'])
            self.stdout.write(self.style.SUCCESS(f'User "{email}" has been promoted to staff (is_staff=True).'))
