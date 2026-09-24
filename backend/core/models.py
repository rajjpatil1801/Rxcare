from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        DOCTOR = 'DOCTOR', 'Doctor'
        PATIENT = 'PATIENT', 'Patient'
        LABORATORY = 'LABORATORY', 'Laboratory'
        PHARMACY = 'PHARMACY', 'Pharmacy'
        ADMIN = 'ADMIN', 'Admin'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    phone = models.CharField(max_length=20, blank=True, default='')
    avatar_url = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.CharField(max_length=100, default='General Medicine')
    license_number = models.CharField(max_length=50, default='MCI-99823')
    clinic_name = models.CharField(max_length=150, default='Metro Health Hospital')
    qualification = models.CharField(max_length=100, default='MBBS, MD (Medicine)')
    experience_years = models.PositiveIntegerField(default=12)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.specialty}"


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='patient_profile')
    patient_id = models.CharField(max_length=30, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], default='Male')
    blood_group = models.CharField(max_length=10, blank=True, default='O+')
    height_cm = models.FloatField(null=True, blank=True, default=172.0)
    weight_kg = models.FloatField(null=True, blank=True, default=74.5)
    address = models.TextField(blank=True, default='')
    emergency_contact_name = models.CharField(max_length=100, blank=True, default='')
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default='')
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def bmi(self):
        if self.height_cm and self.weight_kg and self.height_cm > 0:
            height_m = self.height_cm / 100.0
            return round(self.weight_kg / (height_m * height_m), 1)
        return None

    def __str__(self):
        return f"{self.full_name} ({self.patient_id})"


class LaboratoryProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='lab_profile')
    lab_name = models.CharField(max_length=150, default='Apex Clinical Diagnostics')
    license_number = models.CharField(max_length=50, default='LAB-IND-4091')
    contact_phone = models.CharField(max_length=20, blank=True, default='+91 98765 43210')
    address = models.TextField(blank=True, default='Health Hub, Tech Park Road, Bengaluru')

    def __str__(self):
        return self.lab_name


class PharmacyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='pharmacy_profile')
    pharmacy_name = models.CharField(max_length=150, default='Apollo Care Pharmacy')
    license_number = models.CharField(max_length=50, default='PHARM-DL-8821')
    contact_phone = models.CharField(max_length=20, blank=True, default='+91 98111 22334')
    address = models.TextField(blank=True, default='Shop 4, Metro Plaza, MG Road')

    def __str__(self):
        return self.pharmacy_name


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_events')
    actor_name = models.CharField(max_length=150, default='System')
    role = models.CharField(max_length=30, default='SYSTEM')
    action = models.CharField(max_length=100) # e.g. "Doctor viewed patient", "Prescription finalized"
    resource_type = models.CharField(max_length=50) # e.g. "Patient", "Prescription", "Consent", "LabReport"
    resource_id = models.CharField(max_length=50, blank=True, default='')
    details = models.TextField(blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.role} - {self.action} on {self.resource_type}:{self.resource_id}"


class Notification(models.Model):
    class Type(models.TextChoices):
        SAFETY_ALERT = 'SAFETY_ALERT', 'Safety Warning'
        LAB_REPORT = 'LAB_REPORT', 'New Lab Report'
        PRESCRIPTION_NEW = 'PRESCRIPTION_NEW', 'Prescription Created'
        PRESCRIPTION_VERIFIED = 'PRESCRIPTION_VERIFIED', 'Prescription Verified'
        DISPENSING = 'DISPENSING', 'Medicine Dispensed'
        APPOINTMENT = 'APPOINTMENT', 'Appointment Update'
        CONSENT = 'CONSENT', 'Consent Changed'
        SYSTEM = 'SYSTEM', 'System Notice'

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=Type.choices, default=Type.SYSTEM)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"To {self.recipient.username}: {self.title}"


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.content[:30]}"
