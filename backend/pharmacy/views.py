import io
import base64
import qrcode
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
from django.db.models import Q
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from core.models import User, PatientProfile, AuditLog, Notification
from .models import Medicine, MedicineInteraction, Pharmacy, PharmacyInventory, Prescription, PrescriptionMedicine, DispensingRecord
from .serializers import (
    MedicineSerializer, MedicineInteractionSerializer,
    PrescriptionSerializer, PharmacySerializer, PharmacyInventorySerializer, DispensingRecordSerializer
)
from safety_engine.checker import run_clinical_safety_check
from ai_service import ai_service


def generate_qr_base64(data_text: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(data_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"


class MedicineViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MedicineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Medicine.objects.all().order_by('generic_name')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(generic_name__icontains=search) |
                Q(brand_name__icontains=search) |
                Q(category__icontains=search)
            )
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__icontains=category)
        return qs


class MedicineInteractionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MedicineInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = MedicineInteraction.objects.all()


class SafetyCheckView(APIView):
    """
    Runs deterministic clinical safety check against candidate medicines and patient history.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        patient_id = request.data.get('patient_id')
        medicines = request.data.get('medicines', [])

        if not patient_id:
            return Response({'error': 'patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        results = run_clinical_safety_check(patient_id, medicines)
        return Response(results)


class AIInsightsView(APIView):
    """
    Generates explainable clinical decision support insights via Ollama or Demo fallback.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        patient_id = request.data.get('patient_id')
        medicines = request.data.get('medicines', [])
        safety_alerts = request.data.get('safety_alerts', [])

        patient = PatientProfile.objects.filter(id=patient_id).first()
        patient_data = {
            'name': patient.full_name if patient else 'Patient',
            'conditions': [c.condition_name for c in patient.conditions.all()] if patient else [],
            'allergies': [a.substance for a in patient.allergies.all()] if patient else [],
            'active_medications': [f"{m.get('generic_name', '')}" for m in medicines]
        }

        insights = ai_service.generate_clinical_insight(patient_data, medicines, safety_alerts)
        return Response(insights)


class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Prescription.objects.all().order_by('-created_at')

        if user.role == 'PATIENT' and hasattr(user, 'patient_profile'):
            return qs.filter(patient=user.patient_profile)
        
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    def create(self, request, *args, **kwargs):
        data = request.data
        patient_id = data.get('patient_id') or data.get('patient')
        items_data = data.get('items') or data.get('medicines') or []
        diagnosis = data.get('diagnosis', 'Clinical Consultation')
        instructions = data.get('general_instructions') or data.get('notes', '')
        follow_up = data.get('follow_up_date')

        patient = PatientProfile.objects.get(id=patient_id)

        # Generate unique prescription ID: RX-YYYYMM-XXXX
        now = timezone.now()
        rx_count = Prescription.objects.count() + 1
        rx_id = f"RX{now.strftime('%Y%m')}{rx_count:04d}"

        prescription = Prescription.objects.create(
            prescription_id=rx_id,
            patient=patient,
            doctor=request.user,
            doctor_name=request.user.get_full_name() or f"Dr. {request.user.username}",
            diagnosis=diagnosis,
            general_instructions=instructions,
            follow_up_date=follow_up if follow_up else None,
            status=Prescription.Status.DRAFT
        )

        for idx, item in enumerate(items_data):
            med_id = item.get('medicine_id') or item.get('medicine')
            med = Medicine.objects.filter(id=med_id).first() if med_id else None
            gen_name = item.get('generic_name') or (med.generic_name if med else 'Medicine')
            brand_name = item.get('brand_name') or (med.brand_name if med else '')

            if not med:
                med, _ = Medicine.objects.get_or_create(
                    generic_name=gen_name,
                    defaults={'brand_name': brand_name, 'strength': item.get('dosage', 'Standard')}
                )

            PrescriptionMedicine.objects.create(
                prescription=prescription,
                medicine=med,
                generic_name=gen_name,
                brand_name=brand_name,
                dosage=item.get('dosage', 'Standard Dose'),
                frequency=item.get('frequency', 'Once Daily'),
                duration_days=int(item.get('duration_days', 7)),
                route=item.get('route', 'Oral'),
                instructions=item.get('instructions', ''),
                order_index=idx
            )

        AuditLog.objects.create(
            actor=request.user,
            actor_name=request.user.get_full_name() or request.user.username,
            role=request.user.role,
            action="Prescription created (Draft)",
            resource_type="Prescription",
            resource_id=rx_id,
            details=f"Drafted prescription with {len(items_data)} items for {patient.full_name}"
        )

        return Response(PrescriptionSerializer(prescription).data, status=status.HTTP_201_CREATED)


class FinalizePrescriptionView(APIView):
    """
    Finalizes a prescription, generates QR code and updates state.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            rx = Prescription.objects.get(pk=pk)
        except Prescription.DoesNotExist:
            return Response({'error': 'Prescription not found'}, status=404)

        # Generate QR code
        verification_payload = f"RXCARE:VERIFY:{rx.prescription_id}:{rx.patient.patient_id}"
        qr_b64 = generate_qr_base64(verification_payload)

        rx.status = Prescription.Status.FINALIZED
        rx.qr_code_data = qr_b64
        rx.finalized_at = timezone.now()
        rx.save()

        # Audit event
        AuditLog.objects.create(
            actor=request.user,
            actor_name=request.user.get_full_name() or request.user.username,
            role=request.user.role,
            action="Prescription finalized & signed",
            resource_type="Prescription",
            resource_id=rx.prescription_id,
            details=f"Digital prescription signed with QR code by {rx.doctor_name}"
        )

        # Notify Patient
        if rx.patient.user:
            Notification.objects.create(
                recipient=rx.patient.user,
                title="New Prescription Issued",
                message=f"Dr. {rx.doctor_name} has finalized your digital prescription #{rx.prescription_id}.",
                notification_type=Notification.Type.PRESCRIPTION_NEW,
                link=f"/patient/prescriptions?id={rx.id}"
            )

        return Response(PrescriptionSerializer(rx).data)


class PrescriptionVerifyView(APIView):
    """
    Allows pharmacy to search/verify prescription by ID or QR scan payload.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, prescription_id):
        clean_id = prescription_id.replace('RXCARE:VERIFY:', '').split(':')[0].strip()
        rx = Prescription.objects.filter(prescription_id__iexact=clean_id).first()

        if not rx:
            return Response({
                'is_valid': False,
                'status': 'INVALID',
                'message': f"Prescription ID '{prescription_id}' not found in RxCare registry."
            }, status=status.HTTP_404_NOT_FOUND)

        # If it was finalized, mark verified on first scan
        if rx.status == Prescription.Status.FINALIZED:
            rx.status = Prescription.Status.VERIFIED
            rx.save()

        AuditLog.objects.create(
            actor=request.user,
            actor_name=request.user.get_full_name() or request.user.username,
            role=request.user.role,
            action="Pharmacy verified prescription",
            resource_type="Prescription",
            resource_id=rx.prescription_id,
            details=f"Prescription verified at pharmacy by {request.user.username}"
        )

        return Response({
            'is_valid': rx.status not in [Prescription.Status.CANCELLED, Prescription.Status.DRAFT],
            'status': rx.status,
            'prescription': PrescriptionSerializer(rx).data
        })


class DispensePrescriptionView(APIView):
    """
    Dispenses prescription items, updates status, and logs dispensing record.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        prescription_id = request.data.get('prescription_id')
        item_ids = request.data.get('item_ids', []) # IDs of prescribed medicines to dispense
        pharmacy_name = request.data.get('pharmacy_name', 'Apollo Care Pharmacy')
        notes = request.data.get('notes', 'Dispensed in full as prescribed')

        if str(prescription_id).isdigit():
            rx = Prescription.objects.filter(Q(id=int(prescription_id)) | Q(prescription_id=str(prescription_id))).first()
        else:
            rx = Prescription.objects.filter(prescription_id=str(prescription_id)).first()
        if not rx:
            return Response({'error': 'Prescription not found'}, status=404)

        if not item_ids:
            # Dispense all items
            rx.items.all().update(is_dispensed=True)
            rx.status = Prescription.Status.DISPENSED
            dispensed_summary = "All prescribed items dispensed."
        else:
            rx.items.filter(id__in=item_ids).update(is_dispensed=True)
            all_dispensed = not rx.items.filter(is_dispensed=False).exists()
            rx.status = Prescription.Status.DISPENSED if all_dispensed else Prescription.Status.PARTIALLY_DISPENSED
            dispensed_summary = f"{len(item_ids)} item(s) dispensed."

        rx.dispensed_at = timezone.now()
        rx.save()

        # Create dispensing record
        DispensingRecord.objects.create(
            prescription=rx,
            pharmacy_name=pharmacy_name,
            dispensed_by=request.user,
            dispensed_items_summary=dispensed_summary,
            notes=notes
        )

        # Audit entry
        AuditLog.objects.create(
            actor=request.user,
            actor_name=request.user.get_full_name() or request.user.username,
            role=request.user.role,
            action="Medicine dispensed",
            resource_type="Prescription",
            resource_id=rx.prescription_id,
            details=f"Dispensed at {pharmacy_name} - {dispensed_summary}"
        )

        # Notify patient
        if rx.patient.user:
            Notification.objects.create(
                recipient=rx.patient.user,
                title="Prescription Dispensed",
                message=f"Your prescription #{rx.prescription_id} has been dispensed by {pharmacy_name}.",
                notification_type=Notification.Type.DISPENSING,
                link=f"/patient/prescriptions?id={rx.id}"
            )

        return Response({
            'status': 'success',
            'prescription': PrescriptionSerializer(rx).data
        })


class PharmacySearchView(APIView):
    """
    Search nearby demo pharmacies with distance and medicine stock availability.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        medicine_id = request.query_params.get('medicine_id')
        medicine_name = request.query_params.get('name', '')

        pharmacies = Pharmacy.objects.all().order_by('distance_km')
        results = []

        for p in pharmacies:
            # Look up stock if medicine provided
            stock_status = 'IN_STOCK'
            unit_price = 45.00

            if medicine_id:
                inv = PharmacyInventory.objects.filter(pharmacy=p, medicine_id=medicine_id).first()
                if inv:
                    stock_status = inv.status
                    unit_price = float(inv.unit_price)
            elif medicine_name:
                inv = PharmacyInventory.objects.filter(pharmacy=p, medicine__generic_name__icontains=medicine_name).first()
                if inv:
                    stock_status = inv.status
                    unit_price = float(inv.unit_price)

            results.append({
                'id': p.id,
                'name': p.name,
                'address': p.address,
                'phone': p.phone,
                'distance_km': p.distance_km,
                'rating': p.rating,
                'stock_status': stock_status,
                'unit_price': unit_price
            })

        return Response(results)


class PrescriptionPDFView(APIView):
    """
    Generates downloadable professional PDF prescription using ReportLab.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        rx = Prescription.objects.filter(pk=pk).first()
        if not rx:
            return HttpResponse("Prescription not found", status=404)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'RxTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            textColor=colors.HexColor('#0284c7'),
            alignment=0,
            spaceAfter=4
        )

        sub_style = ParagraphStyle(
            'RxSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=14
        )

        elements.append(Paragraph("RxCare Healthcare Network", title_style))
        elements.append(Paragraph("Digital Clinical Prescription & Medication Safety Record", sub_style))
        elements.append(Spacer(1, 10))

        # Meta table: Doctor vs Patient
        patient_info = f"""<b>Patient:</b> {rx.patient.full_name}<br/>
<b>ID:</b> {rx.patient.patient_id} | <b>Gender:</b> {rx.patient.gender} | <b>Blood:</b> {rx.patient.blood_group}<br/>
<b>Date of Birth:</b> {rx.patient.date_of_birth or '1984-05-12'}<br/>
<b>Address:</b> {rx.patient.address or 'Demo Address'}"""

        doctor_info = f"""<b>Prescribing Doctor:</b> {rx.doctor_name}<br/>
<b>Specialty:</b> Cardiology & Internal Medicine<br/>
<b>License:</b> MCI-DL-99821<br/>
<b>Prescription ID:</b> {rx.prescription_id}<br/>
<b>Date:</b> {rx.created_at.strftime('%d %b %Y')} | <b>Status:</b> {rx.status}"""

        meta_table = Table([
            [Paragraph(patient_info, styles['Normal']), Paragraph(doctor_info, styles['Normal'])]
        ], colWidths=[270, 270])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        # Diagnosis
        if rx.diagnosis:
            elements.append(Paragraph(f"<b>Clinical Diagnosis:</b> {rx.diagnosis}", styles['Normal']))
            elements.append(Spacer(1, 10))

        # Prescribed Medicines Table
        med_rows = [["#", "Medicine / Generic", "Dosage", "Frequency", "Duration", "Instructions"]]
        for idx, item in enumerate(rx.items.all(), 1):
            med_rows.append([
                str(idx),
                f"{item.generic_name}\n({item.brand_name})" if item.brand_name else item.generic_name,
                item.dosage,
                item.frequency,
                f"{item.duration_days} days",
                item.instructions or "As directed"
            ])

        med_table = Table(med_rows, colWidths=[25, 170, 80, 110, 60, 95])
        med_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        elements.append(med_table)
        elements.append(Spacer(1, 15))

        # General instructions & follow up
        if rx.general_instructions:
            elements.append(Paragraph(f"<b>Doctor's Advice:</b> {rx.general_instructions}", styles['Normal']))
            elements.append(Spacer(1, 6))

        if rx.follow_up_date:
            elements.append(Paragraph(f"<b>Follow-up Date:</b> {rx.follow_up_date.strftime('%d %b %Y')}", styles['Normal']))
            elements.append(Spacer(1, 10))

        # Footer notice
        footer_text = f"Digitally authenticated through RxCare Decision Support Platform. Verification Code: {rx.prescription_id}. For pharmacy dispensing verification."
        elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Italic'], fontSize=8, textColor=colors.HexColor('#94a3b8'))))

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{rx.prescription_id}.pdf"'
        return response


class PharmacyInventoryViewSet(viewsets.ModelViewSet):
    serializer_class = PharmacyInventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = PharmacyInventory.objects.select_related('medicine', 'pharmacy').all().order_by('medicine__generic_name')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(medicine__generic_name__icontains=search) |
                Q(medicine__brand_name__icontains=search) |
                Q(status__icontains=search)
            )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class DispensingRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DispensingRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = DispensingRecord.objects.select_related('prescription', 'prescription__patient', 'dispensed_by').all().order_by('-timestamp')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(prescription__prescription_id__icontains=search) |
                Q(prescription__patient__first_name__icontains=search) |
                Q(prescription__patient__last_name__icontains=search) |
                Q(pharmacy_name__icontains=search) |
                Q(dispensed_items_summary__icontains=search)
            )
        return qs

