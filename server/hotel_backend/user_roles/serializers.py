from .models import CustomUsers
from rest_framework import serializers

class CustomUserSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUsers
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'profile_image', 'date_joined']
        extra_kwargs = { 'password': { 'write_only': True } }
        
    def get_profile_image(self, obj):
        if obj.profile_image:
            return obj.profile_image.url
        return ""

    def create(self, validated_data):
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email')
        password = validated_data.pop('password', None)
        user = CustomUsers(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user