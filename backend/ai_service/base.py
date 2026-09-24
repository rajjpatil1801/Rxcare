"""
Base Abstract Class for RxCare AI Decision Support Services
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List


class BaseAIService(ABC):
    DISCLAIMER = "For demonstration only. Review all information using professional clinical judgment. The software provides decision support; the doctor makes the final clinical decision."

    @abstractmethod
    def generate_clinical_insight(
        self,
        patient_data: Dict[str, Any],
        candidate_medicines: List[Dict[str, Any]],
        safety_alerts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates explainable clinical decision support insights.
        Returns dictionary containing:
        - provider: 'OllamaAIService' or 'DemoAIService'
        - summary: High level patient context summary
        - key_observations: List of important considerations
        - safety_interpretation: Clinical explanation of triggered safety warnings
        - lab_correlation: Relevant lab values to review
        - suggested_review_points: Bullet points for doctor to consider
        - disclaimer: Strict demo notice
        """
        pass
