# Generated by Django 5.1.8 on 2025-04-13 02:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0002_bookings_time_of_arrival'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookings',
            name='number_of_guests',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
