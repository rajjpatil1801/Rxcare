"""
AI Service Factory for RxCare
Automatically selects OllamaAIService if available, or seamlessly falls back to DemoAIService.
"""
from typing import Dict, Any, List
from .base import BaseAIService
from .ollama_service import OllamaAIService
from .demo_service import DemoAIService


class AIService(BaseAIService):
    def __init__(self):
        self.ollama = OllamaAIService()
        self.demo = DemoAIService()

    def generate_clinical_insight(
        self,
        patient_data: Dict[str, Any],
        candidate_medicines: List[Dict[str, Any]],
        safety_alerts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        # Check if Ollama is running and responding
        if self.ollama.is_available():
            try:
                return self.ollama.generate_clinical_insight(patient_data, candidate_medicines, safety_alerts)
            except Exception:
                # Log or ignore and fall back to demo
                pass
        
        # Fallback to deterministic rich DemoAIService
        return self.demo.generate_clinical_insight(patient_data, candidate_medicines, safety_alerts)


# Singleton instance
ai_service = AIService()
