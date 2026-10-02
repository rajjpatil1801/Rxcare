from django.db import models
from django.utils import timezone
from core.models import User, PatientProfile


class Medicine(models.Model):
    generic_name = models.CharField(max_length=150) # e.g. "Metformin Hydrochloride"
    brand_name = models.CharField(max_length=150) # e.g. "Glucophage"
    category = models.CharField(max_length=100) # e.g. "Antidiabetic / Biguanide"
    strength = models.CharField(max_length=50) # e.g. "500 mg", "10 mg"
    dosage_form = models.CharField(max_length=50, default='Tablet') # Tablet, Capsule, Syrup, Injection
    route = models.CharField(max_length=50, default='Oral') # Oral, IV, IM, Topical
    contraindications = models.TextField(blank=True, default='') # Conditions where drug should NOT be used
    allergy_class = models.CharField(max_length=100, blank=True, default='') # e.g. "Penicillin", "NSAID", "Sulfa"
    renal_consideration = models.BooleanField(default=False)
    hepatic_consideration = models.BooleanField(default=False)
    typical_dose = models.CharField(max_length=150, blank=True, default='')
    max_daily_dose = models.CharField(max_length=100, blank=True, default='')
    lab_considerations = models.CharField(max_length=200, blank=True, default='') # e.g. "Creatinine, eGFR, Blood Glucose"

    class Meta:
        ordering = ['generic_name']

    def __str__(self):
        return f"{self.generic_name} ({self.brand_name}) - {self.strength}"


class MedicineInteraction(models.Model):
    class Severity(models.TextChoices):
        LOW = 'Low', 'Low Risk'
        MODERATE = 'Moderate', 'Moderate Warning'
        HIGH = 'High', 'High Severity'
        CRITICAL = 'Critical', 'Critical / Contraindicated'

    medicine_a = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='interactions_as_a')
    medicine_b = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='interactions_as_b')
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.MODERATE)
    description = models.TextField() # Why they interact
    recommendation = models.TextField() # What doctor should do

    def __str__(self):
        return f"Interaction: {self.medicine_a.generic_name} + {self.medicine_b.generic_name} ({self.severity})"


class Pharmacy(models.Model):
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=30)
    distance_km = models.FloatField(default=0.8)
    rating = models.FloatField(default=4.7)
    latitude = models.FloatField(default=12.9716)
    longitude = models.FloatField(default=77.5946)
    opening_hours = models.CharField(max_length=50, default='8:00 AM - 10:00 PM')

    class Meta:
        verbose_name_plural = 'Pharmacies'
        ordering = ['distance_km']

    def __str__(self):
        return f"{self.name} ({self.distance_km} km)"


class PharmacyInventory(models.Model):
    class StockStatus(models.TextChoices):
        IN_STOCK = 'IN_STOCK', 'In Stock'
        LIMITED_STOCK = 'LIMITED_STOCK', 'Limited Stock'
        OUT_OF_STOCK = 'OUT_OF_STOCK', 'Out of Stock'

    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='inventory')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='pharmacy_inventories')
    stock_quantity = models.PositiveIntegerField(default=100)
    status = models.CharField(max_length=30, choices=StockStatus.choices, default=StockStatus.IN_STOCK)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2, default=15.00)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('pharmacy', 'medicine')

    def __str__(self):
        return f"{self.pharmacy.name} - {self.medicine.generic_name}: {self.status}"


class Prescription(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        FINALIZED = 'Finalized', 'Finalized'
        VERIFIED = 'Verified', 'Verified'
        PARTIALLY_DISPENSED = 'Partially Dispensed', 'Partially Dispensed'
        DISPENSED = 'Dispensed', 'Dispensed'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'

    prescription_id = models.CharField(max_length=40, unique=True)
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions_written')
    doctor_name = models.CharField(max_length=120, default='Dr. Rahul Mehta')
    diagnosis = models.TextField(blank=True, default='')
    general_instructions = models.TextField(blank=True, default='')
    follow_up_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    qr_code_data = models.TextField(blank=True, default='') # Base64 data URI or verification token
    created_at = models.DateTimeField(auto_now_add=True)
    finalized_at = models.DateTimeField(null=True, blank=True)
    dispensed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.prescription_id} - {self.patient.full_name} ({self.status})"


class PrescriptionMedicine(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='prescribed_in')
    generic_name = models.CharField(max_length=150)
    brand_name = models.CharField(max_length=150, blank=True, default='')
    dosage = models.CharField(max_length=50) # e.g. "500 mg"
    frequency = models.CharField(max_length=80) # e.g. "Twice daily (BID) after meals"
    duration_days = models.PositiveIntegerField(default=30)
    route = models.CharField(max_length=50, default='Oral')
    instructions = models.CharField(max_length=255, blank=True, default='')
    is_dispensed = models.BooleanField(default=False)
    dispensed_quantity = models.PositiveIntegerField(default=0)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index', 'id']

    def __str__(self):
        return f"{self.generic_name} ({self.dosage}) for {self.prescription.prescription_id}"


class DispensingRecord(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='dispensing_events')
    pharmacy_name = models.CharField(max_length=150, default='Apollo Care Pharmacy')
    dispensed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    dispensed_items_summary = models.TextField(default='')
    notes = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Dispensed {self.prescription.prescription_id} at {self.pharmacy_name} on {self.timestamp.strftime('%Y-%m-%d')}"
