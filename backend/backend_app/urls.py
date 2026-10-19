from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('accounts.profile_urls')),
    path('api/interviews/', include('interviews.urls')),
    path('api/coding/', include('coding.urls')),
    path('api/notifications/', include('accounts.notification_urls')),
]

