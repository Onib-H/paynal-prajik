from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField

# Create your models here.
class CustomUsers(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('guest', 'Guest'),
    ]
    VALID_ID_CHOICES = [
        ('passport', 'Passport'),
        ('driver_license', "Driver's License"),
        ('national_id', 'National ID'),
        ('sss_id', 'SSS ID'),
        ('umid', 'Unified Multi-Purpose ID (UMID)'),
        ('philhealth_id', 'PhilHealth ID'),
        ('prc_id', 'PRC ID'),
        ('student_id', 'Student ID'),
        ('other', 'Other Government-Issued ID'),
    ]
    email = models.EmailField(unique=True, max_length=200)
    password = models.CharField(max_length=200)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='guest',
    )
    is_archived = models.BooleanField(default=False)
    profile_image = CloudinaryField('profile_image', null=True, blank=True)
    last_booking_date = models.DateField(null=True, blank=True)
    valid_id_type = models.CharField(max_length=60, null=True, blank=True, choices=VALID_ID_CHOICES)
    valid_id_front = CloudinaryField('valid_id_front', null=True, blank=True)
    valid_id_back = CloudinaryField('valid_id_back', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    class Meta: 
        db_table = 'users'
    
class Notification(models.Model):
    TYPE_CHOICES = [
        ('reserved', 'Reserved'),
        ('no_show', 'No Show'),
        ('rejected', 'Rejected'),
        ('checkin_reminder', 'Checkin Reminder'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    booking = models.ForeignKey('booking.Bookings', on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
