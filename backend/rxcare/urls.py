"""
RxCare Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Core views
from core.views import (
    LoginView, LogoutView, CurrentUserView, RegisterView, AuditLogViewSet,
    NotificationViewSet, MarkNotificationsReadView, MessageViewSet, GlobalSearchView
)

# Clinical views
from clinical.views import (
    PatientViewSet, MedicalConditionViewSet, MedicalHistoryViewSet,
    AllergyViewSet, AdverseDrugReactionViewSet, VitalViewSet,
    LabReportViewSet, LabTrendsView, AppointmentViewSet, ConsentViewSet,
    LabTestOrderViewSet, FHIRResourceView
)

# Pharmacy views
from pharmacy.views import (
    MedicineViewSet, MedicineInteractionViewSet, SafetyCheckView,
    AIInsightsView, PrescriptionViewSet, FinalizePrescriptionView,
    PrescriptionVerifyView, DispensePrescriptionView, PharmacySearchView,
    PrescriptionPDFView, PharmacyInventoryViewSet, DispensingRecordViewSet
)

router = DefaultRouter()

# Core
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'messages', MessageViewSet, basename='message')

# Clinical
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'conditions', MedicalConditionViewSet, basename='condition')
router.register(r'medical-history', MedicalHistoryViewSet, basename='medical-history')
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'adverse-reactions', AdverseDrugReactionViewSet, basename='adverse-reaction')
router.register(r'vitals', VitalViewSet, basename='vital')
router.register(r'lab-reports', LabReportViewSet, basename='lab-report')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'consents', ConsentViewSet, basename='consent')
router.register(r'lab-test-orders', LabTestOrderViewSet, basename='lab-test-order')

# Pharmacy
router.register(r'medicines', MedicineViewSet, basename='medicine')
router.register(r'interactions', MedicineInteractionViewSet, basename='interaction')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'pharmacy-inventory', PharmacyInventoryViewSet, basename='pharmacy-inventory')
router.register(r'dispensing-records', DispensingRecordViewSet, basename='dispensing-record')


urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('api/auth/login/', LoginView.as_view(), name='api-login'),
    path('api/auth/register/', RegisterView.as_view(), name='api-register'),
    path('api/auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('api/auth/me/', CurrentUserView.as_view(), name='api-current-user'),

    # Clinical Safety & Decision Support
    path('api/safety-check/', SafetyCheckView.as_view(), name='api-safety-check'),
    path('api/ai-insights/', AIInsightsView.as_view(), name='api-ai-insights'),

    # Prescription operations
    path('api/prescriptions/<int:pk>/finalize/', FinalizePrescriptionView.as_view(), name='api-finalize-prescription'),
    path('api/prescriptions/<int:pk>/pdf/', PrescriptionPDFView.as_view(), name='api-prescription-pdf'),
    path('api/prescriptions/verify/<str:prescription_id>/', PrescriptionVerifyView.as_view(), name='api-verify-prescription'),
    path('api/dispensing/', DispensePrescriptionView.as_view(), name='api-dispensing'),

    # Labs & Trends
    path('api/lab-trends/', LabTrendsView.as_view(), name='api-lab-trends'),

    # Pharmacies
    path('api/pharmacies/', PharmacySearchView.as_view(), name='api-pharmacies'),
    path('api/pharmacies/search/', PharmacySearchView.as_view(), name='api-pharmacies-search'),

    # Interoperability & Search
    path('api/global-search/', GlobalSearchView.as_view(), name='api-global-search'),
    path('api/notifications/mark-read/', MarkNotificationsReadView.as_view(), name='api-notifications-mark-read'),
    path('api/fhir/<str:resource_type>/<int:resource_id>/', FHIRResourceView.as_view(), name='api-fhir-resource'),

    # Router endpoints
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
