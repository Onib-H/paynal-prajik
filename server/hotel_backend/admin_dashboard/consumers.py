from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from booking.models import Bookings
from booking.serializers import BookingSerializer
import json

class PendingBookingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'admin_notifications'
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        
        bookings = await self.get_active_bookings()
        count = len(bookings)
        await self.send(text_data=json.dumps({
            'type': 'bookings_update',
            'count': count,
            'bookings': bookings
        }))
        
    async def bookings_update(self, event):
        bookings = event['bookings']
        count = event['count']
        await self.send(text_data=json.dumps({
            'type': 'bookings_update',
            'count': count,
            'bookings': bookings
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            if text_data_json.get('type') == 'get_active_bookings':
                bookings = await self.get_active_bookings()
                count = len(bookings)
                await self.send(text_data=json.dumps({
                    'type': 'bookings_update',
                    'count': count,
                    'bookings': bookings
                }))
        except json.JSONDecodeError:
            print(f"Error decoding JSON: {text_data}")

    async def active_count(self, event):
        await self.send(text_data=json.dumps({
            'type': 'active_count',
            'count': event['count']
        }))
    
    @database_sync_to_async
    def get_active_bookings(self):
        bookings = Bookings.objects.exclude(
            status__in=['rejected', 'cancelled', 'no_show', 'checked_out']
        ).order_by('-created_at')
        return BookingSerializer(bookings, many=True).data