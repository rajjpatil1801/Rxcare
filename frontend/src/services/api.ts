import {
  User, Patient, Medicine, MedicineInteraction, Prescription,
  SafetyCheckResult, AIClinicalInsight, Pharmacy, Appointment,
  Consent, NotificationItem, MessageItem, AuditLogItem, LabReport,
  GlobalSearchResultItem, LabTestOrder
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('rxcare_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      let errMessage = 'An unexpected error occurred. Please try again.';
      try {
        const errorData = await response.json();
        errMessage = errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch {
        errMessage = `Request failed with status ${response.status}: ${response.statusText}`;
      }
      throw new Error(errMessage);
    }

    return response.json();
  }

  // --- Auth ---
  async login(emailOrUsername: string, password: string, role?: string): Promise<{ token: string; user: User; redirect_url?: string }> {
    const data = await this.request<{ token: string; user: User; redirect_url?: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ identifier: emailOrUsername, password, role }),
    });
    localStorage.setItem('rxcare_token', data.token);
    localStorage.setItem('rxcare_user', JSON.stringify(data.user));
    return data;
  }

  async register(registrationData: any): Promise<{ token: string; user: User; redirect_url?: string }> {
    const data = await this.request<{ token: string; user: User; redirect_url?: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
    localStorage.setItem('rxcare_token', data.token);
    localStorage.setItem('rxcare_user', JSON.stringify(data.user));
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout/', { method: 'POST' });
    } finally {
      localStorage.removeItem('rxcare_token');
      localStorage.removeItem('rxcare_user');
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me/');
  }

  // --- Patients ---
  async getPatients(search?: string, gender?: string): Promise<Patient[]> {
    let query = '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (gender) params.append('gender', gender);
    if (params.toString()) query = `?${params.toString()}`;
    return this.request<Patient[]>(`/patients/${query}`);
  }

  async getPatient(id: number): Promise<Patient> {
    return this.request<Patient>(`/patients/${id}/`);
  }

  async createPatient(data: Partial<Patient>): Promise<Patient> {
    return this.request<Patient>('/patients/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatient(id: number, data: Partial<Patient>): Promise<Patient> {
    return this.request<Patient>(`/patients/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Clinical Data ---
  async addAllergy(data: { patient: number; substance: string; reaction: string; severity: string }): Promise<any> {
    return this.request('/allergies/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addCondition(data: { patient: number; condition_name: string; icd10_code?: string; status?: string }): Promise<any> {
    return this.request('/conditions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addVital(data: {
    patient: number;
    blood_pressure_sys: number;
    blood_pressure_dia: number;
    heart_rate: number;
    blood_glucose?: number;
    bmi?: number;
    weight_kg?: number;
    height_cm?: number;
    temperature_f?: number;
    spo2?: number;
    notes?: string;
  }): Promise<any> {
    return this.request('/vitals/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPatientVitals(patientId: number): Promise<any[]> {
    return this.request<any[]>(`/vitals/?patient=${patientId}`);
  }

  async getPatientMedicalHistory(patientId: number): Promise<any[]> {
    return this.request<any[]>(`/medical-history/?patient=${patientId}`);
  }

  // --- Lab Reports ---
  async getLabReports(patientId?: number): Promise<LabReport[]> {
    const q = patientId ? `?patient=${patientId}` : '';
    return this.request<LabReport[]>(`/lab-reports/${q}`);
  }

  async createLabReport(data: any): Promise<LabReport> {
    return this.request<LabReport>('/lab-reports/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadLabReport(patientId: number, orderId: number, file: File): Promise<LabReport> {
    const formData = new FormData();
    formData.append('patient', patientId.toString());
    formData.append('order_id', orderId.toString());
    formData.append('file', file);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/lab-reports/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Request failed');
    }
    return response.json();
  }

  async getLabTrends(patientId?: number): Promise<any[]> {
    const q = patientId ? `?patient=${patientId}` : '';
    return this.request<any[]>(`/lab-trends/${q}`);
  }

  // --- Lab Test Orders ---
  async createLabTestOrder(data: {
    patient: number;
    notes?: string;
    items: Array<{ case_code: string; test_name: string; clinical_scenario: string }>;
  }): Promise<LabTestOrder> {
    return this.request<LabTestOrder>('/lab-test-orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLabTestOrders(patientId?: number): Promise<LabTestOrder[]> {
    const q = patientId ? `?patient=${patientId}` : '';
    return this.request<LabTestOrder[]>(`/lab-test-orders/${q}`);
  }

  // --- Medicines ---
  async getMedicines(search?: string, category?: string): Promise<Medicine[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<Medicine[]>(`/medicines/${q}`);
  }

  async getMedicineInteractions(): Promise<MedicineInteraction[]> {
    return this.request<MedicineInteraction[]>('/interactions/');
  }

  // --- Safety & AI Engine ---
  async runSafetyCheck(patientId: number, medicines: any[]): Promise<SafetyCheckResult> {
    return this.request<SafetyCheckResult>('/safety-check/', {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, medicines }),
    });
  }

  async getAIInsights(patientId: number, medicines: any[], safetyAlerts: any[]): Promise<AIClinicalInsight> {
    return this.request<AIClinicalInsight>('/ai-insights/', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: patientId,
        medicines,
        safety_alerts: safetyAlerts,
      }),
    });
  }

  // --- Prescriptions ---
  async getPrescriptions(patientId?: number, status?: string): Promise<Prescription[]> {
    const params = new URLSearchParams();
    if (patientId) params.append('patient', patientId.toString());
    if (status) params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<Prescription[]>(`/prescriptions/${q}`);
  }

  async getPrescription(id: number): Promise<Prescription> {
    return this.request<Prescription>(`/prescriptions/${id}/`);
  }

  async createPrescription(data: {
    patient_id: number;
    diagnosis: string;
    general_instructions?: string;
    follow_up_date?: string;
    items: Array<{
      medicine_id?: number;
      generic_name: string;
      brand_name?: string;
      dosage: string;
      frequency: string;
      duration_days: number;
      route?: string;
      instructions?: string;
    }>;
  }): Promise<Prescription> {
    return this.request<Prescription>('/prescriptions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async finalizePrescription(id: number): Promise<Prescription> {
    return this.request<Prescription>(`/prescriptions/${id}/finalize/`, {
      method: 'POST',
    });
  }

  async verifyPrescription(prescriptionId: string): Promise<{ is_valid: boolean; status: string; prescription?: Prescription; message?: string }> {
    return this.request<{ is_valid: boolean; status: string; prescription?: Prescription; message?: string }>(
      `/prescriptions/verify/${encodeURIComponent(prescriptionId)}/`
    );
  }

  async dispensePrescription(data: {
    prescription_id: string | number;
    item_ids?: number[];
    pharmacy_name?: string;
    notes?: string;
  }): Promise<{ status: string; prescription: Prescription }> {
    return this.request<{ status: string; prescription: Prescription }>('/dispensing/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getPrescriptionPdfUrl(id: number): string {
    return `${API_BASE_URL}/prescriptions/${id}/pdf/`;
  }

  // --- Pharmacies & Inventory ---
  async getNearbyPharmacies(medicineId?: number, medicineName?: string, prescriptionId?: number): Promise<Pharmacy[]> {
    const params = new URLSearchParams();
    if (medicineId) params.append('medicine_id', medicineId.toString());
    if (medicineName) params.append('name', medicineName);
    if (prescriptionId) params.append('prescription_id', prescriptionId.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<Pharmacy[]>(`/pharmacies/${q}`);
  }

  async getPharmacyInventory(search?: string, status?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/pharmacy-inventory/${q}`);
  }

  async updatePharmacyInventory(id: number, data: { stock_quantity?: number; status?: string }): Promise<any> {
    return this.request<any>(`/pharmacy-inventory/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getDispensingRecords(search?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/dispensing-records/${q}`);
  }


  // --- Appointments ---
  async getAppointments(patientId?: number): Promise<Appointment[]> {
    const q = patientId ? `?patient=${patientId}` : '';
    return this.request<Appointment[]>(`/appointments/${q}`);
  }

  async createAppointment(data: {
    patient: number;
    scheduled_time: string;
    appointment_type: string;
    notes?: string;
  }): Promise<Appointment> {
    return this.request<Appointment>('/appointments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // --- Consents ---
  async getConsents(patientId?: number): Promise<Consent[]> {
    const q = patientId ? `?patient=${patientId}` : '';
    return this.request<Consent[]>(`/consents/${q}`);
  }

  async updateConsentStatus(id: number, status: 'GRANTED' | 'REVOKED' | 'EXPIRED'): Promise<Consent> {
    return this.request<Consent>(`/consents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // --- Notifications ---
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/notifications/');
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/mark-read/', { method: 'POST' });
  }

  // --- Messages ---
  async getMessages(partnerId?: number): Promise<MessageItem[]> {
    const q = partnerId ? `?partner_id=${partnerId}` : '';
    return this.request<MessageItem[]>(`/messages/${q}`);
  }

  async sendMessage(recipientId: number, content: string): Promise<MessageItem> {
    return this.request<MessageItem>('/messages/', {
      method: 'POST',
      body: JSON.stringify({ recipient: recipientId, content }),
    });
  }

  // --- Audit Logs ---
  async getAuditLogs(role?: string, search?: string): Promise<AuditLogItem[]> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<AuditLogItem[]>(`/audit-logs/${q}`);
  }

  // --- Global Search ---
  async globalSearch(query: string): Promise<{
    patients: GlobalSearchResultItem[];
    medicines: GlobalSearchResultItem[];
    prescriptions: GlobalSearchResultItem[];
    lab_reports: GlobalSearchResultItem[];
  }> {
    return this.request(`/global-search/?q=${encodeURIComponent(query)}`);
  }

  // --- FHIR Export ---
  async getFhirResource(resourceType: string, id: number): Promise<any> {
    return this.request(`/fhir/${resourceType}/${id}/`);
  }
}

export const api = new ApiService();
