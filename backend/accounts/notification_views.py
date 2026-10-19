from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification
from .notification_serializers import NotificationSerializer


class NotificationListView(APIView):
    """
    List notifications for the authenticated user.
    Supports ?limit=N (default 30).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = request.query_params.get('limit', 30)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 30

        notifications = Notification.objects.filter(
            user=request.user
        ).order_by('-created_at')[:limit]

        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            'notifications': serializer.data,
            'unread_count': Notification.objects.filter(user=request.user, is_read=False).count(),
        })


class NotificationUnreadCountView(APIView):
    """Get the unread notification count for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class NotificationMarkReadView(APIView):
    """Mark a single notification as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'success': True, 'notification': NotificationSerializer(notification).data})


class NotificationMarkAllReadView(APIView):
    """Mark all unread notifications as read for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(is_read=True)

        return Response({
            'success': True,
            'marked_read_count': updated_count,
        })
