from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Bookings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@receiver(post_save, sender=Bookings)
def send_pending_count_update(sender, instance, created, **kwargs):
    if created or instance.status == 'pending':
        channel_layer = get_channel_layer()
        count = Bookings.objects.filter(status='pending').count()
        
        async_to_sync(channel_layer.group_send)(
            f'admin_notifications_{instance.user.id}',
            {
                'type': 'pending_update',
                'count': count
            }
        )