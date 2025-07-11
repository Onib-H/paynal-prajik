# Generated by Django 5.2.3 on 2025-06-21 01:07

import cloudinary.models
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Amenities',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'amenities',
            },
        ),
        migrations.CreateModel(
            name='Areas',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('area_name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True)),
                ('capacity', models.IntegerField()),
                ('price_per_hour', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('status', models.CharField(choices=[('available', 'Available'), ('maintenance', 'Maintenance')], default='available', max_length=20)),
                ('discount_percent', models.PositiveIntegerField(default=0)),
            ],
            options={
                'db_table': 'areas',
            },
        ),
        migrations.CreateModel(
            name='AreaImages',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('area_image', cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='area_image')),
                ('area', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='property.areas')),
            ],
            options={
                'db_table': 'area_images',
            },
        ),
        migrations.CreateModel(
            name='Rooms',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('room_name', models.CharField(default='Room', max_length=100)),
                ('room_type', models.CharField(choices=[('premium', 'Premium'), ('suites', 'Suites')], default='premium', max_length=20)),
                ('bed_type', models.CharField(choices=[('single', 'Single'), ('twin', 'Twin'), ('double', 'Double'), ('queen', 'Queen'), ('king', 'King')], default='single', max_length=20)),
                ('status', models.CharField(choices=[('available', 'Available'), ('maintenance', 'Maintenance')], default='available', max_length=20)),
                ('room_price', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('description', models.TextField(blank=True)),
                ('max_guests', models.PositiveIntegerField(default=2, help_text='Maximum number of guests allowed')),
                ('discount_percent', models.PositiveIntegerField(default=0)),
                ('amenities', models.ManyToManyField(blank=True, related_name='rooms', to='property.amenities')),
            ],
            options={
                'db_table': 'rooms',
            },
        ),
    ]
