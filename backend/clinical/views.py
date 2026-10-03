from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from core.models import PatientProfile, AuditLog, Notification
from .models import (
    MedicalCondition, MedicalHistory, Allergy, AdverseDrugReaction,
    Vital, LabReport, LabResult, Appointment, Consent, LabTestOrder, LabTestOrderItem
)
from .serializers import (
    PatientProfileSerializer, MedicalConditionSerializer,
    MedicalHistorySerializer, AllergySerializer, AdverseDrugReactionSerializer,
    VitalSerializer, LabReportSerializer, LabResultSerializer,
    AppointmentSerializer, ConsentSerializer, LabTestOrderSerializer
)
from .fhir_serializers import (
    fhir_patient, fhir_condition, fhir_allergy, fhir_vital_observation, fhir_diagnostic_report
)


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PatientProfile.objects.filter(is_archived=False).order_by('-created_at')

        # If logged in user is a patient, restrict to their own profile
        if user.role == 'PATIENT' and hasattr(user, 'patient_profile'):
            return PatientProfile.objects.filter(id=user.patient_profile.id)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(patient_id__icontains=search) |
                Q(phone__icontains=search)
            )
        gender = self.request.query_params.get('gender')
        if gender:
            qs = qs.filter(gender=gender)
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Audit log viewing of patient chart
        AuditLog.objects.create(
            actor=request.user,
            actor_name=request.user.get_full_name() or request.user.username,
            role=request.user.role,
            action="Doctor viewed patient chart" if request.user.role == 'DOCTOR' else f"{request.user.role} viewed patient chart",
            resource_type="Patient",
            resource_id=instance.patient_id,
            details=f"Viewed full clinical profile of {instance.full_name}"
        )
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Auto-generate unique patient ID if not provided
        last_patient = PatientProfile.objects.order_by('-id').first()
        next_num = 1001 if not last_patient else (last_patient.id + 1001)
        patient_id = f"98765432{next_num}"
        patient = serializer.save(patient_id=patient_id)

        AuditLog.objects.create(
            actor=self.request.user,
            actor_name=self.request.user.get_full_name() or self.request.user.username,
            role=self.request.user.role,
            action="Patient registered",
            resource_type="Patient",
            resource_id=patient.patient_id,
            details=f"Registered new patient {patient.full_name}"
        )


class MedicalConditionViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalConditionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return MedicalCondition.objects.filter(patient_id=patient_id)
        return MedicalCondition.objects.all()

    def perform_create(self, serializer):
        condition = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            actor_name=self.request.user.get_full_name() or self.request.user.username,
            role=self.request.user.role,
            action="Condition added",
            resource_type="MedicalCondition",
            resource_id=str(condition.id),
            details=f"Added medical condition '{condition.condition_name}' ({condition.status}) for {condition.patient.full_name}"
        )


class MedicalHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return MedicalHistory.objects.filter(patient_id=patient_id).order_by('-event_date')
        return MedicalHistory.objects.all().order_by('-event_date')


class AllergyViewSet(viewsets.ModelViewSet):
    serializer_class = AllergySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return Allergy.objects.filter(patient_id=patient_id)
        return Allergy.objects.all()

    def perform_create(self, serializer):
        allergy = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            actor_name=self.request.user.get_full_name() or self.request.user.username,
            role=self.request.user.role,
            action="Allergy added",
            resource_type="Allergy",
            resource_id=str(allergy.id),
            details=f"Added allergy '{allergy.substance}' ({allergy.severity}) for {allergy.patient.full_name}"
        )


class AdverseDrugReactionViewSet(viewsets.ModelViewSet):
    serializer_class = AdverseDrugReactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return AdverseDrugReaction.objects.filter(patient_id=patient_id)
        return AdverseDrugReaction.objects.all()


class VitalViewSet(viewsets.ModelViewSet):
    serializer_class = VitalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return Vital.objects.filter(patient_id=patient_id).order_by('-recorded_at')
        return Vital.objects.all().order_by('-recorded_at')

    def perform_create(self, serializer):
        vital = serializer.save()
        patient = vital.patient
        updated = False
        if 'weight_kg' in self.request.data and self.request.data['weight_kg'] is not None:
            try:
                patient.weight_kg = float(self.request.data['weight_kg'])
                updated = True
            except (ValueError, TypeError):
                pass
        if 'height_cm' in self.request.data and self.request.data['height_cm'] is not None:
            try:
                patient.height_cm = float(self.request.data['height_cm'])
                updated = True
            except (ValueError, TypeError):
                pass
        if updated:
            patient.save()

        AuditLog.objects.create(
            actor=self.request.user,
            actor_name=self.request.user.get_full_name() or self.request.user.username,
            role=self.request.user.role,
            action="Vitals recorded",
            resource_type="Vital",
            resource_id=str(vital.id),
            details=f"Recorded vitals for {patient.full_name}: BP {vital.blood_pressure_sys}/{vital.blood_pressure_dia}, HR {vital.heart_rate} bpm, Glucose {vital.blood_glucose} mg/dL, BMI {vital.bmi}"
        )


class LabReportViewSet(viewsets.ModelViewSet):
    serializer_class = LabReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT' and hasattr(user, 'patient_profile'):
            return LabReport.objects.filter(patient=user.patient_profile).order_by('-report_date')
        
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return LabReport.objects.filter(patient_id=patient_id).order_by('-report_date')
        return LabReport.objects.all().order_by('-report_date')

    def create(self, request, *args, **kwargs):
        import json
        # Support creating report and multiple nested results at once
        data = request.data.copy()
        
        # Handle multipart/form-data json fields if necessary
        results_data = data.pop('results', [])
        if isinstance(results_data, list) and len(results_data) == 1 and isinstance(results_data[0], str):
            try:
                results_data = json.loads(results_data[0])
            except:
                pass
        elif isinstance(results_data, str):
            try:
                results_data = json.loads(results_data)
            except:
                results_data = []
        
        file_obj = request.FILES.get('file')
        if file_obj:
            data['file_attachment'] = file_obj

        order_id = data.get('order_id')
        if order_id:
            if isinstance(order_id, list):
                order_id = order_id[0]
            try:
                order = LabTestOrder.objects.get(id=order_id)
                first_item = order.items.first()
                test_name = first_item.test_name if first_item else f"Lab Order #{order.id}"
                
                if 'report_title' not in data:
                    data['report_title'] = test_name
                if 'status' not in data:
                    data['status'] = 'ABNORMAL'
                if 'patient' not in data:
                    data['patient'] = order.patient_id

                Allergy.objects.create(
                    patient=order.patient,
                    substance=f"{test_name} Findings",
                    reaction="Automated extraction from Lab Report",
                    severity="HIGH"
                )

                order.status = 'COMPLETED'
                order.save()
            except LabTestOrder.DoesNotExist:
                pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(laboratory_user=request.user if request.user.is_authenticated else None)

        # Create nested results if passed
        if isinstance(results_data, list):
            for r in results_data:
                LabResult.objects.create(
                    report=report,
                    test_name=r.get('test_name', 'Test'),
                    value=float(r.get('value', 0.0)),
                    unit=r.get('unit', ''),
                    reference_range=r.get('reference_range', ''),
                    flag=r.get('flag', 'Normal'),
                    notes=r.get('notes', '')
                )

        # Audit log lab report upload
        AuditLog.objects.create(
            actor=request.user,
            actor_name=request.user.get_full_name() or request.user.username,
            role=request.user.role,
            action="Lab report uploaded",
            resource_type="LabReport",
            resource_id=str(report.id),
            details=f"Uploaded '{report.report_title}' for {report.patient.full_name}"
        )

        # Send notification to patient if linked
        if report.patient.user:
            Notification.objects.create(
                recipient=report.patient.user,
                title="New Lab Report Available",
                message=f"Your laboratory results for '{report.report_title}' have been published.",
                notification_type=Notification.Type.LAB_REPORT,
                link=f"/patient/labs?report_id={report.id}"
            )

        return Response(LabReportSerializer(report).data, status=status.HTTP_201_CREATED)


class LabTrendsView(APIView):
    """
    Returns time-series test results for Recharts visualization.
    Formatted for charts: Glucose, HbA1c, Creatinine, Total Cholesterol.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get('patient')
        if not patient_id:
            # Fallback to first patient or requesting patient
            if request.user.role == 'PATIENT' and hasattr(request.user, 'patient_profile'):
                patient = request.user.patient_profile
            else:
                patient = PatientProfile.objects.first()
        else:
            patient = PatientProfile.objects.filter(id=patient_id).first()

        if not patient:
            return Response([])

        # Gather results chronologically
        results = LabResult.objects.filter(report__patient=patient).select_related('report').order_by('report__report_date')

        # Group by date
        data_by_date = {}
        for r in results:
            date_str = str(r.report.report_date)
            if date_str not in data_by_date:
                data_by_date[date_str] = {'date': date_str}
            
            # Map canonical test names
            t_name = r.test_name.lower()
            if 'glucose' in t_name:
                data_by_date[date_str]['glucose'] = r.value
            elif 'hba1c' in t_name:
                data_by_date[date_str]['hba1c'] = r.value
            elif 'creatinine' in t_name:
                data_by_date[date_str]['creatinine'] = r.value
            elif 'cholesterol' in t_name:
                data_by_date[date_str]['cholesterol'] = r.value
            elif 'alt' in t_name:
                data_by_date[date_str]['alt'] = r.value

        chart_data = sorted(list(data_by_date.values()), key=lambda x: x['date'])
        return Response(chart_data)


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT' and hasattr(user, 'patient_profile'):
            return Appointment.objects.filter(patient=user.patient_profile).order_by('scheduled_time')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return Appointment.objects.filter(patient_id=patient_id).order_by('scheduled_time')
        return Appointment.objects.all().order_by('scheduled_time')

    def perform_create(self, serializer):
        appointment = serializer.save(doctor=self.request.user)
        # Notify patient
        if appointment.patient.user:
            Notification.objects.create(
                recipient=appointment.patient.user,
                title="Appointment Confirmed",
                message=f"Appointment scheduled with {appointment.doctor.get_full_name()} for {appointment.scheduled_time.strftime('%b %d, %Y at %I:%M %p')}",
                notification_type=Notification.Type.APPOINTMENT,
                link="/appointments"
            )


class ConsentViewSet(viewsets.ModelViewSet):
    serializer_class = ConsentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT' and hasattr(user, 'patient_profile'):
            return Consent.objects.filter(patient=user.patient_profile).order_by('-granted_date')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return Consent.objects.filter(patient_id=patient_id).order_by('-granted_date')
        return Consent.objects.all().order_by('-granted_date')

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            actor_name=self.request.user.get_full_name() or self.request.user.username,
            role=self.request.user.role,
            action=f"Consent {instance.status.lower()}",
            resource_type="Consent",
            resource_id=str(instance.id),
            details=f"Patient {instance.patient.full_name} set consent status to '{instance.status}' for {instance.provider_name}"
        )


class LabTestOrderViewSet(viewsets.ModelViewSet):
    serializer_class = LabTestOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT' and hasattr(user, 'patient_profile'):
            return LabTestOrder.objects.filter(patient=user.patient_profile).order_by('-created_at')
        
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return LabTestOrder.objects.filter(patient_id=patient_id).order_by('-created_at')
        return LabTestOrder.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        items_data = data.pop('items', [])

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(ordered_by=request.user)

        if isinstance(items_data, list):
            for i in items_data:
                LabTestOrderItem.objects.create(
                    order=order,
                    case_code=i.get('case_code', ''),
                    test_name=i.get('test_name', ''),
                    clinical_scenario=i.get('clinical_scenario', '')
                )

        AuditLog.objects.create(
            actor=request.user,
            actor_name=request.user.get_full_name() or request.user.username,
            role=request.user.role,
            action="Lab test order created",
            resource_type="LabTestOrder",
            resource_id=str(order.id),
            details=f"Ordered lab tests for {order.patient.full_name}"
        )

        if order.patient.user:
            Notification.objects.create(
                recipient=order.patient.user,
                title="New Lab Test Order",
                message=f"Your doctor has ordered new lab tests.",
                notification_type=Notification.Type.LAB_REPORT,
                link=f"/patient/lab-orders"
            )

        return Response(LabTestOrderSerializer(order).data, status=status.HTTP_201_CREATED)


class FHIRResourceView(APIView):
    """
    Exposes prototype FHIR R4 JSON representation for clinical resources.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, resource_type, resource_id):
        r_type = resource_type.lower()
        if r_type == 'patient':
            p = PatientProfile.objects.filter(id=resource_id).first()
            if not p:
                return Response({'error': 'Patient not found'}, status=404)
            return Response(fhir_patient(p))

        elif r_type == 'condition':
            c = MedicalCondition.objects.filter(id=resource_id).first()
            if not c:
                return Response({'error': 'Condition not found'}, status=404)
            return Response(fhir_condition(c))

        elif r_type == 'allergy':
            a = Allergy.objects.filter(id=resource_id).first()
            if not a:
                return Response({'error': 'Allergy not found'}, status=404)
            return Response(fhir_allergy(a))

        elif r_type == 'observation':
            v = Vital.objects.filter(id=resource_id).first()
            if not v:
                return Response({'error': 'Observation not found'}, status=404)
            return Response(fhir_vital_observation(v))

        elif r_type == 'diagnosticreport':
            l = LabReport.objects.filter(id=resource_id).first()
            if not l:
                return Response({'error': 'DiagnosticReport not found'}, status=404)
            return Response(fhir_diagnostic_report(l))

        return Response({'error': f'Unsupported FHIR resource type {resource_type}'}, status=400)
