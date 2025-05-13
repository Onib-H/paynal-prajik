import cloudinary.uploader
from rest_framework import serializers
from .models import Bookings, Reservations, Transactions, Reviews
from user_roles.models import CustomUsers
from user_roles.serializers import CustomUserSerializer
from property.models import Rooms, Amenities, Areas
import cloudinary
from property.serializers import AreaSerializer
from .validations.booking import validate_booking_request
from django.utils import timezone
from datetime import datetime
from django.core.files.uploadedfile import InMemoryUploadedFile, UploadedFile
import uuid

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenities
        fields = ['id', 'description']

class RoomSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    room_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Rooms
        fields = [
            'id',
            'room_name',
            'room_type',
            'bed_type',
            'status',
            'room_price',
            'room_image',
            'description',
            'max_guests',
            'amenities'
        ]
    
    def get_room_image(self, obj):
        if obj.room_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.room_image.url)
            return obj.room_image.url
        return None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.room_price is not None:
            representation['room_price'] = f"₱{float(instance.room_price):,.2f}"
        return representation

class BookingSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()
    room_details = RoomSerializer(source='room', read_only=True)
    area_details = AreaSerializer(source='area', read_only=True)
    payment_proof = serializers.SerializerMethodField()
    payment_method = serializers.CharField(source='get_payment_method_display')
    
    class Meta:
        model = Bookings
        fields = [
            'id',
            'user',
            'room',
            'room_details',
            'area',
            'area_details',
            'check_in_date',
            'check_out_date',
            'status',
            'special_request',
            'cancellation_date',
            'cancellation_reason',
            'time_of_arrival',
            'is_venue_booking',
            'total_price',
            'number_of_guests',
            'created_at',
            'updated_at',
            'payment_method',
            'payment_proof',
            'payment_date',
            'down_payment',
        ]
        
    def get_payment_proof(self, obj):
        if obj.payment_proof:
            if isinstance(obj.payment_proof, str):
                return obj.payment_proof
            return obj.payment_proof.url
        return None
    
    def get_user(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
                'email': obj.user.email,
                'profile_image': obj.user.profile_image.url if obj.user.profile_image else None,
            }
        return None
        
    def get_valid_id(self, obj):
        if obj.valid_id:
            if hasattr(obj.valid_id, 'url'):
                return obj.valid_id.url
            else:
                return obj.valid_id
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)        
        if instance.total_price is not None:
            try:
                representation['total_price'] = f"₱{float(instance.total_price):,.2f}"
                representation['down_payment'] = f"₱{float(instance.down_payment):,.2f}"
            except (ValueError, TypeError):
                pass 
        return representation

class BookingRequestSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=100)
    lastName = serializers.CharField(max_length=100)
    phoneNumber = serializers.CharField(max_length=20)
    specialRequests = serializers.CharField(required=False, allow_blank=True)
    validId = serializers.FileField(required=False)
    roomId = serializers.CharField()
    checkIn = serializers.DateField()
    checkOut = serializers.DateField()
    status = serializers.CharField(default='pending')
    isVenueBooking = serializers.BooleanField(required=False, default=False)
    totalPrice = serializers.DecimalField(required=False, max_digits=10, decimal_places=2)
    arrivalTime = serializers.CharField(required=False, allow_blank=True)
    numberOfGuests = serializers.IntegerField(required=False, default=1)
    paymentMethod = serializers.ChoiceField(choices=Bookings.PAYMENT_METHOD_CHOICES, default='physical')
    paymentProof = serializers.FileField(required=False, allow_null=True, write_only=True)

    def validate(self, data):
        errors = {}
        room = None
        
        payment_method = data.get('payment_method')
        payment_proof = data.get('payment_proof')
        
        if payment_method == 'gcash':
            if not payment_proof:
                raise serializers.ValidationError({{
                    'payment_proof': "Payment proof is required for GCash payments."
                }})
            if not isinstance(payment_proof, (InMemoryUploadedFile, UploadedFile)) and not isinstance(payment_proof, str):
                raise serializers.ValidationError({
                    'payment_proof': "Please upload a valid file."
                })
        
        try:
            if not data.get('isVenueBooking', False):
                room = Rooms.objects.get(id=data.get('roomId'))
        except Rooms.DoesNotExist:
            errors['roomId'] = "Room not found"
            raise serializers.ValidationError(errors)
        
        validation_errors = validate_booking_request(data, room)
        if validation_errors:
            raise serializers.ValidationError(validation_errors)
        
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        
        payment_proof_file = request.FILES.get('paymentProof')
        payment_method = validated_data.get('paymentMethod', 'physical')
        payment_proof_url = None

        print(f'Backend BookingRequestSerializer.create() called with data: ', {
            'validated_data': validated_data,
            'is_venue_booking': validated_data.get('isVenueBooking', False)
        })

        if payment_method == 'gcash':
            try:
                upload_result = cloudinary.uploader.upload(payment_proof_file)
                payment_proof_url = upload_result['secure_url']
            except Exception as e:
                raise serializers.ValidationError(f"Error uploading payment proof: {str(e)}")
        
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            if user.first_name != validated_data['firstName'] or user.last_name != validated_data['lastName']:
                user.first_name = validated_data['firstName']
                user.last_name = validated_data['lastName']
                user.phone_number = validated_data['phoneNumber']
                user.save()
        else:
            if not 'emailAddress' in validated_data:
                if hasattr(request, 'user') and request.user.is_authenticated:
                    user = request.user
                else:
                    unique_id = str(uuid.uuid4())[:8]
                    username = f"guest_{unique_id}"
                    user = CustomUsers.objects.create(
                        username=username,
                        first_name=validated_data['firstName'],
                        last_name=validated_data['lastName'],
                        phone_number=validated_data['phoneNumber'],
                        role='guest'
                    )
            else:
                try:
                    user = CustomUsers.objects.get(email=validated_data['emailAddress'])
                    if user.first_name != validated_data['firstName'] or user.last_name != validated_data['lastName']:
                        user.first_name = validated_data['firstName']
                        user.last_name = validated_data['lastName']
                        user.phone_number = validated_data['phoneNumber']
                        user.save()
                except CustomUsers.DoesNotExist:
                    user = CustomUsers.objects.create(
                        username=validated_data['emailAddress'],
                        email=validated_data['emailAddress'],
                        first_name=validated_data['firstName'],
                        last_name=validated_data['lastName'],
                        phone_number=validated_data['phoneNumber'],
                        role='guest'
                    )

        is_venue_booking = validated_data.get('isVenueBooking', False)

        if hasattr(user, 'role') and user.role == 'guest' and validated_data.get('checkIn'):
            check_in_date = validated_data.get('checkIn')
            today = timezone.now().date()
            if check_in_date == today:
                user.last_booking_date = today
                user.save()

        if is_venue_booking:
            try:
                area_id = validated_data['roomId']
                area = Areas.objects.get(id=area_id)
                
                start_time = None
                end_time = None
                
                if 'startTime' in validated_data and validated_data['startTime']:
                    start_time = datetime.strptime(validated_data['startTime'], "%H:%M").time()    
                if 'endTime' in validated_data and validated_data['endTime']:
                    end_time = datetime.strptime(validated_data['endTime'], "%H:%M").time()
                
                booking = Bookings.objects.create(
                    user=user,
                    area=area,
                    room=None,
                    check_in_date=validated_data['checkIn'],
                    check_out_date=validated_data['checkOut'],
                    status=validated_data.get('status', 'pending'),
                    total_price=validated_data.get('totalPrice'),
                    is_venue_booking=True,
                    time_of_arrival=validated_data.get('arrivalTime'),
                    start_time=start_time,
                    end_time=end_time,
                    number_of_guests=validated_data.get('numberOfGuests', 1),
                    payment_method=payment_method,
                    payment_proof=payment_proof_url,
                    payment_date=timezone.now() if payment_method == 'gcash' else None,
                )

                if user.is_verified != 'verified':
                    user.last_booking_date = timezone.now().date()
                    user.save()
                
                return booking                
            except Exception as e:
                raise serializers.ValidationError(str(e))
        else:
            try:
                room = Rooms.objects.get(id=validated_data['roomId'])
                booking = Bookings.objects.create(
                    user=user,
                    room=room,
                    area=None,
                    check_in_date=validated_data['checkIn'],
                    check_out_date=validated_data['checkOut'],
                    status=validated_data.get('status', 'pending'),
                    special_request=validated_data.get('specialRequests', ''),
                    is_venue_booking=False,
                    total_price=validated_data.get('totalPrice'),
                    time_of_arrival=validated_data.get('arrivalTime'),
                    number_of_guests=validated_data.get('numberOfGuests', 1),
                    payment_method=payment_method,
                    payment_proof=payment_proof_url,
                    payment_date=timezone.now() if payment_method == 'gcash' else None,
                )

                if user.is_verified != 'verified':
                    user.last_booking_date = timezone.now().date()
                    user.save()
                
                return booking
            except Rooms.DoesNotExist:
                raise serializers.ValidationError("Room not found")
            except Exception as e:
                raise serializers.ValidationError(str(e))

class ReservationSerializer(serializers.ModelSerializer):
    guest_name = serializers.SerializerMethodField()
    area_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Reservations
        fields = '__all__'
    
    def get_guest_name(self, obj):
        return obj.user.first_name + " " + obj.user.last_name if obj.user else "Unknown Guest"
    
    def get_area_name(self, obj):
        return obj.area.name if obj.area else "Unknown Area"
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        if instance.total_price is not None:
            try:
                representation['total_price'] = f"₱{float(instance.total_price):,.2f}"
            except (ValueError, TypeError):
                pass
                
        return representation

class TransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Transactions
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    booking_details = serializers.SerializerMethodField()
    user_profile_image = serializers.SerializerMethodField()
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Reviews
        fields = ['id', 'rating', 'user', 'booking', 'review_text', 'created_at', 'room', 'area', 'user_profile_image', 'formatted_date', 'user_name', 'booking_details']
        read_only_fields = ['user', 'room', 'area', 'booking']
    
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return "Anonymous"
    
    def get_user_profile_image(self, obj):
        if obj.user and obj.user.profile_image:
            request = self.context.get('request')
            if request and hasattr(obj.user.profile_image, 'url'):
                return request.build_absolute_uri(obj.user.profile_image.url)
            return obj.user.profile_image.url if hasattr(obj.user.profile_image, 'url') else None
        return None
    
    def get_formatted_date(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%B %d, %Y')
        return None
    
    def get_booking_details(self, obj):
        if obj.booking:
            if obj.booking.is_venue_booking and obj.booking.area:
                return {
                    "type": "venue",
                    "name": obj.booking.area.area_name if obj.booking.area else "Unknown Venue",
                    "check_in_date": obj.booking.check_in_date,
                    "check_out_date": obj.booking.check_out_date
                }
            else:
                return {
                    "type": "room",
                    "name": obj.booking.room.room_name if obj.booking.room else "Unknown Room",
                    "check_in_date": obj.booking.check_in_date,
                    "check_out_date": obj.booking.check_out_date
                }
        return None
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['booking'] = self.context['booking']
        
        if validated_data['booking'].is_venue_booking:
            validated_data['area'] = validated_data['booking'].area
        else:
            validated_data['room'] = validated_data['booking'].room
            
        return super().create(validated_data)