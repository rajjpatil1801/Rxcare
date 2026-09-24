from django.db import models
from django.utils import timezone
from core.models import User, PatientProfile


class MedicalCondition(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        CHRONIC = 'CHRONIC', 'Chronic'
        RESOLVED = 'RESOLVED', 'Resolved'
        IN_REMISSION = 'IN_REMISSION', 'In Remission'

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='conditions')
    condition_name = models.CharField(max_length=150)
    icd10_code = models.CharField(max_length=20, blank=True, default='')
    diagnosed_date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.patient.full_name} - {self.condition_name} ({self.status})"


class MedicalHistory(models.Model):
    class EventType(models.TextChoices):
        DIAGNOSIS = 'DIAGNOSIS', 'Clinical Diagnosis'
        HOSPITAL_VISIT = 'HOSPITAL_VISIT', 'Hospitalization / Inpatient'
        SURGERY = 'SURGERY', 'Surgical Procedure'
        OUTPATIENT = 'OUTPATIENT', 'Outpatient Visit'
        IMPORTANT_EVENT = 'IMPORTANT_EVENT', 'Critical Clinical Event'

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='medical_history')
    event_type = models.CharField(max_length=30, choices=EventType.choices, default=EventType.DIAGNOSIS)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    event_date = models.DateField(default=timezone.localdate)
    facility_name = models.CharField(max_length=150, blank=True, default='RxCare Medical Center')
    treating_physician = models.CharField(max_length=100, blank=True, default='Dr. Rahul Mehta')

    class Meta:
        ordering = ['-event_date']

    def __str__(self):
        return f"{self.patient.full_name} - {self.title} ({self.event_date})"


class Allergy(models.Model):
    class Severity(models.TextChoices):
        MILD = 'MILD', 'Mild'
        MODERATE = 'MODERATE', 'Moderate'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical / Anaphylactic'

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='allergies')
    substance = models.CharField(max_length=100) # e.g. "Penicillin", "Sulfa drugs", "Peanuts"
    reaction = models.CharField(max_length=200) # e.g. "Severe urticaria & angioedema"
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.HIGH)
    diagnosed_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.patient.full_name} Allergy: {self.substance} ({self.severity})"


class AdverseDrugReaction(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='adverse_reactions')
    medicine_name = models.CharField(max_length=150)
    reaction = models.TextField()
    severity = models.CharField(max_length=20, default='Moderate')
    reported_date = models.DateField(default=timezone.localdate)
    action_taken = models.CharField(max_length=200, blank=True, default='Discontinued medication')

    def __str__(self):
        return f"{self.patient.full_name} ADR: {self.medicine_name}"


class Vital(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='vitals')
    recorded_at = models.DateTimeField(default=timezone.now)
    blood_pressure_sys = models.PositiveIntegerField(help_text="mmHg (Systolic)", default=120)
    blood_pressure_dia = models.PositiveIntegerField(help_text="mmHg (Diastolic)", default=80)
    heart_rate = models.PositiveIntegerField(help_text="bpm", default=72)
    blood_glucose = models.FloatField(help_text="mg/dL fasting/random", default=110.0)
    bmi = models.FloatField(help_text="kg/m2", default=24.5)
    temperature_f = models.FloatField(default=98.6)
    spo2 = models.PositiveIntegerField(default=98)
    notes = models.CharField(max_length=200, blank=True, default='')

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.patient.full_name} Vitals: BP {self.blood_pressure_sys}/{self.blood_pressure_dia}, HR {self.heart_rate} at {self.recorded_at.strftime('%Y-%m-%d')}"


class LabReport(models.Model):
    class Status(models.TextChoices):
        NORMAL = 'NORMAL', 'Normal'
        ABNORMAL = 'ABNORMAL', 'Abnormal / Elevated'
        CRITICAL = 'CRITICAL', 'Critical Alert'
        PENDING = 'PENDING', 'Pending Review'

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='lab_reports')
    laboratory_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_reports')
    laboratory_name = models.CharField(max_length=150, default='Apex Clinical Diagnostics')
    report_title = models.CharField(max_length=150) # e.g. "Comprehensive Metabolic Panel", "HbA1c & Glycemic Profile"
    specimen_type = models.CharField(max_length=50, default='Blood (Serum)')
    report_date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NORMAL)
    notes = models.TextField(blank=True, default='')
    file_attachment = models.FileField(upload_to='lab_reports/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-report_date', '-created_at']

    def __str__(self):
        return f"{self.patient.full_name} - {self.report_title} ({self.report_date})"


class LabResult(models.Model):
    class Flag(models.TextChoices):
        NORMAL = 'Normal', 'Normal'
        HIGH = 'High', 'High'
        LOW = 'Low', 'Low'
        CRITICAL = 'Critical', 'Critical'

    report = models.ForeignKey(LabReport, on_delete=models.CASCADE, related_name='results')
    test_name = models.CharField(max_length=100) # e.g. "Glucose (Fasting)", "HbA1c", "Serum Creatinine", "Total Cholesterol"
    value = models.FloatField()
    unit = models.CharField(max_length=30) # e.g. "mg/dL", "%", "mg/dL", "mg/dL"
    reference_range = models.CharField(max_length=50, default='') # e.g. "70 - 99"
    flag = models.CharField(max_length=20, choices=Flag.choices, default=Flag.NORMAL)
    notes = models.CharField(max_length=200, blank=True, default='')

    def __str__(self):
        return f"{self.test_name}: {self.value} {self.unit} ({self.flag})"


class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'Scheduled', 'Scheduled'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'
        NO_SHOW = 'No-show', 'No-show'

    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments')
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='appointments')
    scheduled_time = models.DateTimeField()
    appointment_type = models.CharField(max_length=100, default='Follow-up Consultation')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_time']

    def __str__(self):
        return f"Appt: {self.patient.full_name} with {self.doctor.get_full_name()} at {self.scheduled_time.strftime('%Y-%m-%d %H:%M')}"


class Consent(models.Model):
    class AccessType(models.TextChoices):
        ALL = 'ALL', 'Complete Medical & Prescription Records'
        LAB_ONLY = 'LAB_ONLY', 'Laboratory Results & Diagnostics Only'
        PHARMACY_ONLY = 'PHARMACY_ONLY', 'Prescription & Dispensing Verification Only'

    class Status(models.TextChoices):
        GRANTED = 'GRANTED', 'Granted'
        REVOKED = 'REVOKED', 'Revoked'
        EXPIRED = 'EXPIRED', 'Expired'

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='consents')
    provider_name = models.CharField(max_length=150) # e.g. "Apex Clinical Diagnostics", "Apollo Care Pharmacy", "Dr. Rahul Mehta"
    provider_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='granted_consents')
    access_type = models.CharField(max_length=30, choices=AccessType.choices, default=AccessType.ALL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.GRANTED)
    granted_date = models.DateField(default=timezone.localdate)
    expiry_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-granted_date']

    def __str__(self):
        return f"Consent for {self.patient.full_name} -> {self.provider_name} [{self.status}]"
