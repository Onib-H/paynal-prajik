from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField 

# Create your models here.
class CustomUsers(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('guest', 'Guest'),
    ]
    
    email = models.EmailField(unique=True, max_length=200)
    password = models.CharField(max_length=200)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='guest',
    )
    profile_image = CloudinaryField('profile_image', null=True, blank=True)
    
    class Meta:
        db_table = 'users'
