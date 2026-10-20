from rest_framework.permissions import BasePermission


class IsAdminStaffUser(BasePermission):
    """
    Allows access only to authenticated users who possess staff (admin) privileges.
    """
    message = "You do not have administrative privileges to access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )
