import re
from datetime import datetime
from django.utils import timezone
from rest_framework import serializers
from booking.models import Bookings

def validate_guest_name(name):
    """Validate guest name - letters and spaces only, minimum 2 characters"""
    if not name:
        raise serializers.ValidationError("Guest name is required")
    
    if len(name) < 2:
        raise serializers.ValidationError("Name must be at least 2 characters long")
    
    if not re.match(r'^[A-Za-z\s]+$', name):
        raise serializers.ValidationError("Name should contain only letters and spaces")
    
    return name

def validate_email(email, check_in_date=None, check_out_date=None, is_venue_booking=False):
    """Validate email format and check for overlapping bookings"""
    if not email:
        raise serializers.ValidationError("Email address is required")
    
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise serializers.ValidationError("Invalid email format")
    
    if not is_venue_booking and check_in_date and check_out_date:
        overlapping_bookings = Bookings.objects.filter(
            user__email=email,
            check_in_date__lt=check_out_date,
            check_out_date__gt=check_in_date,
            status__in=['pending', 'reserved', 'confirmed', 'checked_in'],
            is_venue_booking=False
        )
        
        if overlapping_bookings.exists():
            raise serializers.ValidationError("You already have an active booking during this period")
    
    return email

def validate_phone_number(phone_number, check_in_date=None, check_out_date=None):
    """Validate phone number format (PH format with +63 prefix)"""
    if not phone_number:
        raise serializers.ValidationError("Phone number is required")
    
    # Remove all non-digit characters except the + sign
    cleaned_number = re.sub(r'[^\d+]', '', phone_number)
    
    # Check if the phone number has the +63 prefix
    if cleaned_number.startswith('+63'):
        # Remove the +63 prefix to check the remaining digits
        local_number = cleaned_number[3:]
        # Check if the remaining number starts with 9 and has 10 digits total (9 + 9 more)
        if not (len(local_number) == 10 and local_number.startswith('9')):
            raise serializers.ValidationError("Philippine phone number must start with +63 followed by 9 and 9 more digits")
    else:
        # Legacy format starting with 09
        if not re.match(r'^09\d{9}$', cleaned_number):
            raise serializers.ValidationError("Phone number must be in Philippine format: (+63) 9XX XXX XXXX")
    
    return phone_number

def validate_valid_id(valid_id):
    """Validate the uploaded ID"""
    if not valid_id:
        raise serializers.ValidationError("Valid ID is required")
    
    if valid_id.size > 2 * 1024 * 1024:
        raise serializers.ValidationError("ID file size exceeds the limit (2MB max)")
    
    allowed_formats = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    if valid_id.content_type not in allowed_formats:
        raise serializers.ValidationError("ID must be an image file (JPEG, PNG, or GIF)")
    
    return valid_id

def validate_number_of_guests(guests, room_max_guests):
    """Validate number of guests against room capacity"""
    if not guests:
        raise serializers.ValidationError("Number of guests is required")
    
    try:
        guests = int(guests)
    except (ValueError, TypeError):
        raise serializers.ValidationError("Number of guests must be a number")
    
    if guests < 1:
        raise serializers.ValidationError("At least 1 guest is required")
    
    if room_max_guests and guests > room_max_guests:
        raise serializers.ValidationError(f"Maximum capacity for this room is {room_max_guests} guests")
    
    return guests

def validate_dates(check_in_date, check_out_date, is_venue_booking=False):
    """Validate check-in and check-out dates"""
    today = timezone.now().date()
    
    if not check_in_date:
        raise serializers.ValidationError("Check-in date is required")
    
    if not check_out_date:
        raise serializers.ValidationError("Check-out date is required")
    
    if check_in_date < today:
        raise serializers.ValidationError("Check-in date cannot be in the past")
    
    # For venue bookings, allow same-day bookings
    if is_venue_booking:
        if check_out_date < check_in_date:
            raise serializers.ValidationError("Check-out date must be on or after check-in date")
    else:
        if check_out_date <= check_in_date:
            raise serializers.ValidationError("Check-out date must be after check-in date")
    
    max_stay_days = 30
    stay_duration = (check_out_date - check_in_date).days
    if stay_duration > max_stay_days:
        raise serializers.ValidationError(f"Maximum stay duration is {max_stay_days} days")
    
    return check_in_date, check_out_date

def validate_arrival_time(arrival_time):
    """Validate arrival time (must be between 2:00 PM and 10:00 PM)"""
    if not arrival_time:
        raise serializers.ValidationError("Expected time of arrival is required")
    
    try:
        arrival_time_obj = datetime.strptime(arrival_time, "%H:%M").time()
        
        min_time = datetime.strptime("14:00", "%H:%M").time()  # 2:00 PM
        max_time = datetime.strptime("22:00", "%H:%M").time()  # 10:00 PM
        
        if arrival_time_obj < min_time:
            raise serializers.ValidationError("Early check-in is not allowed. Arrival time must be after 2:00 PM.")
        
        if arrival_time_obj > max_time:
            raise serializers.ValidationError("Late arrivals not accepted after 10:00 PM.")
        
    except ValueError:
        raise serializers.ValidationError("Invalid time format")
    
    return arrival_time

def validate_booking_request(data, room):
    """Validate the entire booking request"""
    errors = {}
    
    try:
        validate_guest_name(data.get('firstName', ''))
    except serializers.ValidationError as e:
        errors['firstName'] = str(e.detail[0])
    
    try:
        validate_guest_name(data.get('lastName', ''))
    except serializers.ValidationError as e:
        errors['lastName'] = str(e.detail[0])
    
    is_venue_booking = data.get('isVenueBooking', False)
    
    try:
        validate_email(
            data.get('emailAddress', ''),
            data.get('checkIn'),
            data.get('checkOut'),
            is_venue_booking
        )
    except serializers.ValidationError as e:
        errors['emailAddress'] = str(e.detail[0])
    
    try:
        validate_phone_number(
            data.get('phoneNumber', ''),
            data.get('checkIn'),
            data.get('checkOut')
        )
    except serializers.ValidationError as e:
        errors['phoneNumber'] = str(e.detail[0])
    
    if 'validId' in data:
        try:
            validate_valid_id(data.get('validId'))
        except serializers.ValidationError as e:
            errors['validId'] = str(e.detail[0])
    
    if room:
        try:
            validate_number_of_guests(data.get('numberOfGuests', 1), room.max_guests)
        except serializers.ValidationError as e:
            errors['numberOfGuests'] = str(e.detail[0])
    
    try:
        validate_dates(
            data.get('checkIn'), 
            data.get('checkOut'),
            is_venue_booking
        )
    except serializers.ValidationError as e:
        errors['dates'] = str(e.detail[0])
    
    if not is_venue_booking:
        try:
            validate_arrival_time(data.get('arrivalTime', ''))
        except serializers.ValidationError as e:
            errors['arrivalTime'] = str(e.detail[0])
    
    if room and data.get('checkIn') and data.get('checkOut'):
        check_in = data.get('checkIn')
        check_out = data.get('checkOut')
        
        overlapping_bookings = Bookings.objects.filter(
            room=room,
            check_in_date__lt=check_out,
            check_out_date__gt=check_in,
            status__in=['reserved', 'confirmed', 'checked_in']
        )
        
        if overlapping_bookings.exists():
            errors['room'] = "This room is not available for the selected dates"
    
    return errors
