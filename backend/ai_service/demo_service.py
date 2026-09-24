"""
DemoAIService: Reliable, zero-dependency, rule-enhanced clinical insight generator.
Used as fallback or primary demo provider when local Ollama is not installed/running.
"""
from typing import Dict, Any, List
from .base import BaseAIService


class DemoAIService(BaseAIService):
    def generate_clinical_insight(
        self,
        patient_data: Dict[str, Any],
        candidate_medicines: List[Dict[str, Any]],
        safety_alerts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        patient_name = patient_data.get('name', 'Patient')
        conditions = patient_data.get('conditions', [])
        allergies = patient_data.get('allergies', [])
        active_meds = patient_data.get('active_medications', [])
        
        prescribed_names = [m.get('generic_name') or m.get('brand_name') or 'Medicine' for m in candidate_medicines]

        key_observations = []
        if conditions:
            key_observations.append(f"Patient has active clinical history of: {', '.join(conditions)}.")
        if allergies:
            key_observations.append(f"Documented severe hypersensitivity to: {', '.join(allergies)}.")
        if active_meds:
            key_observations.append(f"Currently maintained on active chronic medications: {', '.join(active_meds)}.")

        safety_interpretation = []
        for alert in safety_alerts:
            sev = alert.get('severity', 'moderate').upper()
            title = alert.get('title', 'Clinical Alert')
            why = alert.get('why', '')
            action = alert.get('recommendation', '')
            safety_interpretation.append({
                "alert_title": title,
                "severity": sev,
                "clinical_rationale": why,
                "suggested_action": action
            })

        lab_correlation = []
        # Check if renal or glycemic considerations apply
        has_diabetes = any('diabet' in c.lower() for c in conditions)
        has_htn = any('hyperten' in c.lower() or 'bp' in c.lower() for c in conditions)
        
        if has_diabetes:
            lab_correlation.append("Review latest Fasting Blood Glucose and HbA1c to gauge current glycemic control trajectory.")
        if has_htn or any('metformin' in m.lower() for m in prescribed_names):
            lab_correlation.append("Verify latest Serum Creatinine and eGFR before initiating or escalating renally-cleared medications.")

        suggested_review_points = [
            f"Cross-verify prescribed medications ({', '.join(prescribed_names) if prescribed_names else 'selected items'}) against known allergen triggers.",
            "Confirm patient adherence with existing chronic medication schedule.",
            "Provide clear verbal and written instructions regarding dosing interval and meal timing."
        ]
        if safety_alerts:
            suggested_review_points.insert(0, f"Doctor should personally review {len(safety_alerts)} flagged safety advisory item(s) before signing.")

        return {
            "provider": "DemoAIService (Local Fallback)",
            "status": "success",
            "title": "AI Clinical Decision Support Summary",
            "patient_context_summary": f"Reviewing prescription for {patient_name} with {len(candidate_medicines)} candidate item(s). Patient presents with {len(conditions)} documented condition(s) and {len(allergies)} allergy record(s).",
            "key_observations": key_observations,
            "safety_interpretation": safety_interpretation,
            "lab_correlation": lab_correlation,
            "suggested_review_points": suggested_review_points,
            "disclaimer": self.DISCLAIMER
        }
