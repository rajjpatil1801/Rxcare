from rest_framework import serializers
from .models import (
    MedicalCondition, MedicalHistory, Allergy, AdverseDrugReaction,
    Vital, LabReport, LabResult, Appointment, Consent
)
from core.models import PatientProfile


class MedicalConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalCondition
        fields = '__all__'


class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = '__all__'


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = '__all__'


class AdverseDrugReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdverseDrugReaction
        fields = '__all__'


class VitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vital
        fields = '__all__'


class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'


class LabReportSerializer(serializers.ModelSerializer):
    results = LabResultSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True)

    class Meta:
        model = LabReport
        fields = ['id', 'patient', 'patient_name', 'patient_id_code', 'laboratory_name', 'report_title',
                  'specimen_type', 'report_date', 'status', 'notes', 'file_attachment', 'created_at', 'results']


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'doctor', 'doctor_name', 'patient', 'patient_name', 'scheduled_time', 'appointment_type', 'status', 'notes', 'created_at']


class ConsentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = Consent
        fields = ['id', 'patient', 'patient_name', 'provider_name', 'provider_user', 'access_type', 'status', 'granted_date', 'expiry_date', 'notes']


class PatientProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    bmi = serializers.ReadOnlyField()
    conditions = MedicalConditionSerializer(many=True, read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)
    adverse_reactions = AdverseDrugReactionSerializer(many=True, read_only=True)
    latest_vitals = serializers.SerializerMethodField()

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'user', 'patient_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'date_of_birth', 'gender', 'blood_group',
            'height_cm', 'weight_kg', 'bmi', 'address', 'emergency_contact_name',
            'emergency_contact_phone', 'is_archived', 'created_at', 'updated_at',
            'conditions', 'allergies', 'adverse_reactions', 'latest_vitals'
        ]

    def get_latest_vitals(self, obj):
        vital = obj.vitals.first()
        if vital:
            return VitalSerializer(vital).data
        return None
