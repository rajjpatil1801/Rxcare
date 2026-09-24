"""
OllamaAIService: Integrates with local Ollama instance (default port 11434).
Used when the user runs Ollama locally (e.g. llama3, mistral, or phi3).
"""
import requests
import json
from typing import Dict, Any, List
from .base import BaseAIService


class OllamaAIService(BaseAIService):
    def __init__(self, host: str = "http://localhost:11434", model: str = "llama3:latest", timeout_secs: int = 3):
        self.host = host
        self.model = model
        self.timeout_secs = timeout_secs

    def is_available(self) -> bool:
        try:
            resp = requests.get(f"{self.host}/api/tags", timeout=1.5)
            return resp.status_code == 200
        except Exception:
            return False

    def generate_clinical_insight(
        self,
        patient_data: Dict[str, Any],
        candidate_medicines: List[Dict[str, Any]],
        safety_alerts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        prompt = f"""
You are an AI Clinical Decision Support Assistant assisting a licensed physician on RxCare.
You provide decision support. You do NOT make final medical decisions.

Patient Profile:
- Name: {patient_data.get('name')}
- Conditions: {', '.join(patient_data.get('conditions', []))}
- Allergies: {', '.join(patient_data.get('allergies', []))}
- Active Medications: {', '.join(patient_data.get('active_medications', []))}

Prescription Candidate Medicines:
{json.dumps(candidate_medicines, indent=2)}

Safety Engine Triggered Alerts:
{json.dumps(safety_alerts, indent=2)}

Instructions:
1. Explain concisely why the safety engine flagged any interactions or allergy conflicts.
2. Highlight key patient parameters or lab values the doctor should review.
3. Keep tone objective, clinical, professional, and explainable.
Return a structured JSON with keys:
"patient_context_summary", "key_observations" (list of strings), "safety_interpretation" (list of objects with alert_title, severity, clinical_rationale, suggested_action), "lab_correlation" (list of strings), "suggested_review_points" (list of strings).
"""
        response = requests.post(
            f"{self.host}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=self.timeout_secs
        )

        if response.status_code == 200:
            raw_content = response.json().get('response', '{}')
            try:
                parsed = json.loads(raw_content)
                parsed['provider'] = f"OllamaAIService ({self.model})"
                parsed['status'] = 'success'
                parsed['disclaimer'] = self.DISCLAIMER
                return parsed
            except json.JSONDecodeError:
                pass
        
        raise ConnectionError("Ollama returned non-200 or invalid JSON response")
