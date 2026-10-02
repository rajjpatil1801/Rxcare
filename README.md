# RXCARE — Healthcare Prescription & Clinical Safety Platform

> **"Safer Prescriptions. Healthier Lives."**

RXCARE is a clean, clinical Electronic Health Record (EHR) and prescription safety web platform connecting **Doctors**, **Patients**, **Laboratories**, and **Pharmacies**. It incorporates a deterministic rule-based **Clinical Safety Engine**, an explainable **AI Clinical Decision Support (CDS)** service (supporting local Ollama and a deterministic offline fallback), instant **QR code prescription verification**, a complete **pharmacy dispensing workflow**, **patient consent management**, and **HL7 FHIR R4** export structures.

---

## 1. Technology Stack

- **Frontend**:
  - React 18, Vite, TypeScript
  - Tailwind CSS, Lucide React, React Router v6, Recharts
- **Backend**:
  - Python 3.12, Django 5, Django REST Framework
  - SQLite (`db.sqlite3`), ReportLab (PDF generation), QRCode
- **Safety Engine & AI**:
  - Deterministic Rule-Based Clinical Safety Engine (drug-drug, drug-allergy, contraindications, duplicate therapy, lab thresholds)
  - Explainable Clinical Decision Support (local Ollama integration + built-in offline DemoAIService fallback)
- **100% Local**: No AWS, Firebase, Supabase, Kubernetes, Redis, paid APIs, or cloud dependencies.

---

## 2. Login Flow & Demo Credentials

The login system implements a two-screen, role-enforced authentication flow:

### Screen 1: Role Selection
- Brand: **RXCARE** — *"Safer Prescriptions. Healthier Lives."*
- Role cards: `[ Doctor ]`, `[ Patient ]`, `[ Laboratory ]`, `[ Pharmacy ]`
- User selects a role and clicks `[ Continue ]`.

### Screen 2: Role-Specific Login & Registration
- Title matches the chosen role (e.g., `DOCTOR LOGIN`, `PHARMACY LOGIN`).
- Inputs: ID / Email & Password with **Auto-fill Demo Credentials** button.
- **New User? Sign Up**: Interactive registration option allowing new healthcare professionals or patients to register with instant account and profile creation.
- **Strict Role Verification**: The backend verifies account existence, password, active state, and role match. If a user enters credentials for another role, it returns HTTP 403:
  > *"These credentials do not belong to a {Role} account."*

### Demo Credentials

| Role | Login ID / Username | Email | Password | Primary Interface |
| :--- | :--- | :--- | :--- | :--- |
| **Doctor** | `DR-1001` | `doctor@rxcare.demo` | `demo123` | `/doctor/dashboard` |
| **Patient** | `RX-PAT-1001` | `patient@rxcare.demo` | `demo123` | `/patient/dashboard` |
| **Laboratory** | `LAB-1001` | `lab@rxcare.demo` | `demo123` | `/lab` |
| **Pharmacy** | `PHARM-1001` | `pharmacy@rxcare.demo` | `demo123` | `/pharmacy` |

---

## 3. Core Portals & Navigation

### Doctor Portal
- **Navigation**: Dashboard, Patients, Prescriptions, Lab Reports, Appointments, Medicines
- **Actions**: `+ Create Prescription`, Profile, Logout
- **Dashboard Highlights**:
  - Header: *"Good Morning, Dr. Rahul Mehta"* — *"15 patients assigned today"*
  - Statistics: Total Patients, Active Prescriptions, Lab Reports, Safety Alerts
  - **Patient Clinical Spotlight**: Rahul Mehta (`RX-PAT-1001`), Age 42, Male, Type 2 Diabetes, Hypertension, Penicillin Allergy (HIGH), Vitals & BMI
  - **Clinical Safety Warnings**: Allergy Conflict (Penicillin + Amoxicillin), Drug-Drug Interactions
  - **Recent Lab Trends Chart**: Glucose, HbA1c, Creatinine, Cholesterol tracking
  - Recent Prescriptions & Upcoming Appointments
- **Advanced Clinical Prescribing**:
  - **Diagnostic Lab Orders**: Doctor can order 20+ NABL standard diagnostic tests for patients directly from their profile.
  - **Real-Time Safety Checker**: Dynamic, color-coded contraindication warnings (Critical/High/Caution) appear instantly when a dangerous medicine is selected during prescription creation.
  - Contains **7 comprehensive disease-drug interaction categories** checking against 42 catalog drugs.

### Pharmacy Portal
- **Navigation**: Dashboard, Verify Prescription, Inventory, Dispensing History
- **Workflow**:
  - Verify digital prescription via Prescription ID or QR scanner
  - Patient Spotlight & Medicines checklist (Dose, Quantity, Stock status)
  - Individual `[ Dispense ]` and `[ Dispense All ]` actions
  - Instant confirmation: *"✅ Dispensing recorded successfully"*
  - Real-time stock decrement and status update (`VERIFIED` -> `DISPENSED`)
  - Inventory management with stock levels (`In Stock`, `Limited Stock`, `Out of Stock`)

### Patient Portal
- **Navigation**: Health Overview, My Prescriptions, Lab Reports, Appointments, Consent
- **Workflow**:
  - Vitals monitoring (BP, Heart Rate, Blood Sugar, BMI)
  - **MY HEALTH SUMMARY**: Conditions, allergies, current medicines, latest labs
  - **Interactive Pharmacy Map Locator**: Click "Locate" on any prescription to open an interactive map (Leaflet) showing nearby pharmacies. It automatically checks real-time stock for the *entire* prescription, displaying which pharmacies have all medicines, partial stock, or are out of stock, along with an estimated total price.
  - My Prescriptions with interactive QR verification view and downloadable ReportLab PDF
  - Consent management: Grant / Revoke access for clinics, labs, and pharmacies

### Laboratory Portal
- **Navigation**: Dashboard, Patients, Upload Reports
- **Workflow**:
  - Metrics: Reports Submitted, Pending Reports, Abnormal Results
  - **Automated PDF Parsing**: Lab technicians can upload PDF lab reports fulfilling doctor orders. The system automatically scans the PDF and extracts critical findings (e.g., Cardiac Risk Markers) directly into the patient's EHR as documented alerts.
  - Integration with patient Electronic Health Record (EHR) and Doctor's Lab Reports tab.

---

## 4. Quick Start & Execution

### 1. Start Django Backend Server
```bash
cd backend
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```
Backend API will be live at: `http://127.0.0.1:8000/api/`

### 2. Start Vite Frontend Server
```bash
cd frontend
npm install
npm run dev
```
Frontend web application will be live at: `http://localhost:5173/`

### 3. Run Automated End-to-End Test Suite
To verify all 14 core clinical workflows, authentication, role mismatch rejection, safety engine, and dispensing:
```bash
cd backend
python test_suite.py
```

---

## 5. Main Demonstration Workflow

```
ROLE SELECTION
       ↓
DOCTOR LOGIN (DR-1001 / demo123)
       ↓
DOCTOR DASHBOARD (Patient Spotlight: Rahul Mehta RX-PAT-1001)
       ↓
+ CREATE PRESCRIPTION
       ↓
SELECT PATIENT (Immediate allergy & condition alert)
       ↓
ADD MEDICINE (Amoxicillin 500mg)
       ↓
DETERMINISTIC SAFETY ENGINE (Flags CRITICAL Penicillin allergy conflict!)
       ↓
CLINICAL DECISION SUPPORT (Explainable advisory guidance)
       ↓
FINALIZE PRESCRIPTION (Generates Prescription ID, QR code & PDF)
       ↓
PHARMACY LOGIN (PHARM-1001 / demo123)
       ↓
VERIFY DIGITAL PRESCRIPTION (QR / ID lookup)
       ↓
CHECK INVENTORY & DISPENSE MEDICINE ("✓ Dispensing recorded successfully")
       ↓
PATIENT LOGIN (RX-PAT-1001 / demo123)
       ↓
VIEW DISPENSED PRESCRIPTION (QR & PDF available)
```

---

## 6. Disclaimer

**COLLEGE / PROJECT PROTOTYPE**: RXCARE is an educational proof-of-concept prototype demonstrating clinical safety decision support and digital prescription workflows. It is **not** certified for production clinical healthcare software.
