from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import (
    User, AuditLog, Notification, Message,
    PatientProfile, DoctorProfile, LaboratoryProfile, PharmacyProfile
)
from .serializers import UserSerializer, AuditLogSerializer, NotificationSerializer, MessageSerializer
from pharmacy.models import Medicine, Prescription
from clinical.models import LabReport


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = (
            request.data.get('email') or
            request.data.get('username') or
            request.data.get('login_id') or
            request.data.get('identifier') or
            ''
        ).strip()
        password = request.data.get('password')
        expected_role = request.data.get('role', '').strip().upper()

        if not identifier or not password:
            return Response(
                {'error': 'Please provide your ID/email and password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Look up user by username, email, patient ID, or license number
        user = User.objects.filter(
            Q(username__iexact=identifier) |
            Q(email__iexact=identifier) |
            Q(patient_profile__patient_id__iexact=identifier) |
            Q(doctor_profile__license_number__iexact=identifier) |
            Q(lab_profile__license_number__iexact=identifier) |
            Q(pharmacy_profile__license_number__iexact=identifier)
        ).distinct().first()

        if not user:
            return Response(
                {'error': 'Invalid credentials. Please verify your ID/email and password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 2. Verify password
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials. Please verify your ID/email and password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 3. Verify account is active
        if not user.is_active:
            return Response(
                {'error': 'This account is inactive. Please contact system administration.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 4. Verify account role matches the selected role
        role_display_names = {
            'DOCTOR': 'Doctor',
            'PATIENT': 'Patient',
            'LABORATORY': 'Laboratory',
            'PHARMACY': 'Pharmacy',
            'ADMIN': 'Admin'
        }
        if expected_role and user.role.upper() != expected_role:
            target_role_display = role_display_names.get(expected_role, expected_role.capitalize())
            return Response(
                {'error': f"These credentials do not belong to a {target_role_display} account."},
                status=status.HTTP_403_FORBIDDEN
            )

        token, _ = Token.objects.get_or_create(user=user)

        # Audit log login event
        AuditLog.objects.create(
            actor=user,
            actor_name=user.get_full_name() or user.username,
            role=user.role,
            action=f"User logged in ({user.role})",
            resource_type="Authentication",
            resource_id=str(user.id),
            details=f"Successful authentication for {user.username} ({user.role})"
        )

        # Direct dashboard redirection route based on verified role
        redirect_map = {
            User.Role.DOCTOR: '/doctor/dashboard',
            User.Role.PATIENT: '/patient/dashboard',
            User.Role.LABORATORY: '/lab',
            User.Role.PHARMACY: '/pharmacy'
        }

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'redirect_url': redirect_map.get(user.role, '/doctor/dashboard')
        })


class RegisterView(APIView):
    """
    Registers a new user with verified role and creates the corresponding clinical/pharmacy profile.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        role = data.get('role', '').strip().upper()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        phone = data.get('phone', '').strip()

        if not role or role not in User.Role.values:
            return Response({'error': 'Please select a valid role (Doctor, Patient, Laboratory, Pharmacy).'}, status=status.HTTP_400_BAD_REQUEST)

        if not password or len(password) < 4:
            return Response({'error': 'Password must be at least 4 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate default username/ID if not provided
        if not username:
            if role == User.Role.DOCTOR:
                count = DoctorProfile.objects.count() + 1001
                username = f"DR-{count}"
            elif role == User.Role.PATIENT:
                count = PatientProfile.objects.count() + 1001
                username = f"98765432{count}"
            elif role == User.Role.LABORATORY:
                count = LaboratoryProfile.objects.count() + 1001
                username = f"LAB-{count}"
            elif role == User.Role.PHARMACY:
                count = PharmacyProfile.objects.count() + 1001
                username = f"PHARM-{count}"

        # Check for duplicates
        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': f"An account with ID '{username}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email__iexact=email).exists():
            return Response({'error': f"An account with email '{email}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email or f"{username.lower()}@rxcare.local",
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role
        )

        # Create role-specific profile
        if role == User.Role.DOCTOR:
            DoctorProfile.objects.create(
                user=user,
                specialty=data.get('specialty') or 'General Medicine',
                license_number=data.get('license_number') or f"MCI-{username}",
                clinic_name=data.get('clinic_name') or 'RxCare Medical Center',
                qualification=data.get('qualification') or 'MBBS, MD',
                experience_years=int(data.get('experience_years', 5))
            )
        elif role == User.Role.PATIENT:
            patient_id = username if username.startswith('98765432') else f"98765432{PatientProfile.objects.count() + 1001}"
            PatientProfile.objects.create(
                user=user,
                patient_id=patient_id,
                first_name=first_name or 'Patient',
                last_name=last_name or '',
                email=email,
                phone=phone,
                gender=data.get('gender') or 'Male',
                blood_group=data.get('blood_group') or 'O+',
                date_of_birth=data.get('date_of_birth') or '1990-01-01',
                address=data.get('address') or 'Local Address',
                emergency_contact_name=data.get('emergency_contact_name') or 'Family Contact',
                emergency_contact_phone=data.get('emergency_contact_phone') or phone
            )
        elif role == User.Role.LABORATORY:
            LaboratoryProfile.objects.create(
                user=user,
                lab_name=data.get('lab_name') or f"{first_name or 'Clinical'} Diagnostic Lab",
                license_number=data.get('license_number') or f"LAB-{username}",
                contact_phone=phone or '+91 80 4455 6677',
                address=data.get('address') or 'Central Medical Diagnostics Hub'
            )
        elif role == User.Role.PHARMACY:
            PharmacyProfile.objects.create(
                user=user,
                pharmacy_name=data.get('pharmacy_name') or f"{first_name or 'RxCare'} Pharmacy",
                license_number=data.get('license_number') or f"PHARM-{username}",
                contact_phone=phone or '+91 80 2233 4455',
                address=data.get('address') or 'Main Healthcare Center Wing'
            )

        token, _ = Token.objects.get_or_create(user=user)

        AuditLog.objects.create(
            actor=user,
            actor_name=user.get_full_name() or user.username,
            role=user.role,
            action=f"New user registered ({user.role})",
            resource_type="Authentication",
            resource_id=str(user.id),
            details=f"New account registered: {user.username} ({user.role})"
        )

        redirect_map = {
            User.Role.DOCTOR: '/doctor/dashboard',
            User.Role.PATIENT: '/patient/dashboard',
            User.Role.LABORATORY: '/lab',
            User.Role.PHARMACY: '/pharmacy'
        }

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'redirect_url': redirect_map.get(user.role, '/doctor/dashboard'),
            'message': 'Account registered successfully.'
        }, status=status.HTTP_201_CREATED)



class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'})


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AuditLog.objects.all().order_by('-timestamp')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(action__icontains=search) | Q(actor_name__icontains=search) | Q(details__icontains=search))
        return qs[:100]


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)


class MarkNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'})


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        partner_id = self.request.query_params.get('partner_id')
        if partner_id:
            return Message.objects.filter(
                (Q(sender=user) & Q(recipient_id=partner_id)) |
                (Q(sender_id=partner_id) & Q(recipient=user))
            ).order_by('timestamp')
        return Message.objects.filter(Q(sender=user) | Q(recipient=user)).order_by('-timestamp')

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        # Notify recipient
        Notification.objects.create(
            recipient=msg.recipient,
            title="New Direct Message",
            message=f"{self.request.user.get_full_name() or self.request.user.username}: {msg.content[:80]}",
            notification_type=Notification.Type.SYSTEM,
            link="/messages"
        )


class GlobalSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return Response({'patients': [], 'medicines': [], 'prescriptions': [], 'lab_reports': []})

        # Patients
        patients = PatientProfile.objects.filter(
            Q(first_name__icontains=q) |
            Q(last_name__icontains=q) |
            Q(patient_id__icontains=q) |
            Q(phone__icontains=q)
        ).distinct()[:5]

        patient_results = [{
            'id': p.id,
            'title': p.full_name,
            'subtitle': f"ID: {p.patient_id} • Age: {p.gender}",
            'type': 'patient',
            'link': f"/doctor/patients/{p.id}"
        } for p in patients]

        # Medicines
        medicines = Medicine.objects.filter(
            Q(generic_name__icontains=q) |
            Q(brand_name__icontains=q) |
            Q(category__icontains=q)
        ).distinct()[:5]

        med_results = [{
            'id': m.id,
            'title': f"{m.generic_name} ({m.brand_name})",
            'subtitle': f"{m.strength} • {m.category}",
            'type': 'medicine',
            'link': f"/medicines?id={m.id}"
        } for m in medicines]

        # Prescriptions
        prescriptions = Prescription.objects.filter(
            Q(prescription_id__icontains=q) |
            Q(patient__first_name__icontains=q) |
            Q(patient__last_name__icontains=q) |
            Q(diagnosis__icontains=q)
        ).distinct()[:5]

        rx_results = [{
            'id': rx.id,
            'title': f"Rx #{rx.prescription_id} - {rx.patient.full_name}",
            'subtitle': f"Status: {rx.status} • {rx.diagnosis[:35]}",
            'type': 'prescription',
            'link': f"/doctor/prescriptions/{rx.id}"
        } for rx in prescriptions]

        # Lab Reports
        labs = LabReport.objects.filter(
            Q(report_title__icontains=q) |
            Q(patient__first_name__icontains=q) |
            Q(patient__last_name__icontains=q)
        ).distinct()[:5]

        lab_results = [{
            'id': l.id,
            'title': f"{l.report_title} - {l.patient.full_name}",
            'subtitle': f"{l.report_date} • {l.status}",
            'type': 'lab_report',
            'link': f"/doctor/patients/{l.patient.id}?tab=labs"
        } for l in labs]

        return Response({
            'patients': patient_results,
            'medicines': med_results,
            'prescriptions': rx_results,
            'lab_reports': lab_results
        })
