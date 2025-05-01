from .models import CustomUsers, Notification
from rest_framework import serializers

class CustomUserSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUsers
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'profile_image',
            'phone_number',
        ]
        extra_kwargs = { 'password': { 'write_only': True } }
        
    def get_profile_image(self, obj):
        if obj.profile_image and hasattr(obj.profile_image, 'url'):
            return obj.profile_image.url
        return None

    def create(self, validated_data):
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email')
        password = validated_data.pop('password', None)
        user = CustomUsers(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

class NotificationSerializer(serializers.ModelSerializer):
    booking_id = serializers.SerializerMethodField()
    
    def get_booking_id(self, obj):
        return str(obj.booking.id) if obj.booking else None
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'message',
            'notification_type',
            # 'booking',
            'booking_id',
            'is_read',
            'created_at'
        ]