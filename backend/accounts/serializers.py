from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'id',
            'target_role',
            'experience_level',
            'phone',
            'bio',
            'skills',
            'education',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'date_joined',
            'profile',
        ]
        read_only_fields = ['id', 'date_joined']

class UserRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    target_role = serializers.CharField(max_length=150, required=False, allow_blank=True, default='Software Engineer')
    experience_level = serializers.CharField(max_length=30, required=False, default='entry')

    def validate_username(self, value):
        val = value.strip()
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return val

    def validate_email(self, value):
        val = value.strip().lower()
        if User.objects.filter(email__iexact=val).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return val

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        target_role = validated_data.pop('target_role', 'Software Engineer')
        experience_level = validated_data.pop('experience_level', 'entry')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.target_role = target_role
        profile.experience_level = experience_level
        profile.save()
        user.refresh_from_db()

        return user

class ProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    target_role = serializers.CharField(max_length=150, required=False, allow_blank=True)
    experience_level = serializers.CharField(max_length=30, required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.CharField(required=False, allow_blank=True)
    education = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def update(self, instance, validated_data):
        user = instance.user

        if 'first_name' in validated_data:
            user.first_name = validated_data['first_name']
        if 'last_name' in validated_data:
            user.last_name = validated_data['last_name']
        if 'email' in validated_data:
            new_email = validated_data['email'].strip().lower()
            if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
                raise serializers.ValidationError({'email': 'This email is already in use by another account.'})
            user.email = new_email
        user.save()

        for field in ['target_role', 'experience_level', 'phone', 'bio', 'skills', 'education']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)

    def validate_new_password(self, value):
        validate_password(value)
        return value
