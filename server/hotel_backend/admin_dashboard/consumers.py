from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from booking.models import Bookings
import json

class PendingBookingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated or not user.is_staff:
            await self.close()
            return
        
        self.group_name = f'admin_notifications_{user}'
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        
        count = await self.get_pending_count()
        await self.send(text_data=json.dumps({
            'type': 'pending_count',
            'count': count
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        pass

    async def pending_update(self, event):
        count = event['count']
        await self.send(text_data=json.dumps({
            'type': 'pending_count',
            'count': count
        }))
    
    @database_sync_to_async
    def get_pending_count(self):
        return Bookings.objects.filter(status='pending').count()