"""
FHIR R4 Interoperability Serializers for RxCare Prototype
Maps internal clinical models to standard HL7 FHIR Release 4 JSON resource structures.
"""
from typing import Dict, Any
from core.models import PatientProfile
from clinical.models import MedicalCondition, Allergy, Vital, LabReport
from pharmacy.models import Medicine, Prescription


def fhir_patient(patient: PatientProfile) -> Dict[str, Any]:
    return {
        "resourceType": "Patient",
        "id": patient.patient_id,
        "identifier": [
            {
                "system": "https://rxcare.health/patients",
                "value": patient.patient_id
            },
            {
                "system": "https://healthid.ndhm.gov.in (ABDM - Future)",
                "value": f"91-{patient.patient_id}-ABHA"
            }
        ],
        "active": not patient.is_archived,
        "name": [
            {
                "use": "official",
                "family": patient.last_name,
                "given": [patient.first_name]
            }
        ],
        "telecom": [
            {"system": "phone", "value": patient.phone, "use": "mobile"},
            {"system": "email", "value": patient.email}
        ],
        "gender": patient.gender.lower() if patient.gender else "unknown",
        "birthDate": str(patient.date_of_birth) if patient.date_of_birth else None,
        "address": [
            {
                "use": "home",
                "text": patient.address
            }
        ]
    }


def fhir_condition(condition: MedicalCondition) -> Dict[str, Any]:
    return {
        "resourceType": "Condition",
        "id": f"cond-{condition.id}",
        "clinicalStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                "code": condition.status.lower()
            }]
        },
        "verificationStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                "code": "confirmed"
            }]
        },
        "code": {
            "coding": [{
                "system": "http://hl7.org/fhir/sid/icd-10",
                "code": condition.icd10_code or "R69",
                "display": condition.condition_name
            }],
            "text": condition.condition_name
        },
        "subject": {
            "reference": f"Patient/{condition.patient.patient_id}",
            "display": condition.patient.full_name
        },
        "recordedDate": str(condition.diagnosed_date)
    }


def fhir_allergy(allergy: Allergy) -> Dict[str, Any]:
    severity_map = {
        'MILD': 'mild',
        'MODERATE': 'moderate',
        'HIGH': 'severe',
        'CRITICAL': 'severe'
    }
    return {
        "resourceType": "AllergyIntolerance",
        "id": f"allergy-{allergy.id}",
        "clinicalStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                "code": "active"
            }]
        },
        "verificationStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                "code": "confirmed"
            }]
        },
        "criticality": "high" if allergy.severity in ['HIGH', 'CRITICAL'] else "low",
        "code": {
            "text": allergy.substance
        },
        "patient": {
            "reference": f"Patient/{allergy.patient.patient_id}",
            "display": allergy.patient.full_name
        },
        "reaction": [
            {
                "manifestation": [{"text": allergy.reaction}],
                "severity": severity_map.get(allergy.severity, "moderate")
            }
        ]
    }


def fhir_vital_observation(vital: Vital) -> Dict[str, Any]:
    return {
        "resourceType": "Observation",
        "id": f"vital-{vital.id}",
        "status": "final",
        "category": [
            {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "vital-signs",
                    "display": "Vital Signs"
                }]
            }
        ],
        "subject": {
            "reference": f"Patient/{vital.patient.patient_id}",
            "display": vital.patient.full_name
        },
        "effectiveDateTime": vital.recorded_at.isoformat(),
        "component": [
            {
                "code": {"text": "Systolic Blood Pressure"},
                "valueQuantity": {"value": vital.blood_pressure_sys, "unit": "mmHg"}
            },
            {
                "code": {"text": "Diastolic Blood Pressure"},
                "valueQuantity": {"value": vital.blood_pressure_dia, "unit": "mmHg"}
            },
            {
                "code": {"text": "Heart Rate"},
                "valueQuantity": {"value": vital.heart_rate, "unit": "beats/minute"}
            },
            {
                "code": {"text": "Blood Glucose"},
                "valueQuantity": {"value": vital.blood_glucose, "unit": "mg/dL"}
            }
        ]
    }


def fhir_medication_request(prescription: Prescription) -> Dict[str, Any]:
    items = []
    for item in prescription.items.all():
        items.append({
            "medicationCodeableConcept": {
                "text": f"{item.generic_name} ({item.dosage})"
            },
            "dosageInstruction": [
                {
                    "text": item.frequency,
                    "route": {"text": item.route},
                    "patientInstruction": item.instructions
                }
            ]
        })

    return {
        "resourceType": "MedicationRequest",
        "id": prescription.prescription_id,
        "status": "active" if prescription.status in ['FINALIZED', 'VERIFIED'] else prescription.status.lower(),
        "intent": "order",
        "subject": {
            "reference": f"Patient/{prescription.patient.patient_id}",
            "display": prescription.patient.full_name
        },
        "requester": {
            "display": prescription.doctor_name
        },
        "authoredOn": prescription.created_at.isoformat(),
        "reasonCode": [{"text": prescription.diagnosis}],
        "dosageInstruction": items
    }


def fhir_diagnostic_report(report: LabReport) -> Dict[str, Any]:
    results = []
    for r in report.results.all():
        results.append({
            "name": r.test_name,
            "value": r.value,
            "unit": r.unit,
            "referenceRange": r.reference_range,
            "interpretation": r.flag
        })

    return {
        "resourceType": "DiagnosticReport",
        "id": f"lab-{report.id}",
        "status": "final",
        "code": {
            "text": report.report_title
        },
        "subject": {
            "reference": f"Patient/{report.patient.patient_id}",
            "display": report.patient.full_name
        },
        "performer": [{
            "display": report.laboratory_name
        }],
        "effectiveDateTime": report.report_date.isoformat(),
        "results": results
    }
