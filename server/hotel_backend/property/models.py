from django.db import models
from cloudinary.models import CloudinaryField

# Create your models here.
class Amenities(models.Model):
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'amenities'

class Rooms(models.Model):
    ROOM_STATUS_CHOICES = [
        ('available', 'Available'),
        ('maintenance', 'Maintenance'),
    ]
    ROOM_TYPE_CHOICES = [
        ('premium', 'Premium'),
        ('suites', 'Suites'),
    ]
    BED_TYPE_CHOICES = [
        ('single', 'Single'),
        ('twin', 'Twin'),
        ('double', 'Double'),
        ('queen', 'Queen'),
        ('king', 'King'),
    ]
    room_name = models.CharField(max_length=100, null=False, default="Room")
    room_type = models.CharField(
        max_length=20,
        choices=ROOM_TYPE_CHOICES,
        default='premium',
    )
    bed_type = models.CharField(
        max_length=20,
        choices=BED_TYPE_CHOICES,
        default='single',
    )
    status = models.CharField(
        max_length=20,
        choices=ROOM_STATUS_CHOICES,
        default='available',
    )
    room_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    room_image = CloudinaryField('room_image', null=False, blank=False)
    description = models.TextField(blank=True)
    capacity = models.TextField(max_length=100, null=False)
    max_guests = models.PositiveIntegerField(default=2, help_text="Maximum number of guests allowed")
    amenities = models.ManyToManyField(Amenities, related_name='rooms', blank=True)
    
    class Meta:
        db_table = 'rooms'

class Areas(models.Model):
    AREA_STATUS_CHOICES = [
        ('available', 'Available'),
        ('maintenance', 'Maintenance'),
    ]
    
    area_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    capacity = models.IntegerField()
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(
        max_length=20,
        choices=AREA_STATUS_CHOICES,
        default='available',
    )
    area_image = CloudinaryField('area_image', null=True, blank=True)
    
    class Meta:
        db_table = 'areas'