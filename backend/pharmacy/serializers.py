from rest_framework import serializers
from .models import Medicine, MedicineInteraction, Pharmacy, PharmacyInventory, Prescription, PrescriptionMedicine, DispensingRecord


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = '__all__'


class MedicineInteractionSerializer(serializers.ModelSerializer):
    medicine_a_name = serializers.CharField(source='medicine_a.generic_name', read_only=True)
    medicine_b_name = serializers.CharField(source='medicine_b.generic_name', read_only=True)

    class Meta:
        model = MedicineInteraction
        fields = ['id', 'medicine_a', 'medicine_a_name', 'medicine_b', 'medicine_b_name', 'severity', 'description', 'recommendation']


class PrescriptionMedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionMedicine
        fields = '__all__'


class DispensingRecordSerializer(serializers.ModelSerializer):
    prescription_id = serializers.CharField(source='prescription.prescription_id', read_only=True)
    patient_name = serializers.CharField(source='prescription.patient.full_name', read_only=True)

    class Meta:
        model = DispensingRecord
        fields = ['id', 'prescription', 'prescription_id', 'patient_name', 'pharmacy_name', 'dispensed_by', 'dispensed_items_summary', 'notes', 'timestamp']



class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionMedicineSerializer(many=True, read_only=True)
    dispensing_records = DispensingRecordSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_code = serializers.CharField(source='patient.patient_id', read_only=True)
    patient_age = serializers.SerializerMethodField()
    patient_gender = serializers.CharField(source='patient.gender', read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'prescription_id', 'patient', 'patient_name', 'patient_code',
            'patient_age', 'patient_gender', 'doctor', 'doctor_name', 'diagnosis',
            'general_instructions', 'follow_up_date', 'status', 'qr_code_data',
            'created_at', 'finalized_at', 'dispensed_at', 'items', 'dispensing_records'
        ]

    def get_patient_age(self, obj):
        return 42 # standard demo age or derived


class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = '__all__'


class PharmacyInventorySerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.generic_name', read_only=True)
    brand_name = serializers.CharField(source='medicine.brand_name', read_only=True)
    strength = serializers.CharField(source='medicine.strength', read_only=True)
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)

    class Meta:
        model = PharmacyInventory
        fields = ['id', 'pharmacy', 'pharmacy_name', 'medicine', 'medicine_name', 'brand_name', 'strength', 'stock_quantity', 'status', 'unit_price', 'last_updated']
