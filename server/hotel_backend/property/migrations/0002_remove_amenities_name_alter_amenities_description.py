# Generated by Django 5.1.7 on 2025-03-22 10:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('property', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='amenities',
            name='name',
        ),
        migrations.AlterField(
            model_name='amenities',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]
