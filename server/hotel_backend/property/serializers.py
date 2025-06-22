from rest_framework import serializers
from django.db.models import Avg
from .models import Amenities, Rooms, Areas, RoomImages, AreaImages

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenities
        fields = ['id', 'description']
        
class RoomImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImages
        fields = ['id', 'room_image']
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['room_image'] = instance.room_image.url if instance.room_image else None
        return representation

class AreaImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaImages
        fields = ['id', 'area_image']
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['area_image'] = instance.area_image.url if instance.area_image else None
        return representation

class RoomSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    images = RoomImagesSerializer(many=True, read_only=True)
    
    class Meta:
        model = Rooms
        fields = [
            'id',
            'room_name',
            'room_type',
            'images',
            'bed_type',
            'status',
            'room_price',
            'discount_percent',
            'discounted_price',
            'description',
            'max_guests',
            'amenities',
            'average_rating',
        ]
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.room_price is not None:
            representation['room_price'] = f"₱{float(instance.room_price):,.2f}"
        return representation

    def get_average_rating(self, obj):
        return obj.reviews.aggregate(Avg('rating'))['rating__avg'] or 0

    def get_discounted_price(self, obj):
        try:
            discount_percent = int(obj.discount_percent) if obj.discount_percent is not None else 0
            room_price = float(obj.room_price) if obj.room_price is not None else 0.0
        except (ValueError, TypeError):
            return None
        if discount_percent > 0:
            discounted = room_price * (100 - discount_percent) / 100
            return f"₱{discounted:,.2f}"
        return None

class AreaSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    images = AreaImagesSerializer(many=True, read_only=True)
    
    class Meta:
        model = Areas
        fields = [
            'id',
            'area_name',
            'description',
            'images',
            'status',
            'capacity',
            'price_per_hour',
            'discounted_price',
            'discount_percent',
            'average_rating',
        ]
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.price_per_hour is not None:
            representation['price_per_hour'] = f"₱{float(instance.price_per_hour):,.2f}"
        return representation

    def get_average_rating(self, obj):
        return obj.reviews.aggregate(Avg('rating'))['rating__avg'] or 0
    
    def get_discounted_price(self, obj):
        try:
            discount_percent = int(obj.discount_percent) if obj.discount_percent is not None else 0
            price_per_hour = float(obj.price_per_hour) if obj.price_per_hour is not None else 0.0
        except (ValueError, TypeError):
            return None
        if discount_percent > 0:
            discounted = price_per_hour * (100 - discount_percent) / 100
            return f"₱{discounted:,.2f}"
        return None