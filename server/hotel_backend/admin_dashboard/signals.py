from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Bookings
from booking.serializers import BookingSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@receiver(post_save, sender=Bookings)
def send_active_count_update(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    bookings = Bookings.objects.exclude(
        status__in=['rejected', 'cancelled', 'no_show', 'checked_out']
    ).order_by('-created_at')
    count = bookings.count()
    serialized_bookings = BookingSerializer(bookings, many=True).data
    
    async_to_sync(channel_layer.group_send)(
        'admin_notifications',
        {
            'type': 'bookings_update',
            'count': count,
            'bookings': serialized_bookings
        }
    )