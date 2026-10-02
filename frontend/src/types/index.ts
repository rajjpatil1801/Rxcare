export type UserRole = 'DOCTOR' | 'PATIENT' | 'LABORATORY' | 'PHARMACY' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  avatar_url?: string;
  patient_id?: number;
  doctor_profile?: {
    specialty: string;
    license_number: string;
    clinic_name: string;
    qualification: string;
    experience_years: number;
  };
  lab_profile?: {
    lab_name: string;
    license_number: string;
    contact_phone: string;
    address: string;
  };
  pharmacy_profile?: {
    pharmacy_name: string;
    license_number: string;
    contact_phone: string;
    address: string;
  };
}

export interface MedicalCondition {
  id: number;
  condition_name: string;
  icd10_code: string;
  diagnosed_date: string;
  status: 'ACTIVE' | 'CHRONIC' | 'RESOLVED' | 'IN_REMISSION';
  notes?: string;
}

export interface MedicalHistory {
  id: number;
  event_type: 'DIAGNOSIS' | 'HOSPITAL_VISIT' | 'SURGERY' | 'OUTPATIENT' | 'IMPORTANT_EVENT';
  title: string;
  description: string;
  event_date: string;
  facility_name: string;
  treating_physician: string;
}

export interface Allergy {
  id: number;
  substance: string;
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  diagnosed_date?: string;
  notes?: string;
}

export interface AdverseDrugReaction {
  id: number;
  medicine_name: string;
  reaction: string;
  severity: string;
  reported_date: string;
  action_taken?: string;
}

export interface Vital {
  id: number;
  recorded_at: string;
  blood_pressure_sys: number;
  blood_pressure_dia: number;
  heart_rate: number;
  blood_glucose: number;
  bmi: number;
  temperature_f?: number;
  spo2?: number;
  notes?: string;
}

export interface LabResult {
  id: number;
  test_name: string;
  value: number;
  unit: string;
  reference_range: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical';
  notes?: string;
}

export interface LabReport {
  id: number;
  patient: number;
  patient_name?: string;
  patient_id_code?: string;
  laboratory_name: string;
  report_title: string;
  specimen_type: string;
  report_date: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | 'PENDING';
  notes?: string;
  file_attachment?: string;
  created_at: string;
  results: LabResult[];
}

export interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  conditions: MedicalCondition[];
  allergies: Allergy[];
  adverse_reactions: AdverseDrugReaction[];
  latest_vitals?: Vital;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: number;
  generic_name: string;
  brand_name: string;
  category: string;
  strength: string;
  dosage_form: string;
  route: string;
  contraindications: string;
  allergy_class: string;
  renal_consideration: boolean;
  typical_dose: string;
  max_daily_dose: string;
  lab_considerations: string;
}

export interface MedicineInteraction {
  id: number;
  medicine_a: number;
  medicine_a_name: string;
  medicine_b: number;
  medicine_b_name: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  description: string;
  recommendation: string;
}

export type PrescriptionStatus = 'Draft' | 'Finalized' | 'Verified' | 'Partially Dispensed' | 'Dispensed' | 'Completed' | 'Cancelled';

export interface PrescriptionMedicine {
  id: number;
  medicine?: number;
  generic_name: string;
  brand_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route: string;
  instructions: string;
  is_dispensed: boolean;
  dispensed_quantity: number;
}

export interface DispensingRecord {
  id: number;
  pharmacy_name: string;
  dispensed_items_summary: string;
  notes: string;
  timestamp: string;
}

export interface Prescription {
  id: number;
  prescription_id: string;
  patient: number;
  patient_name: string;
  patient_code: string;
  patient_age: number;
  patient_gender: string;
  doctor: number;
  doctor_name: string;
  diagnosis: string;
  general_instructions: string;
  follow_up_date?: string;
  status: PrescriptionStatus;
  qr_code_data?: string;
  created_at: string;
  finalized_at?: string;
  dispensed_at?: string;
  items: PrescriptionMedicine[];
  dispensing_records: DispensingRecord[];
}

export interface SafetyAlert {
  type: 'drug_allergy' | 'drug_interaction' | 'contraindication' | 'duplicate_therapy' | 'lab_consideration' | 'dose_warning';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  medicines: string[];
  message: string;
  why: string;
  recommendation: string;
  source: string;
}

export interface SafetyCheckResult {
  patient_snapshot: {
    id: number;
    patient_id: string;
    name: string;
    allergies: string[];
    conditions: string[];
    active_medications: string[];
  };
  summary: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    total: number;
  };
  alerts: SafetyAlert[];
  status: 'PASS' | 'FLAGGED' | 'WARNING';
}

export interface AIClinicalInsight {
  provider: string;
  status: string;
  title: string;
  patient_context_summary: string;
  key_observations: string[];
  safety_interpretation: Array<{
    alert_title: string;
    severity: string;
    clinical_rationale: string;
    suggested_action: string;
  }>;
  lab_correlation: string[];
  suggested_review_points: string[];
  disclaimer: string;
}

export interface MedicineAvailability {
  medicine_id: number;
  name: string;
  dosage: string;
  available: boolean;
  stock_quantity: number;
  status: string;
  unit_price: number;
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  distance_km: number;
  rating: number;
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
  stock_status?: 'IN_STOCK' | 'LIMITED_STOCK' | 'OUT_OF_STOCK' | 'ALL_IN_STOCK' | 'PARTIAL' | 'NONE_AVAILABLE';
  unit_price?: number;
  medicine_availability?: MedicineAvailability[];
  available_count?: number;
  total_medicines?: number;
  all_available?: boolean;
  total_estimated_price?: number;
}

export interface Appointment {
  id: number;
  doctor: number;
  doctor_name: string;
  patient: number;
  patient_name: string;
  scheduled_time: string;
  appointment_type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';
  notes?: string;
  created_at: string;
}

export interface Consent {
  id: number;
  patient: number;
  patient_name: string;
  provider_name: string;
  provider_user?: number;
  access_type: 'ALL' | 'LAB_ONLY' | 'PHARMACY_ONLY';
  status: 'GRANTED' | 'REVOKED' | 'EXPIRED';
  granted_date: string;
  expiry_date?: string;
  notes?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: 'SAFETY_ALERT' | 'LAB_REPORT' | 'PRESCRIPTION_NEW' | 'PRESCRIPTION_VERIFIED' | 'DISPENSING' | 'APPOINTMENT' | 'CONSENT' | 'SYSTEM';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface MessageItem {
  id: number;
  sender: number;
  sender_name: string;
  recipient: number;
  recipient_name: string;
  content: string;
  is_read: boolean;
  timestamp: string;
}

export interface AuditLogItem {
  id: number;
  actor_name: string;
  role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  timestamp: string;
}

export interface LabTestOrderItem {
  id: number;
  case_code: string;
  test_name: string;
  clinical_scenario: string;
}

export interface LabTestOrder {
  id: number;
  patient: number;
  patient_name: string;
  ordered_by: number;
  ordered_by_name: string;
  status: 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes: string;
  items: LabTestOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface GlobalSearchResultItem {
  id: number;
  title: string;
  subtitle: string;
  type: 'patient' | 'medicine' | 'prescription' | 'lab_report';
  link: string;
}
