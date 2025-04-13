from django.db import models
from property.models import Rooms, Areas
from user_roles.models import CustomUsers
from django.utils.timezone import now
from cloudinary.models import CloudinaryField
from django.contrib.auth import get_user_model
from property.models import Rooms, Areas

User = get_user_model()

# Create your models here.
class Bookings(models.Model):
    BOOKING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reserved', 'Reserved'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
        ('missed_reservation', 'Missed Reservation'),
    ]
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Rooms, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    area = models.ForeignKey(Areas, on_delete=models.CASCADE, related_name='area_bookings', null=True, blank=True)
    check_in_date = models.DateField(null=False, blank=False)
    check_out_date = models.DateField(null=False, blank=False)
    status = models.CharField(
        max_length=20,
        choices=BOOKING_STATUS_CHOICES,
        default='pending',
    )
    valid_id = CloudinaryField('valid_id', null=False, blank=False)
    special_request = models.TextField(null=True, blank=True)
    cancellation_date = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_venue_booking = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    time_of_arrival = models.TimeField(null=True, blank=True, default=None)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    payment_status = models.CharField(max_length=20, default='unpaid')
    number_of_guests = models.PositiveIntegerField(default=1)
    
    class Meta:
        db_table = 'bookings'
    
    def __str__(self):
        if self.is_venue_booking and self.area:
            return f"{self.user.email} - {self.area.area_name} - {self.status}"
        elif self.room:
            return f"{self.user.email} - {self.room.room_number} - {self.status}"
        else:
            return f"{self.user.email} - Unknown Property - {self.status}"
    
    def is_editable(self):
        return self.status not in ['reserved', 'checked_in', 'checked_out', 'cancelled', 'rejected']
    
    def is_cancellable(self):
        return self.status in ['pending', 'confirmed', 'reserved']
    
    def is_active(self):
        return self.status in ['confirmed', 'reserved', 'checked_in']
    
    def get_duration_days(self):
        if self.check_in_date and self.check_out_date:
            delta = self.check_out_date - self.check_in_date
            return delta.days
        return 0

class Reservations(models.Model):
    RESERVATION_STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE, related_name='reservations')
    area = models.ForeignKey(Areas, on_delete=models.CASCADE, related_name='reservations')
    start_time = models.DateTimeField(default=now)
    end_time = models.DateTimeField(default=now)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    valid_id = CloudinaryField('valid_id', null=True, blank=True)
    special_request = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=RESERVATION_STATUS_CHOICES,
        default='confirmed',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reservations'

class Transactions(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('booking', 'Booking'),
        ('reservation', 'Reservation'),
        ('cancellation_refund', 'Cancellation Refund'),
    ]
    TRANSACTION_STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
    ]
    booking = models.ForeignKey(Bookings, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    reservation = models.ForeignKey(Reservations, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(
        max_length=30,
        choices=TRANSACTION_TYPE_CHOICES,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=TRANSACTION_STATUS_CHOICES,
        default='pending',
    )
    
    class Meta:
        db_table = 'transactions'

class Reviews(models.Model):
    booking = models.ForeignKey(Bookings, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE, related_name='reviews')
    review_text = models.TextField(blank=True)
    rating = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name="valid_rating"
            )
        ]
        db_table = 'reviews'
