from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Bookings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@receiver(post_save, sender=Bookings)
def send_active_count_update(sender, instance, created, **kwargs):
    if instance._state.adding or instance.status == 'pending':
        channel_layer = get_channel_layer()
        count = Bookings.objects.exclude(
            status__in=['rejected', 'cancelled', 'no_show', 'checked_out']
        ).count()
        
        async_to_sync(channel_layer.group_send)(
            'admin_notifications',
            {
                'type': 'active_count',
                'count': count
            }
        )