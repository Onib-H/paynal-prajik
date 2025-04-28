from django.urls import path
from . import consumers

websockets_urlpatterns = [
    path('ws/admin_dashboard/pending-bookings', consumers.PendingBookingConsumer.as_asgi()),
]