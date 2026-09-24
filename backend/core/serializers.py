from rest_framework import serializers
from .models import User, DoctorProfile, PatientProfile, LaboratoryProfile, PharmacyProfile, AuditLog, Notification, Message


class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = '__all__'


class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = '__all__'


class LaboratoryProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaboratoryProfile
        fields = '__all__'


class PharmacyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyProfile
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    doctor_profile = DoctorProfileSerializer(read_only=True)
    patient_profile = PatientProfileSerializer(read_only=True)
    lab_profile = LaboratoryProfileSerializer(read_only=True)
    pharmacy_profile = PharmacyProfileSerializer(read_only=True)
    patient_id = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role', 'phone', 'avatar_url', 'doctor_profile', 'patient_profile', 'lab_profile', 'pharmacy_profile', 'patient_id']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

    def get_patient_id(self, obj):
        if hasattr(obj, 'patient_profile') and obj.patient_profile:
            return obj.patient_profile.id
        return None



class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'recipient', 'recipient_name', 'content', 'is_read', 'timestamp']
