import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import (
    User, DoctorProfile, PatientProfile, LaboratoryProfile,
    PharmacyProfile, AuditLog, Notification, Message
)
from clinical.models import (
    MedicalCondition, MedicalHistory, Allergy, AdverseDrugReaction,
    Vital, LabReport, LabResult, Appointment, Consent
)
from pharmacy.models import (
    Medicine, MedicineInteraction, Pharmacy, PharmacyInventory,
    Prescription, PrescriptionMedicine, DispensingRecord
)
from pharmacy.views import generate_qr_base64


class Command(BaseCommand):
    help = 'Seeds complete demonstration data for RxCare prototype'

    def handle(self, *args, **options):
        self.stdout.write("Starting RxCare demo data seeding...")

        # 1. Clear existing data safely
        self.stdout.write("Cleaning previous records...")
        DispensingRecord.objects.all().delete()
        PrescriptionMedicine.objects.all().delete()
        Prescription.objects.all().delete()
        PharmacyInventory.objects.all().delete()
        Pharmacy.objects.all().delete()
        MedicineInteraction.objects.all().delete()
        Medicine.objects.all().delete()
        LabResult.objects.all().delete()
        LabReport.objects.all().delete()
        Vital.objects.all().delete()
        Allergy.objects.all().delete()
        AdverseDrugReaction.objects.all().delete()
        MedicalHistory.objects.all().delete()
        MedicalCondition.objects.all().delete()
        Appointment.objects.all().delete()
        Consent.objects.all().delete()
        Notification.objects.all().delete()
        Message.objects.all().delete()
        AuditLog.objects.all().delete()
        PatientProfile.objects.all().delete()
        User.objects.all().delete()

        # 2. Create 4 Demo Accounts
        self.stdout.write("Creating demo users...")
        
        # Doctor
        doctor_user = User.objects.create_user(
            username='DR-1001',
            email='doctor@rxcare.demo',
            password='demo123',
            first_name='Rahul',
            last_name='Mehta',
            role=User.Role.DOCTOR,
            phone='+91 98450 11223'
        )
        DoctorProfile.objects.create(
            user=doctor_user,
            specialty='Cardiology & Internal Medicine',
            license_number='DR-1001',
            clinic_name='Metro Heart & Healthcare Institute',
            qualification='MBBS, MD (General Medicine), DM (Cardiology)',
            experience_years=14
        )

        # Patient User
        patient_user = User.objects.create_user(
            username='RX-PAT-1001',
            email='patient@rxcare.demo',
            password='demo123',
            first_name='Rahul',
            last_name='Mehta',
            role=User.Role.PATIENT,
            phone='+91 98765 10203'
        )

        # Lab User
        lab_user = User.objects.create_user(
            username='LAB-1001',
            email='lab@rxcare.demo',
            password='demo123',
            first_name='Apex',
            last_name='Diagnostics',
            role=User.Role.LABORATORY,
            phone='+91 80 4455 6677'
        )
        LaboratoryProfile.objects.create(
            user=lab_user,
            lab_name='Apex Clinical Diagnostic Laboratory',
            license_number='LAB-1001',
            contact_phone='+91 80 4455 6677',
            address='74 Central Diagnostic Boulevard, Koramangala, Bengaluru'
        )

        # Pharmacy User
        pharm_user = User.objects.create_user(
            username='PHARM-1001',
            email='pharmacy@rxcare.demo',
            password='demo123',
            first_name='Apollo',
            last_name='Pharmacy',
            role=User.Role.PHARMACY,
            phone='+91 80 2233 4455'
        )
        PharmacyProfile.objects.create(
            user=pharm_user,
            pharmacy_name='Apollo Care Pharmacy #402',
            license_number='PHARM-1001',
            contact_phone='+91 80 2233 4455',
            address='Shop 12, Metro Commercial Arcade, MG Road'
        )

        # 3. Create 15 Fictional Patients
        self.stdout.write("Creating 15 fictional patients...")
        patients_data = [
            {
                "patient_id": "RX-PAT-1001",
                "user": patient_user,
                "first_name": "Rahul",
                "last_name": "Mehta",
                "email": "patient@rxcare.demo",
                "phone": "+91 98765 10203",
                "dob": "1982-06-15",
                "gender": "Male",
                "blood": "O+",
                "height": 174.0,
                "weight": 76.5,
                "address": "Flat 302, Green Glen Layout, Bellandur, Bengaluru",
                "emergency_name": "Sunita Mehta",
                "emergency_phone": "+91 98765 10204",
                "conditions": [
                    {"name": "Type 2 Diabetes Mellitus", "code": "E11.9", "status": "ACTIVE"},
                    {"name": "Essential Hypertension", "code": "I10", "status": "ACTIVE"}
                ],
                "allergies": [
                    {"substance": "Penicillin", "reaction": "Severe cutaneous urticaria & angioedema", "severity": "HIGH"}
                ],
                "adrs": [
                    {"medicine": "Cefuroxime Axetil", "reaction": "Mild maculopapular rash on trunk"}
                ]
            },
            {
                "patient_id": "RX-PAT-1002",
                "first_name": "Priya",
                "last_name": "Sharma",
                "email": "priya.sharma@example.demo",
                "phone": "+91 98112 34567",
                "dob": "1990-11-24",
                "gender": "Female",
                "blood": "B+",
                "height": 162.0,
                "weight": 58.0,
                "address": "45 Park View Avenue, Indiranagar, Bengaluru",
                "emergency_name": "Alok Sharma",
                "emergency_phone": "+91 98112 34568",
                "conditions": [
                    {"name": "Bronchial Asthma", "code": "J45.909", "status": "ACTIVE"},
                    {"name": "Allergic Rhinitis", "code": "J30.9", "status": "CHRONIC"}
                ],
                "allergies": [
                    {"substance": "Sulfa drugs", "reaction": "Erythema multiforme & mucosal blistering", "severity": "CRITICAL"}
                ],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1003",
                "first_name": "Amit",
                "last_name": "Verma",
                "email": "amit.verma@example.demo",
                "phone": "+91 99201 88776",
                "dob": "1966-04-10",
                "gender": "Male",
                "blood": "A+",
                "height": 168.0,
                "weight": 82.0,
                "address": "12 Richmond Town, Bengaluru",
                "emergency_name": "Reena Verma",
                "emergency_phone": "+91 99201 88777",
                "conditions": [
                    {"name": "Chronic Kidney Disease (Stage 3b)", "code": "N18.3", "status": "CHRONIC"},
                    {"name": "Hypertensive Nephrosclerosis", "code": "I12.9", "status": "ACTIVE"}
                ],
                "allergies": [
                    {"substance": "Aspirin", "reaction": "Bronchospasm & severe wheezing", "severity": "HIGH"}
                ],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1004",
                "first_name": "Sunita",
                "last_name": "Rao",
                "email": "sunita.rao@example.demo",
                "phone": "+91 98440 22331",
                "dob": "1962-09-03",
                "gender": "Female",
                "blood": "AB+",
                "height": 155.0,
                "weight": 64.0,
                "address": "88 Malleshwaram 7th Cross, Bengaluru",
                "emergency_name": "Kishore Rao",
                "emergency_phone": "+91 98440 22332",
                "conditions": [
                    {"name": "Osteoarthritis of Bilateral Knees", "code": "M17.0", "status": "CHRONIC"},
                    {"name": "Peptic Ulcer Disease", "code": "K27.9", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": [
                    {"medicine": "Diclofenac Sodium", "reaction": "Severe epigastric pain & melena"}
                ]
            },
            {
                "patient_id": "RX-PAT-1005",
                "first_name": "Vikram",
                "last_name": "Malhotra",
                "email": "vikram.m@example.demo",
                "phone": "+91 98230 44556",
                "dob": "1979-01-18",
                "gender": "Male",
                "blood": "O-",
                "height": 180.0,
                "weight": 85.0,
                "address": "21 Lavelle Road, Bengaluru",
                "emergency_name": "Rohini Malhotra",
                "emergency_phone": "+91 98230 44557",
                "conditions": [
                    {"name": "Coronary Artery Disease (Post-PCI)", "code": "I25.10", "status": "CHRONIC"},
                    {"name": "Dyslipidemia", "code": "E78.5", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1006",
                "first_name": "Ananya",
                "last_name": "Roy",
                "email": "ananya.roy@example.demo",
                "phone": "+91 97110 55667",
                "dob": "1995-07-29",
                "gender": "Female",
                "blood": "A-",
                "height": 165.0,
                "weight": 54.0,
                "address": "9 Whitefield Palm Meadows, Bengaluru",
                "emergency_name": "Debashish Roy",
                "emergency_phone": "+91 97110 55668",
                "conditions": [
                    {"name": "Migraine without Aura", "code": "G43.009", "status": "ACTIVE"}
                ],
                "allergies": [
                    {"substance": "Codeine", "reaction": "Severe nausea and respiratory depression", "severity": "HIGH"}
                ],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1007",
                "first_name": "Rajesh",
                "last_name": "Patel",
                "email": "rajesh.patel@example.demo",
                "phone": "+91 98250 99881",
                "dob": "1957-12-11",
                "gender": "Male",
                "blood": "B-",
                "height": 170.0,
                "weight": 79.0,
                "address": "5 HSR Layout Sector 2, Bengaluru",
                "emergency_name": "Bhavna Patel",
                "emergency_phone": "+91 98250 99882",
                "conditions": [
                    {"name": "Type 2 Diabetes Mellitus", "code": "E11.9", "status": "ACTIVE"},
                    {"name": "Diabetic Peripheral Neuropathy", "code": "E11.40", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1008",
                "first_name": "Meera",
                "last_name": "Nair",
                "email": "meera.nair@example.demo",
                "phone": "+91 94470 12345",
                "dob": "1973-03-22",
                "gender": "Female",
                "blood": "O+",
                "height": 158.0,
                "weight": 68.0,
                "address": "14 Koramangala 4th Block, Bengaluru",
                "emergency_name": "Santhosh Nair",
                "emergency_phone": "+91 94470 12346",
                "conditions": [
                    {"name": "Hypothyroidism (Hashimoto)", "code": "E03.9", "status": "CHRONIC"},
                    {"name": "Hypertension", "code": "I10", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1009",
                "first_name": "Suresh",
                "last_name": "Kulkarni",
                "email": "suresh.k@example.demo",
                "phone": "+91 98451 98760",
                "dob": "1969-08-14",
                "gender": "Male",
                "blood": "B+",
                "height": 172.0,
                "weight": 88.0,
                "address": "33 Jayanagar 4th Block, Bengaluru",
                "emergency_name": "Aparna Kulkarni",
                "emergency_phone": "+91 98451 98761",
                "conditions": [
                    {"name": "Chronic Tophaceous Gout", "code": "M1A.00X0", "status": "ACTIVE"},
                    {"name": "Hyperuricemia", "code": "E79.0", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1010",
                "first_name": "Pooja",
                "last_name": "Joshi",
                "email": "pooja.j@example.demo",
                "phone": "+91 98200 33445",
                "dob": "1986-05-30",
                "gender": "Female",
                "blood": "AB-",
                "height": 160.0,
                "weight": 52.0,
                "address": "77 Sadashivanagar, Bengaluru",
                "emergency_name": "Manish Joshi",
                "emergency_phone": "+91 98200 33446",
                "conditions": [
                    {"name": "Major Depressive Disorder", "code": "F32.9", "status": "ACTIVE"},
                    {"name": "Generalized Anxiety Disorder", "code": "F41.1", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1011",
                "first_name": "Deepak",
                "last_name": "Gupta",
                "email": "deepak.gupta@example.demo",
                "phone": "+91 98100 88990",
                "dob": "1964-10-05",
                "gender": "Male",
                "blood": "O+",
                "height": 176.0,
                "weight": 80.0,
                "address": "19 Cunningham Road, Bengaluru",
                "emergency_name": "Kavita Gupta",
                "emergency_phone": "+91 98100 88991",
                "conditions": [
                    {"name": "Non-valvular Atrial Fibrillation", "code": "I48.91", "status": "CHRONIC"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1012",
                "first_name": "Kavita",
                "last_name": "Singh",
                "email": "kavita.s@example.demo",
                "phone": "+91 98711 22334",
                "dob": "1978-02-14",
                "gender": "Female",
                "blood": "A+",
                "height": 163.0,
                "weight": 61.0,
                "address": "62 Domlur Club Road, Bengaluru",
                "emergency_name": "Harish Singh",
                "emergency_phone": "+91 98711 22335",
                "conditions": [
                    {"name": "Seropositive Rheumatoid Arthritis", "code": "M05.9", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1013",
                "first_name": "Rakesh",
                "last_name": "Agarwal",
                "email": "rakesh.a@example.demo",
                "phone": "+91 98300 77665",
                "dob": "1971-07-08",
                "gender": "Male",
                "blood": "B+",
                "height": 171.0,
                "weight": 83.0,
                "address": "51 Banashankari 3rd Stage, Bengaluru",
                "emergency_name": "Meenu Agarwal",
                "emergency_phone": "+91 98300 77666",
                "conditions": [
                    {"name": "Severe Hypertriglyceridemia", "code": "E78.1", "status": "ACTIVE"},
                    {"name": "Non-alcoholic Fatty Liver Disease", "code": "K76.0", "status": "CHRONIC"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1014",
                "first_name": "Neha",
                "last_name": "Saxena",
                "email": "neha.saxena@example.demo",
                "phone": "+91 98188 55443",
                "dob": "1993-12-19",
                "gender": "Female",
                "blood": "O+",
                "height": 166.0,
                "weight": 56.0,
                "address": "10 Benson Town, Bengaluru",
                "emergency_name": "Kunal Saxena",
                "emergency_phone": "+91 98188 55444",
                "conditions": [
                    {"name": "Gastroesophageal Reflux Disease", "code": "K21.9", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": []
            },
            {
                "patient_id": "RX-PAT-1015",
                "first_name": "Rohan",
                "last_name": "Desai",
                "email": "rohan.desai@example.demo",
                "phone": "+91 98222 11990",
                "dob": "1985-04-27",
                "gender": "Male",
                "blood": "A+",
                "height": 175.0,
                "weight": 72.0,
                "address": "28 Ulsoor Lake Road, Bengaluru",
                "emergency_name": "Sanjana Desai",
                "emergency_phone": "+91 98222 11991",
                "conditions": [
                    {"name": "Atopic Dermatitis", "code": "L20.9", "status": "ACTIVE"}
                ],
                "allergies": [],
                "adrs": []
            }
        ]

        created_patients = {}
        for p_data in patients_data:
            patient = PatientProfile.objects.create(
                patient_id=p_data['patient_id'],
                user=p_data.get('user'),
                first_name=p_data['first_name'],
                last_name=p_data['last_name'],
                email=p_data['email'],
                phone=p_data['phone'],
                date_of_birth=datetime.date.fromisoformat(p_data['dob']),
                gender=p_data['gender'],
                blood_group=p_data['blood'],
                height_cm=p_data['height'],
                weight_kg=p_data['weight'],
                address=p_data['address'],
                emergency_contact_name=p_data['emergency_name'],
                emergency_contact_phone=p_data['emergency_phone']
            )
            created_patients[p_data['patient_id']] = patient

            for cond in p_data['conditions']:
                MedicalCondition.objects.create(
                    patient=patient,
                    condition_name=cond['name'],
                    icd10_code=cond['code'],
                    status=cond['status'],
                    diagnosed_date=datetime.date(2023, 1, 15)
                )

            for allg in p_data['allergies']:
                Allergy.objects.create(
                    patient=patient,
                    substance=allg['substance'],
                    reaction=allg['reaction'],
                    severity=allg['severity'],
                    diagnosed_date=datetime.date(2021, 6, 10)
                )

            for adr in p_data['adrs']:
                AdverseDrugReaction.objects.create(
                    patient=patient,
                    medicine_name=adr['medicine'],
                    reaction=adr['reaction'],
                    severity="Moderate",
                    reported_date=datetime.date(2022, 9, 5)
                )

            # Record initial vitals
            Vital.objects.create(
                patient=patient,
                blood_pressure_sys=128 if p_data['gender'] == 'Male' else 118,
                blood_pressure_dia=84 if p_data['gender'] == 'Male' else 76,
                heart_rate=74,
                blood_glucose=138.0 if "Diabetes" in str(p_data['conditions']) else 95.0,
                bmi=patient.bmi or 24.2,
                recorded_at=timezone.now() - datetime.timedelta(days=2)
            )

        # Special Medical History for Rahul Mehta (Demo Scenario)
        rahul_patient = created_patients["RX-PAT-1001"]
        MedicalHistory.objects.create(
            patient=rahul_patient,
            event_type=MedicalHistory.EventType.DIAGNOSIS,
            title="Type 2 Diabetes & Hypertension Diagnosis",
            description="Diagnosed with Type 2 Diabetes (HbA1c 8.2%) and Grade 1 Hypertension. Commenced Metformin 500mg and lifestyle modifications.",
            event_date=datetime.date(2021, 5, 20),
            treating_physician="Dr. Rahul Mehta"
        )
        MedicalHistory.objects.create(
            patient=rahul_patient,
            event_type=MedicalHistory.EventType.IMPORTANT_EVENT,
            title="Severe Penicillin Anaphylactoid Episode",
            description="Developed generalized urticaria and lip swelling 30 minutes following oral amoxicillin administration at dental clinic. Treated with antihistamines and steroids.",
            event_date=datetime.date(2022, 1, 14),
            treating_physician="Dr. Rahul Mehta"
        )
        MedicalHistory.objects.create(
            patient=rahul_patient,
            event_type=MedicalHistory.EventType.OUTPATIENT,
            title="Cardiometabolic Follow-up & Statin Optimization",
            description="Blood pressure well tolerated at 128/82 mmHg on Amlodipine 5mg. Fasting glucose stable.",
            event_date=datetime.date(2024, 2, 18),
            treating_physician="Dr. Rahul Mehta"
        )

        # 4. Create 20 Medicines
        self.stdout.write("Creating 20 medicines with clinical profiles...")
        meds_data = [
            {
                "generic_name": "Metformin Hydrochloride",
                "brand_name": "Glucophage",
                "category": "Antidiabetic / Biguanide",
                "strength": "500 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Severe renal impairment (eGFR < 30 mL/min), acute metabolic acidosis, severe hypoxemia",
                "allergy_class": "Biguanide",
                "renal_consideration": True,
                "typical_dose": "500 mg twice daily with meals",
                "max_daily_dose": "2000 mg",
                "lab_considerations": "Serum Creatinine, eGFR, Fasting Glucose, HbA1c"
            },
            {
                "generic_name": "Amlodipine Besylate",
                "brand_name": "Norvasc",
                "category": "Antihypertensive / Calcium Channel Blocker",
                "strength": "5 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Severe hypotension, cardiogenic shock, severe aortic stenosis",
                "allergy_class": "Dihydropyridine",
                "renal_consideration": False,
                "typical_dose": "5 mg once daily in the morning",
                "max_daily_dose": "10 mg",
                "lab_considerations": "Blood Pressure, Heart Rate"
            },
            {
                "generic_name": "Amoxicillin Trihydrate",
                "brand_name": "Amoxil",
                "category": "Antibiotic / Beta-lactam Penicillin",
                "strength": "500 mg",
                "dosage_form": "Capsule",
                "route": "Oral",
                "contraindications": "Documented hypersensitivity to penicillins or beta-lactams",
                "allergy_class": "Penicillin",
                "renal_consideration": True,
                "typical_dose": "500 mg every 8 hours for 7-10 days",
                "max_daily_dose": "3000 mg",
                "lab_considerations": "Renal function for high-dose or prolonged therapy"
            },
            {
                "generic_name": "Lisinopril",
                "brand_name": "Zestril",
                "category": "Antihypertensive / ACE Inhibitor",
                "strength": "10 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "History of angioedema with ACE inhibitors, pregnancy, bilateral renal artery stenosis",
                "allergy_class": "ACE Inhibitor",
                "renal_consideration": True,
                "typical_dose": "10 mg once daily",
                "max_daily_dose": "40 mg",
                "lab_considerations": "Serum Potassium, Serum Creatinine, Blood Pressure"
            },
            {
                "generic_name": "Losartan Potassium",
                "brand_name": "Cozaar",
                "category": "Antihypertensive / ARB",
                "strength": "50 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Pregnancy, concurrent use with Aliskiren in diabetes",
                "allergy_class": "Angiotensin Receptor Blocker",
                "renal_consideration": True,
                "typical_dose": "50 mg once daily",
                "max_daily_dose": "100 mg",
                "lab_considerations": "Serum Potassium, Creatinine"
            },
            {
                "generic_name": "Atorvastatin Calcium",
                "brand_name": "Lipitor",
                "category": "Antihyperlipidemic / HMG-CoA Reductase Inhibitor",
                "strength": "20 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Active liver disease, unexplained persistent elevations of serum transaminases",
                "allergy_class": "Statin",
                "renal_consideration": False,
                "typical_dose": "20 mg once daily at bedtime",
                "max_daily_dose": "80 mg",
                "lab_considerations": "Lipid Panel, ALT, AST, CPK (if myalgia occurs)"
            },
            {
                "generic_name": "Ibuprofen",
                "brand_name": "Brufen",
                "category": "Analgesic / NSAID",
                "strength": "400 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Active peptic ulcer disease, severe heart failure, severe renal failure, third trimester pregnancy",
                "allergy_class": "NSAID",
                "renal_consideration": True,
                "typical_dose": "400 mg every 8 hours after food",
                "max_daily_dose": "2400 mg",
                "lab_considerations": "Serum Creatinine, Blood Pressure, Hemoglobin"
            },
            {
                "generic_name": "Naproxen Sodium",
                "brand_name": "Aleve",
                "category": "Analgesic / NSAID",
                "strength": "500 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Gastrointestinal bleeding, severe renal impairment, aspirin-exacerbated respiratory disease",
                "allergy_class": "NSAID",
                "renal_consideration": True,
                "typical_dose": "500 mg twice daily with meals",
                "max_daily_dose": "1500 mg",
                "lab_considerations": "Renal function, Blood Pressure"
            },
            {
                "generic_name": "Propranolol Hydrochloride",
                "brand_name": "Inderal",
                "category": "Cardiovascular / Non-selective Beta Blocker",
                "strength": "40 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Bronchial asthma, severe COPD, sinus bradycardia, cardiogenic shock",
                "allergy_class": "Beta Blocker",
                "renal_consideration": False,
                "typical_dose": "40 mg twice daily",
                "max_daily_dose": "320 mg",
                "lab_considerations": "Heart rate, ECG"
            },
            {
                "generic_name": "Metoprolol Succinate",
                "brand_name": "Betaloc",
                "category": "Cardiovascular / Selective Beta-1 Blocker",
                "strength": "50 mg",
                "dosage_form": "Extended Release Tablet",
                "route": "Oral",
                "contraindications": "Severe bradycardia, second/third-degree AV block, decompensated heart failure",
                "allergy_class": "Beta Blocker",
                "renal_consideration": False,
                "typical_dose": "50 mg once daily",
                "max_daily_dose": "200 mg",
                "lab_considerations": "Resting Heart Rate, Blood Pressure"
            },
            {
                "generic_name": "Pantoprazole Sodium",
                "brand_name": "Pan 40",
                "category": "Gastrointestinal / Proton Pump Inhibitor",
                "strength": "40 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Hypersensitivity to substituted benzimidazoles",
                "allergy_class": "Proton Pump Inhibitor",
                "renal_consideration": False,
                "typical_dose": "40 mg once daily 30 minutes before breakfast",
                "max_daily_dose": "80 mg",
                "lab_considerations": "Serum Magnesium with long-term therapy"
            },
            {
                "generic_name": "Paracetamol",
                "brand_name": "Calpol",
                "category": "Analgesic & Antipyretic",
                "strength": "650 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Severe hepatic impairment or active liver disease",
                "allergy_class": "Acetaminophen",
                "renal_consideration": False,
                "typical_dose": "650 mg every 6 hours as needed for fever/pain",
                "max_daily_dose": "4000 mg",
                "lab_considerations": "Liver function tests in prolonged high-dose therapy"
            },
            {
                "generic_name": "Azithromycin",
                "brand_name": "Azithral",
                "category": "Antibiotic / Macrolide",
                "strength": "500 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "History of cholestatic jaundice/hepatic dysfunction associated with prior azithromycin use",
                "allergy_class": "Macrolide",
                "renal_consideration": False,
                "typical_dose": "500 mg once daily for 3 to 5 days",
                "max_daily_dose": "500 mg",
                "lab_considerations": "QT interval on ECG for high-risk cardiac patients"
            },
            {
                "generic_name": "Ciprofloxacin Hydrochloride",
                "brand_name": "Ciplox",
                "category": "Antibiotic / Fluoroquinolone",
                "strength": "500 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Concurrent tizanidine use, tendon disorders associated with quinolones",
                "allergy_class": "Fluoroquinolone",
                "renal_consideration": True,
                "typical_dose": "500 mg twice daily for 7 days",
                "max_daily_dose": "1500 mg",
                "lab_considerations": "Serum Creatinine"
            },
            {
                "generic_name": "Glimepiride",
                "brand_name": "Amaryl",
                "category": "Antidiabetic / Sulfonylurea",
                "strength": "2 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Diabetic ketoacidosis, severe renal or hepatic impairment",
                "allergy_class": "Sulfonamide",
                "renal_consideration": True,
                "typical_dose": "2 mg once daily with the first main meal",
                "max_daily_dose": "8 mg",
                "lab_considerations": "Blood Glucose, HbA1c"
            },
            {
                "generic_name": "Salbutamol Sulfate",
                "brand_name": "Asthalin",
                "category": "Respiratory / Beta-2 Agonist Bronchodilator",
                "strength": "100 mcg",
                "dosage_form": "Metered Dose Inhaler",
                "route": "Inhalation",
                "contraindications": "Hypersensitivity to salbutamol",
                "allergy_class": "Sympathomimetic",
                "renal_consideration": False,
                "typical_dose": "1 to 2 puffs every 4 to 6 hours as needed for wheeze",
                "max_daily_dose": "8 puffs",
                "lab_considerations": "Peak Expiratory Flow Rate"
            },
            {
                "generic_name": "Cetirizine Hydrochloride",
                "brand_name": "Cetzine",
                "category": "Antihistamine / Second Generation H1-Blocker",
                "strength": "10 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Severe renal impairment (CrCl < 10 mL/min)",
                "allergy_class": "Piperazine",
                "renal_consideration": True,
                "typical_dose": "10 mg once daily at bedtime",
                "max_daily_dose": "10 mg",
                "lab_considerations": "None required routinely"
            },
            {
                "generic_name": "Clopidogrel Bisulfate",
                "brand_name": "Plavix",
                "category": "Antithrombotic / P2Y12 Platelet Inhibitor",
                "strength": "75 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Active pathological bleeding (e.g. peptic ulcer or intracranial hemorrhage)",
                "allergy_class": "Thienopyridine",
                "renal_consideration": False,
                "typical_dose": "75 mg once daily with or without food",
                "max_daily_dose": "75 mg",
                "lab_considerations": "Complete Blood Count, Platelets, Bleeding signs"
            },
            {
                "generic_name": "Levothyroxine Sodium",
                "brand_name": "Thyronorm",
                "category": "Endocrine / Thyroid Hormone",
                "strength": "50 mcg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Uncorrected adrenal insufficiency, untreated thyrotoxicosis",
                "allergy_class": "Thyroid hormone",
                "renal_consideration": False,
                "typical_dose": "50 mcg once daily early morning on an empty stomach",
                "max_daily_dose": "200 mcg",
                "lab_considerations": "Serum TSH, Free T4"
            },
            {
                "generic_name": "Hydrochlorothiazide",
                "brand_name": "Aquazide",
                "category": "Antihypertensive / Thiazide Diuretic",
                "strength": "12.5 mg",
                "dosage_form": "Tablet",
                "route": "Oral",
                "contraindications": "Anuria, hypersensitivity to sulfonamide-derived drugs",
                "allergy_class": "Sulfonamide",
                "renal_consideration": True,
                "typical_dose": "12.5 mg once daily in the morning",
                "max_daily_dose": "50 mg",
                "lab_considerations": "Serum Sodium, Potassium, Uric Acid, Creatinine"
            }
        ]

        created_meds = {}
        for m_data in meds_data:
            med = Medicine.objects.create(**m_data)
            created_meds[m_data['generic_name']] = med

        # 5. Create 10+ Medicine Interaction Rules
        self.stdout.write("Seeding clinical drug interaction rules...")
        interactions_matrix = [
            (
                "Ibuprofen", "Lisinopril", "Moderate",
                "NSAIDs antagonize the antihypertensive efficacy of ACE inhibitors and significantly increase the risk of acute renal deterioration and hyperkalemia.",
                "Avoid routine concurrent combination. If analgesia is required, prefer Paracetamol. If NSAID must be used, monitor serum creatinine and BP closely."
            ),
            (
                "Ibuprofen", "Clopidogrel Bisulfate", "High",
                "Synergistic antiplatelet and gastrotoxic effects exponentially amplify the risk of severe upper gastrointestinal bleeding.",
                "Co-prescribe a potent proton-pump inhibitor (e.g. Pantoprazole 40mg). Advise patient to report dark tarry stools or epigastric discomfort."
            ),
            (
                "Lisinopril", "Losartan Potassium", "High",
                "Dual blockade of the renin-angiotensin-aldosterone system (RAAS) causes heightened rates of severe hypotension, syncope, hyperkalemia, and acute renal failure without incremental clinical benefit.",
                "Do not combine ACE inhibitors and ARBs. Select a single agent and optimize dose."
            ),
            (
                "Amlodipine Besylate", "Atorvastatin Calcium", "Low",
                "Amlodipine mildly inhibits CYP3A4, slightly elevating systemic exposure to Atorvastatin.",
                "Generally safe; limit Atorvastatin to 20mg or monitor for signs of unexplained muscle tenderness."
            ),
            (
                "Propranolol Hydrochloride", "Salbutamol Sulfate", "High",
                "Non-selective beta-blockade directly antagonizes the beta-2 receptor bronchodilating action of Salbutamol and can precipitate severe bronchospasm in susceptible patients.",
                "Contraindicated in reactive airway disease. Substitute with a cardioselective beta-1 blocker (e.g. Metoprolol) with caution or alternative agent."
            ),
            (
                "Metformin Hydrochloride", "Ibuprofen", "Moderate",
                "NSAID-induced renal vasoconstriction reduces metformin clearance, predisposing to drug accumulation and lactic acidosis.",
                "Check baseline renal function; ensure patient maintains adequate oral hydration."
            ),
            (
                "Azithromycin", "Ciprofloxacin Hydrochloride", "High",
                "Additive cardiac electrophysiological effects leading to significant QT interval prolongation and elevated risk of Torsades de Pointes arrhythmia.",
                "Avoid concurrent administration. Select an alternative non-QT prolonging antimicrobial agent."
            ),
            (
                "Glimepiride", "Metformin Hydrochloride", "Low",
                "Synergistic glycemic lowering. Although a common therapeutic combination, risk of hypoglycemia is increased if meals are skipped.",
                "Educate patient on symptoms of hypoglycemia (tremor, sweating, dizziness) and ensure fast-acting carbohydrates are accessible."
            ),
            (
                "Clopidogrel Bisulfate", "Pantoprazole Sodium", "Low",
                "Mild theoretical competition for hepatic CYP2C19 metabolism, but Pantoprazole exhibits the lowest clinical interaction among all proton pump inhibitors.",
                "Pantoprazole remains the preferred gastroprotective agent of choice for patients receiving Clopidogrel."
            ),
            (
                "Hydrochlorothiazide", "Lisinopril", "Moderate",
                "Initial concomitant use may cause profound first-dose postural hypotension, followed by synergistic BP reduction.",
                "Initiate at low doses, counsel patient regarding orthostatic dizziness, and recheck serum electrolytes after 14 days."
            ),
            (
                "Naproxen Sodium", "Lisinopril", "Moderate",
                "Blunting of antihypertensive effect and renal hemodynamic compromise via cyclooxygenase inhibition.",
                "Limit NSAID duration to under 5 days, or substitute with topical analgesic or Paracetamol."
            )
        ]

        for gen_a, gen_b, sev, desc, rec in interactions_matrix:
            med_a = created_meds.get(gen_a) or Medicine.objects.filter(generic_name__icontains=gen_a).first()
            med_b = created_meds.get(gen_b) or Medicine.objects.filter(generic_name__icontains=gen_b).first()
            if med_a and med_b:
                MedicineInteraction.objects.create(
                    medicine_a=med_a,
                    medicine_b=med_b,
                    severity=sev,
                    description=desc,
                    recommendation=rec
                )

        # 6. Create 5 Nearby Pharmacies & Inventories
        self.stdout.write("Creating 5 nearby pharmacies and inventories...")
        pharmacies_data = [
            {"name": "Apollo Care Pharmacy #402", "address": "Shop 12, Metro Commercial Arcade, MG Road", "phone": "+91 80 2233 4455", "distance": 0.4, "rating": 4.8},
            {"name": "MedPlus Health Hub", "address": "Plot 24, 100 Feet Road, Indiranagar", "phone": "+91 80 2525 6677", "distance": 0.8, "rating": 4.6},
            {"name": "HealthPlus Express Pharmacy", "address": "Lower Ground, Tech Park Mall, Bellandur", "phone": "+91 80 4112 9900", "distance": 0.9, "rating": 4.7},
            {"name": "Sun Community Chemists", "address": "33 Old Airport Road, Domlur", "phone": "+91 80 2521 1122", "distance": 1.0, "rating": 4.5},
            {"name": "Wellness Forever 24x7", "address": "78 Outer Ring Road, Marathahalli", "phone": "+91 80 4900 8800", "distance": 1.4, "rating": 4.9},
        ]

        created_pharmacies = []
        for p_info in pharmacies_data:
            pharm = Pharmacy.objects.create(
                name=p_info['name'],
                address=p_info['address'],
                phone=p_info['phone'],
                distance_km=p_info['distance'],
                rating=p_info['rating']
            )
            created_pharmacies.append(pharm)

            # Stock all medicines in each pharmacy
            for med in created_meds.values():
                status_choice = PharmacyInventory.StockStatus.IN_STOCK
                if p_info['name'] == 'Sun Community Chemists' and 'Amoxicillin' in med.generic_name:
                    status_choice = PharmacyInventory.StockStatus.LIMITED_STOCK
                elif p_info['name'] == 'MedPlus Health Hub' and 'Propranolol' in med.generic_name:
                    status_choice = PharmacyInventory.StockStatus.OUT_OF_STOCK

                PharmacyInventory.objects.create(
                    pharmacy=pharm,
                    medicine=med,
                    stock_quantity=120 if status_choice == PharmacyInventory.StockStatus.IN_STOCK else (15 if status_choice == PharmacyInventory.StockStatus.LIMITED_STOCK else 0),
                    status=status_choice,
                    unit_price=22.50
                )

        # 7. Create Lab Reports with Multi-Point Trends (especially for Rahul Mehta)
        self.stdout.write("Creating longitudinal lab reports and test results...")
        
        # Rahul Mehta's multi-month trends:
        # Date 1: 6 months ago (Elevated glycemic markers, normal renal)
        r1 = LabReport.objects.create(
            patient=rahul_patient,
            laboratory_user=lab_user,
            laboratory_name="Apex Clinical Diagnostic Laboratory",
            report_title="Comprehensive Glycemic & Renal Profile",
            specimen_type="Blood (Serum & Whole Blood)",
            report_date=datetime.date(2023, 9, 10),
            status=LabReport.Status.ABNORMAL,
            notes="Fasting blood glucose elevated. Glycated hemoglobin reflects suboptimal glycemic control."
        )
        LabResult.objects.create(report=r1, test_name="Fasting Blood Glucose", value=152.0, unit="mg/dL", reference_range="70 - 99", flag=LabResult.Flag.HIGH)
        LabResult.objects.create(report=r1, test_name="HbA1c (Glycated Hemoglobin)", value=8.1, unit="%", reference_range="4.0 - 5.6", flag=LabResult.Flag.HIGH)
        LabResult.objects.create(report=r1, test_name="Serum Creatinine", value=1.1, unit="mg/dL", reference_range="0.7 - 1.2", flag=LabResult.Flag.NORMAL)
        LabResult.objects.create(report=r1, test_name="Total Cholesterol", value=215.0, unit="mg/dL", reference_range="125 - 200", flag=LabResult.Flag.HIGH)

        # Date 2: 3 months ago (Improving glycemic control)
        r2 = LabReport.objects.create(
            patient=rahul_patient,
            laboratory_user=lab_user,
            laboratory_name="Apex Clinical Diagnostic Laboratory",
            report_title="Quarterly Diabetic & Lipid Surveillance",
            specimen_type="Blood (Serum)",
            report_date=datetime.date(2023, 12, 15),
            status=LabReport.Status.ABNORMAL,
            notes="Improvement observed in HbA1c following dietary reinforcement."
        )
        LabResult.objects.create(report=r2, test_name="Fasting Blood Glucose", value=136.0, unit="mg/dL", reference_range="70 - 99", flag=LabResult.Flag.HIGH)
        LabResult.objects.create(report=r2, test_name="HbA1c (Glycated Hemoglobin)", value=7.5, unit="%", reference_range="4.0 - 5.6", flag=LabResult.Flag.HIGH)
        LabResult.objects.create(report=r2, test_name="Serum Creatinine", value=1.15, unit="mg/dL", reference_range="0.7 - 1.2", flag=LabResult.Flag.NORMAL)
        LabResult.objects.create(report=r2, test_name="Total Cholesterol", value=195.0, unit="mg/dL", reference_range="125 - 200", flag=LabResult.Flag.NORMAL)

        # Date 3: Recent (Current baseline)
        r3 = LabReport.objects.create(
            patient=rahul_patient,
            laboratory_user=lab_user,
            laboratory_name="Apex Clinical Diagnostic Laboratory",
            report_title="Annual Routine Health Check & Renal Function",
            specimen_type="Blood (Serum & Plasma)",
            report_date=datetime.date(2024, 3, 20),
            status=LabReport.Status.NORMAL,
            notes="Stable metabolic parameters. Serum creatinine slightly borderline at upper limit."
        )
        LabResult.objects.create(report=r3, test_name="Fasting Blood Glucose", value=124.0, unit="mg/dL", reference_range="70 - 99", flag=LabResult.Flag.HIGH)
        LabResult.objects.create(report=r3, test_name="HbA1c (Glycated Hemoglobin)", value=7.1, unit="%", reference_range="4.0 - 5.6", flag=LabResult.Flag.HIGH)
        LabResult.objects.create(report=r3, test_name="Serum Creatinine", value=1.2, unit="mg/dL", reference_range="0.7 - 1.2", flag=LabResult.Flag.NORMAL)
        LabResult.objects.create(report=r3, test_name="Total Cholesterol", value=182.0, unit="mg/dL", reference_range="125 - 200", flag=LabResult.Flag.NORMAL)

        # Lab reports for other patients
        for p_key in ["RX-PAT-1002", "RX-PAT-1003", "RX-PAT-1005", "RX-PAT-1007"]:
            pt = created_patients[p_key]
            r = LabReport.objects.create(
                patient=pt,
                laboratory_user=lab_user,
                laboratory_name="Apex Clinical Diagnostic Laboratory",
                report_title="Comprehensive Routine Biochemistry Panel",
                specimen_type="Blood (Serum)",
                report_date=datetime.date(2024, 2, 10),
                status=LabReport.Status.NORMAL
            )
            LabResult.objects.create(report=r, test_name="Fasting Blood Glucose", value=92.0, unit="mg/dL", reference_range="70 - 99", flag=LabResult.Flag.NORMAL)
            LabResult.objects.create(report=r, test_name="Serum Creatinine", value=2.1 if p_key == "RX-PAT-1003" else 0.9, unit="mg/dL", reference_range="0.7 - 1.2", flag=LabResult.Flag.HIGH if p_key == "RX-PAT-1003" else LabResult.Flag.NORMAL)
            LabResult.objects.create(report=r, test_name="Total Cholesterol", value=178.0, unit="mg/dL", reference_range="125 - 200", flag=LabResult.Flag.NORMAL)

        # 8. Create Prescriptions across Lifecycle (Draft, Finalized, Verified, Dispensed)
        self.stdout.write("Creating prescriptions across lifecycle states...")

        # A) Existing active prescription for Rahul Mehta (Metformin + Amlodipine)
        rx_active = Prescription.objects.create(
            prescription_id="RX20240218001",
            patient=rahul_patient,
            doctor=doctor_user,
            doctor_name="Dr. Rahul Mehta",
            diagnosis="Type 2 Diabetes Mellitus & Stage 1 Hypertension",
            general_instructions="Maintain low carbohydrate diet, regular physical exercise 30 min daily. Keep blood sugar log.",
            follow_up_date=datetime.date(2024, 5, 20),
            status=Prescription.Status.DISPENSED,
            qr_code_data=generate_qr_base64("RXCARE:VERIFY:RX20240218001:RX-PAT-1001"),
            created_at=timezone.now() - datetime.timedelta(days=35),
            finalized_at=timezone.now() - datetime.timedelta(days=35),
            dispensed_at=timezone.now() - datetime.timedelta(days=34)
        )
        PrescriptionMedicine.objects.create(
            prescription=rx_active,
            medicine=created_meds["Metformin Hydrochloride"],
            generic_name="Metformin Hydrochloride",
            brand_name="Glucophage",
            dosage="500 mg",
            frequency="Twice daily (BID) with meals",
            duration_days=60,
            route="Oral",
            instructions="Take immediately following morning and evening meals",
            is_dispensed=True,
            dispensed_quantity=120
        )
        PrescriptionMedicine.objects.create(
            prescription=rx_active,
            medicine=created_meds["Amlodipine Besylate"],
            generic_name="Amlodipine Besylate",
            brand_name="Norvasc",
            dosage="5 mg",
            frequency="Once daily (OD) in the morning",
            duration_days=60,
            route="Oral",
            instructions="Take at 8:00 AM daily with water",
            is_dispensed=True,
            dispensed_quantity=60
        )
        DispensingRecord.objects.create(
            prescription=rx_active,
            pharmacy_name="Apollo Care Pharmacy #402",
            dispensed_by=pharm_user,
            dispensed_items_summary="Metformin 500mg (120 tabs) + Amlodipine 5mg (60 tabs) dispensed in full.",
            notes="Patient counseled on adherence and meal timing."
        )

        # B) Finalized prescription with QR ready for demonstration verification
        rx_finalized = Prescription.objects.create(
            prescription_id="RX20240322042",
            patient=rahul_patient,
            doctor=doctor_user,
            doctor_name="Dr. Rahul Mehta",
            diagnosis="Routine Statin Initiation & Cardiometabolic Prophylaxis",
            general_instructions="Take Atorvastatin at bedtime. Report any unusual bilateral muscle soreness.",
            follow_up_date=datetime.date(2024, 6, 20),
            status=Prescription.Status.FINALIZED,
            qr_code_data=generate_qr_base64("RXCARE:VERIFY:RX20240322042:RX-PAT-1001"),
            created_at=timezone.now() - datetime.timedelta(hours=6),
            finalized_at=timezone.now() - datetime.timedelta(hours=6)
        )
        PrescriptionMedicine.objects.create(
            prescription=rx_finalized,
            medicine=created_meds["Atorvastatin Calcium"],
            generic_name="Atorvastatin Calcium",
            brand_name="Lipitor",
            dosage="20 mg",
            frequency="Once daily at bedtime",
            duration_days=30,
            route="Oral",
            instructions="Bedtime administration with water",
            is_dispensed=False,
            dispensed_quantity=0
        )

        # C) More prescriptions for other patients across statuses
        other_rx_data = [
            (created_patients["RX-PAT-1002"], "RX20240315003", Prescription.Status.DISPENSED, "Salbutamol Sulfate", "Asthalin", "100 mcg", "2 puffs PRN"),
            (created_patients["RX-PAT-1003"], "RX20240318004", Prescription.Status.VERIFIED, "Lisinopril", "Zestril", "10 mg", "Once daily"),
            (created_patients["RX-PAT-1004"], "RX20240319005", Prescription.Status.PARTIALLY_DISPENSED, "Pantoprazole Sodium", "Pan 40", "40 mg", "Once daily before breakfast"),
            (created_patients["RX-PAT-1005"], "RX20240320006", Prescription.Status.DRAFT, "Clopidogrel Bisulfate", "Plavix", "75 mg", "Once daily with food"),
            (created_patients["RX-PAT-1006"], "RX20240321007", Prescription.Status.FINALIZED, "Paracetamol", "Calpol", "650 mg", "TID as needed"),
            (created_patients["RX-PAT-1007"], "RX20240322008", Prescription.Status.FINALIZED, "Glimepiride", "Amaryl", "2 mg", "Once daily with breakfast"),
            (created_patients["RX-PAT-1008"], "RX20240323009", Prescription.Status.DRAFT, "Levothyroxine Sodium", "Thyronorm", "50 mcg", "Once daily empty stomach"),
            (created_patients["RX-PAT-1009"], "RX20240324010", Prescription.Status.DISPENSED, "Paracetamol", "Calpol", "650 mg", "SOS for pain")
        ]

        for pt, code, st, med_name, b_name, dose, freq in other_rx_data:
            rx_obj = Prescription.objects.create(
                prescription_id=code,
                patient=pt,
                doctor=doctor_user,
                doctor_name="Dr. Rahul Mehta",
                diagnosis="Standard Outpatient Medical Management",
                general_instructions="Follow prescribed instructions carefully. Keep hydrated.",
                follow_up_date=datetime.date(2024, 7, 10),
                status=st,
                qr_code_data=generate_qr_base64(f"RXCARE:VERIFY:{code}:{pt.patient_id}")
            )
            med_item = created_meds.get(med_name)
            PrescriptionMedicine.objects.create(
                prescription=rx_obj,
                medicine=med_item or created_meds["Paracetamol"],
                generic_name=med_name,
                brand_name=b_name,
                dosage=dose,
                frequency=freq,
                duration_days=30,
                route="Oral",
                is_dispensed=(st == Prescription.Status.DISPENSED)
            )

        # 9. Create Appointments
        self.stdout.write("Creating clinical appointments...")
        tomorrow = timezone.now() + datetime.timedelta(days=1)
        next_week = timezone.now() + datetime.timedelta(days=7)

        Appointment.objects.create(
            doctor=doctor_user,
            patient=rahul_patient,
            scheduled_time=tomorrow.replace(hour=10, minute=30, second=0),
            appointment_type="Cardiometabolic & Glycemic Follow-up",
            status=Appointment.Status.SCHEDULED,
            notes="Review HbA1c trajectory, BP control, and medication tolerance."
        )
        Appointment.objects.create(
            doctor=doctor_user,
            patient=created_patients["RX-PAT-1002"],
            scheduled_time=tomorrow.replace(hour=11, minute=15, second=0),
            appointment_type="Respiratory Review & Spirometry",
            status=Appointment.Status.SCHEDULED,
            notes="Assess nocturnal asthma symptoms and inhaler technique."
        )
        Appointment.objects.create(
            doctor=doctor_user,
            patient=created_patients["RX-PAT-1003"],
            scheduled_time=next_week.replace(hour=14, minute=0, second=0),
            appointment_type="Renal Function Assessment",
            status=Appointment.Status.SCHEDULED,
            notes="Evaluate eGFR stability and fluid balance."
        )

        # 10. Create Consent Records
        self.stdout.write("Creating patient consent records...")
        Consent.objects.create(
            patient=rahul_patient,
            provider_name="Dr. Rahul Mehta (Metro Healthcare)",
            provider_user=doctor_user,
            access_type=Consent.AccessType.ALL,
            status=Consent.Status.GRANTED,
            granted_date=datetime.date(2024, 1, 1),
            notes="Full electronic health record and clinical prescribing authorization."
        )
        Consent.objects.create(
            patient=rahul_patient,
            provider_name="Apex Clinical Diagnostic Laboratory",
            provider_user=lab_user,
            access_type=Consent.AccessType.LAB_ONLY,
            status=Consent.Status.GRANTED,
            granted_date=datetime.date(2024, 1, 5),
            notes="Permission to receive specimens and publish diagnostic reports directly into patient chart."
        )
        Consent.objects.create(
            patient=rahul_patient,
            provider_name="Apollo Care Pharmacy #402",
            provider_user=pharm_user,
            access_type=Consent.AccessType.PHARMACY_ONLY,
            status=Consent.Status.GRANTED,
            granted_date=datetime.date(2024, 2, 10),
            notes="Permission to verify digital prescription tokens and log dispensing events."
        )

        # 11. Create Notifications
        self.stdout.write("Creating realistic notifications...")
        Notification.objects.create(
            recipient=doctor_user,
            title="Critical Allergy Conflict Warning",
            message="Safety engine flagged documented Penicillin allergy for patient Rahul Mehta during prescription drafting.",
            notification_type=Notification.Type.SAFETY_ALERT,
            is_read=False,
            link="/doctor/patients/1"
        )
        Notification.objects.create(
            recipient=doctor_user,
            title="Lab Results Received: Rahul Mehta",
            message="Apex Diagnostics published Annual Routine Health Check & Renal Function report.",
            notification_type=Notification.Type.LAB_REPORT,
            is_read=True,
            link="/doctor/patients/1?tab=labs"
        )
        Notification.objects.create(
            recipient=patient_user,
            title="Prescription Dispensed by Pharmacy",
            message="Apollo Care Pharmacy #402 has completed dispensing prescription #RX20240218001.",
            notification_type=Notification.Type.DISPENSING,
            is_read=False,
            link="/patient/prescriptions"
        )

        # 12. Create Messages between Doctor and Patient
        self.stdout.write("Creating doctor-patient messages...")
        Message.objects.create(
            sender=patient_user,
            recipient=doctor_user,
            content="Hello Dr. Mehta, my home fasting blood glucose averaged 126 mg/dL over the past week. Feeling energetic with no side effects.",
            is_read=True,
            timestamp=timezone.now() - datetime.timedelta(days=2)
        )
        Message.objects.create(
            sender=doctor_user,
            recipient=patient_user,
            content="Good morning Rahul. That is excellent progress. Keep adhering strictly to the current Metformin schedule. We will review your HbA1c at tomorrow's consultation.",
            is_read=True,
            timestamp=timezone.now() - datetime.timedelta(days=1)
        )

        # 13. Create Realistic Audit Trail
        self.stdout.write("Creating audit log trail...")
        audit_events = [
            (doctor_user, "DOCTOR", "Doctor logged in", "Authentication", "1", "User session initiated"),
            (doctor_user, "DOCTOR", "Doctor viewed patient chart", "Patient", "RX-PAT-1001", "Accessed chart for Rahul Mehta"),
            (lab_user, "LABORATORY", "Lab report uploaded", "LabReport", "3", "Uploaded Annual Routine Health Check & Renal Function"),
            (doctor_user, "DOCTOR", "Prescription created (Draft)", "Prescription", "RX20240322042", "Drafted prescription with Atorvastatin 20mg"),
            (doctor_user, "DOCTOR", "Prescription finalized & signed", "Prescription", "RX20240322042", "Digital cryptographic signature and QR code generated"),
            (pharm_user, "PHARMACY", "Pharmacy verified prescription", "Prescription", "RX20240322042", "Verified authentic QR token at dispensing counter"),
            (pharm_user, "PHARMACY", "Medicine dispensed", "Prescription", "RX20240218001", "Dispensed Metformin and Amlodipine"),
            (patient_user, "PATIENT", "Consent granted", "Consent", "3", "Granted dispensing verification consent to Apollo Pharmacy")
        ]

        for actor, role, act, res_type, res_id, det in audit_events:
            AuditLog.objects.create(
                actor=actor,
                actor_name=actor.get_full_name() or actor.username,
                role=role,
                action=act,
                resource_type=res_type,
                resource_id=res_id,
                details=det,
                timestamp=timezone.now() - datetime.timedelta(hours=3)
            )

        self.stdout.write(self.style.SUCCESS("[OK] Successfully seeded RxCare complete demonstration dataset!"))
        self.stdout.write("Demo accounts ready:")
        self.stdout.write("  - Doctor:    doctor@rxcare.demo   / demo123")
        self.stdout.write("  - Patient:   patient@rxcare.demo  / demo123")
        self.stdout.write("  - Laboratory: lab@rxcare.demo     / demo123")
        self.stdout.write("  - Pharmacy:  pharmacy@rxcare.demo / demo123")
