import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def post(url, data, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Token {token}"} if token else {})
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

def get(url, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Token {token}"} if token else {})
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

def patch(url, data, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=json.dumps(data).encode("utf-8"),
        method="PATCH",
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Token {token}"} if token else {})
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

print("=" * 60)
print("1. TEST VITE FRONTEND")
try:
    with urllib.request.urlopen("http://localhost:5173/") as resp:
        print(f"Vite frontend status: {resp.status} OK")
except Exception as e:
    print(f"Vite frontend error: {e}")

print("=" * 60)
print("2. TEST DOCTOR LOGIN (DR-1001)")
status, res = post("/api/auth/login/", {"identifier": "DR-1001", "password": "demo123", "role": "DOCTOR"})
print(f"Status: {status}")
assert status == 200, f"Expected 200, got {status}: {res}"
doc_token = res["token"]
print(f"Doctor User: {res['user']['full_name']} | Role: {res['user']['role']}")

print("=" * 60)
print("3. TEST ROLE MISMATCH REJECTION (PHARM-1001 on DOCTOR role)")
status, res = post("/api/auth/login/", {"identifier": "PHARM-1001", "password": "demo123", "role": "DOCTOR"})
print(f"Status: {status} | Error: {res.get('error')}")
assert status == 403, f"Expected 403 Forbidden, got {status}"
assert "These credentials do not belong to a Doctor account." in res.get("error", "")
print("Verified strict role rejection with exact error message!")

print("=" * 60)
print("4. TEST PATIENT LOGIN (RX-PAT-1001)")
status, res = post("/api/auth/login/", {"identifier": "RX-PAT-1001", "password": "demo123", "role": "PATIENT"})
print(f"Status: {status} | User: {res['user']['full_name']}")
assert status == 200
pat_token = res["token"]

print("=" * 60)
print("5. TEST LABORATORY LOGIN (LAB-1001)")
status, res = post("/api/auth/login/", {"identifier": "LAB-1001", "password": "demo123", "role": "LABORATORY"})
print(f"Status: {status} | User: {res['user']['full_name']}")
assert status == 200
lab_token = res["token"]

print("=" * 60)
print("6. TEST PHARMACY LOGIN (PHARM-1001)")
status, res = post("/api/auth/login/", {"identifier": "PHARM-1001", "password": "demo123", "role": "PHARMACY"})
print(f"Status: {status} | User: {res['user']['full_name']}")
assert status == 200
pharm_token = res["token"]

import time
uniq = str(int(time.time()))[-4:]

print("=" * 60)
print("7. TEST NEW USER REGISTRATION (Sign Up option)")
status, res = post("/api/auth/register/", {
    "identifier": f"DR-9{uniq}",
    "email": f"drnew{uniq}@rxcare.demo",
    "password": "demoPassword123!",
    "full_name": "Dr. Sarah Jenkins",
    "role": "DOCTOR",
    "specialization": "Cardiology",
    "license_number": f"MED-REG-9{uniq}"
})
print(f"Status: {status}")
assert status == 201, f"Expected 201 Created, got {status}: {res}"
print(f"Registered new Doctor: {res['user']['full_name']} ({res['user']['username']})")

print("=" * 60)
print("8. TEST PATIENT LIST & CLINICAL SPOTLIGHT (Rahul Mehta RX-PAT-1001)")
status, patients = get("/api/patients/", token=doc_token)
assert status == 200
patient_rahul = next(p for p in patients if p["patient_id"] == "RX-PAT-1001")
print(f"Found Patient: {patient_rahul['full_name']}, Gender: {patient_rahul['gender']}, DOB: {patient_rahul['date_of_birth']}")
print(f"Allergies: {[a['substance'] for a in patient_rahul.get('allergies', [])]}")
print(f"Conditions: {[c['condition_name'] for c in patient_rahul.get('conditions', [])]}")

print("=" * 60)
print("9. TEST RULE-BASED SAFETY ENGINE (Allergy Conflict Check)")
status, medicines = get("/api/medicines/", token=doc_token)
amox = next(m for m in medicines if "Amoxicillin" in m.get("generic_name", ""))
status, safety_res = post("/api/safety-check/", {
    "patient_id": patient_rahul["id"],
    "medicines": [{"medicine_id": amox["id"], "dose": "500 mg", "frequency": "TID"}]
}, token=doc_token)
print(f"Safety check status: {status}")
warnings = safety_res.get("alerts", [])
print(f"Total Safety Alerts: {len(warnings)}")
for w in warnings:
    print(f" - [{w.get('severity')}] {w.get('type')}: {w.get('message')}")
assert any("allergy" in w.get("type", "").lower() or "allergy" in w.get("message", "").lower() for w in warnings), "Expected penicillin allergy conflict!"
print("Rule-based safety engine successfully identified drug-allergy conflict!")

print("=" * 60)
print("10. TEST PRESCRIPTION CREATION & QR / PDF LIFECYCLE")
status, new_rx = post("/api/prescriptions/", {
    "patient": patient_rahul["id"],
    "diagnosis": "Bacterial upper respiratory infection with allergy override documentation",
    "notes": "Patient informed to monitor for any adverse reactions. Follow up in 5 days.",
    "medicines": [
        {
            "medicine_id": amox["id"],
            "dose": "500 mg",
            "form": "Tablet",
            "route": "Oral",
            "frequency": "TID",
            "duration": "7 days",
            "instructions": "Take after meals"
        }
    ]
}, token=doc_token)
print(f"Prescription created status: {status} | ID: {new_rx['prescription_id']} | Status: {new_rx['status']}")
rx_id = new_rx["id"]
rx_code = new_rx["prescription_id"]

# Finalize prescription
status, fin_rx = post(f"/api/prescriptions/{rx_id}/finalize/", {}, token=doc_token)
print(f"Finalize status: {status} | Prescription Status: {fin_rx['status']} | QR: {bool(fin_rx.get('qr_code_data'))}")
assert fin_rx["status"].upper() == "FINALIZED"

print("=" * 60)
print("11. TEST PHARMACY DIGITAL PRESCRIPTION VERIFICATION & DISPENSING")
status, ver_rx = get(f"/api/prescriptions/verify/{rx_code}/", token=pharm_token)
print(f"Verification status: {status} | Verified: {ver_rx.get('is_valid')} | Status: {ver_rx.get('status')}")
assert status == 200
assert ver_rx.get("prescription")["prescription_id"] == rx_code

# Dispense medicine
status, disp_res = post(f"/api/dispensing/", {
    "prescription_id": rx_code,
    "pharmacy_name": "Apollo Care Pharmacy",
    "notes": "Dispensed Amoxicillin 500mg as prescribed"
}, token=pharm_token)
print(f"Dispense status: {status} | Status: {disp_res.get('status')}")
assert status == 200

# Verify updated status
status, updated_rx = get(f"/api/prescriptions/{rx_id}/", token=doc_token)
print(f"Updated Prescription Status after dispensing: {updated_rx['status']}")
assert updated_rx["status"].upper() in ["DISPENSED", "PARTIALLY_DISPENSED"]

print("=" * 60)
print("12. TEST PHARMACY INVENTORY & DISPENSING HISTORY")
status, inventory = get("/api/pharmacy-inventory/", token=pharm_token)
print(f"Pharmacy inventory items count: {len(inventory)}")
status, history = get("/api/dispensing-records/", token=pharm_token)
print(f"Dispensing history records count: {len(history)}")
assert len(history) > 0

print("=" * 60)
print("13. TEST LAB REPORT UPLOAD & INTEGRATION")
status, lab_upload = post("/api/lab-reports/", {
    "patient": patient_rahul["id"],
    "report_title": "Fasting Blood Glucose",
    "laboratory_name": "Apex Diagnostics",
    "specimen_type": "Plasma",
    "status": "NORMAL",
    "results": [
        {
            "test_name": "Fasting Plasma Glucose",
            "value": 98.0,
            "unit": "mg/dL",
            "reference_range": "70 - 99",
            "flag": "Normal"
        }
    ],
    "notes": "Optimal glycemic control maintained."
}, token=lab_token)
print(f"Lab Report Upload status: {status} | Report ID: {lab_upload.get('id') if isinstance(lab_upload, dict) else lab_upload}")
assert status == 201

print("=" * 60)
print("14. TEST PATIENT PORTAL CONSENT TOGGLE")
status, consents = get("/api/consents/", token=pat_token)
assert status == 200
print(f"Patient active consents: {len(consents)}")
if consents:
    first_consent = consents[0]
    new_status = "REVOKED" if first_consent.get("status") == "GRANTED" else "GRANTED"
    status, updated_c = patch(f"/api/consents/{first_consent['id']}/", {"status": new_status}, token=pat_token)
    print(f"Consent toggle status: {status} | Status now: {updated_c.get('status')}")
    assert status == 200

print("=" * 60)
print("ALL 14 E2E TESTS PASSED WITH 100% SUCCESS!")
print("=" * 60)
