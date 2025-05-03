from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from booking.models import Bookings
import json

class PendingBookingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'admin_notifications'
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        
        count = await self.get_active_count()
        await self.send(text_data=json.dumps({
            'type': 'active_count',
            'count': count
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        pass

    async def active_count(self, event):
        await self.send(text_data=json.dumps({
            'type': 'active_count',
            'count': event['count']
        }))
    
    @database_sync_to_async
    def get_active_count(self):
        return Bookings.objects.exclude(
            status__in=['rejected', 'cancelled', 'no_show', 'checked_out']
        ).count()