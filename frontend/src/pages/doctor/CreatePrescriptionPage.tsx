import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Pill, ShieldAlert, Sparkles, FileText, CheckCircle2,
  AlertTriangle, ArrowLeft, ArrowRight, Plus, Trash2, Printer,
  Download, QrCode, Search, RefreshCw, Check, Activity
} from 'lucide-react';
import { api } from '../../services/api';
import { Patient, Medicine, SafetyCheckResult, AIClinicalInsight, Prescription } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface PrescribedItem {
  medicine_id?: number;
  generic_name: string;
  brand_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route: string;
  instructions: string;
  allergy_class?: string;
}

export const CreatePrescriptionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Wizard state: Steps 1 to 7
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Patient Selection
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');

  // Step 2: Medicines Selection
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
  const [selectedItems, setSelectedItems] = useState<PrescribedItem[]>([]);
  const [itemForm, setItemForm] = useState<PrescribedItem>({
    generic_name: '',
    brand_name: '',
    dosage: '500 mg',
    frequency: 'Twice daily (BID) with meals',
    duration_days: 14,
    route: 'Oral',
    instructions: 'Take after meals with plenty of water',
  });

  // Step 3: Safety Check Results
  const [safetyResults, setSafetyResults] = useState<SafetyCheckResult | null>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);

  // Step 4: AI Insights
  const [aiInsights, setAiInsights] = useState<AIClinicalInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Step 5: Notes & Follow-up
  const [diagnosis, setDiagnosis] = useState('Essential Hypertension & Glycemic Optimization');
  const [generalInstructions, setGeneralInstructions] = useState('Maintain regular hydration. Monitor blood pressure daily and record in personal health log.');
  const [followUpDate, setFollowUpDate] = useState('2026-10-24');

  // Step 7: Finalized Result
  const [finalizedRx, setFinalizedRx] = useState<Prescription | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Real-time contraindication warning when selecting medicine
  interface ContraindicationWarning {
    severity: 'critical' | 'high' | 'moderate';
    title: string;
    why: string;
    recommendation: string;
    matchedCondition: string;
  }
  const [liveWarnings, setLiveWarnings] = useState<ContraindicationWarning[]>([]);

  // Comprehensive disease-drug contraindication rules from NABL clinical reference
  const CONTRAINDICATION_RULES = [
    // 1. Hypertension
    { conditions: ['hypertension', 'high blood pressure', 'htn', 'high bp'],
      drugs: ['ibuprofen', 'naproxen', 'diclofenac', 'ketorolac'],
      severity: 'high' as const, title: 'AVOID / CAUTION: NSAID in Hypertension',
      why: 'NSAIDs cause fluid retention and reduced antihypertensive effect. May worsen BP control.',
      recommendation: 'Use Paracetamol instead. If NSAID essential, use lowest dose and monitor BP.' },
    { conditions: ['hypertension', 'high blood pressure', 'htn', 'high bp'],
      drugs: ['pseudoephedrine', 'phenylephrine', 'ephedrine'],
      severity: 'high' as const, title: 'AVOID: Decongestant in Hypertension',
      why: 'Sympathomimetic decongestants cause vasoconstriction, raising blood pressure significantly.',
      recommendation: 'Use intranasal saline or antihistamines instead.' },
    { conditions: ['hypertension', 'high blood pressure', 'htn', 'high bp'],
      drugs: ['ergotamine'],
      severity: 'critical' as const, title: 'CONTRAINDICATED: Ergotamine in Hypertension',
      why: 'Ergot alkaloids cause marked vasoconstriction, significantly increasing vascular resistance and BP.',
      recommendation: 'Use triptans (e.g., Sumatriptan) for migraine instead.' },
    // 2. Diabetes
    { conditions: ['diabetes', 'diabetes mellitus', 'type 2 diabetes', 'type 1 diabetes', 'dm', 'diabetic'],
      drugs: ['prednisolone', 'prednisone', 'dexamethasone'],
      severity: 'high' as const, title: 'AVOID / CAUTION: Corticosteroid in Diabetes',
      why: 'Corticosteroids increase hepatic glucose production and reduce insulin sensitivity, causing hyperglycemia.',
      recommendation: 'Monitor glucose closely. Use lowest dose for shortest duration. Adjust insulin if needed.' },
    { conditions: ['diabetes', 'diabetes mellitus', 'type 2 diabetes', 'type 1 diabetes', 'dm', 'diabetic'],
      drugs: ['hydrochlorothiazide'],
      severity: 'moderate' as const, title: 'CAUTION: Thiazide Diuretic in Diabetes',
      why: 'Thiazide diuretics may impair glucose tolerance, particularly at higher doses.',
      recommendation: 'Use lowest dose (12.5 mg). Monitor fasting glucose regularly.' },
    { conditions: ['diabetes', 'diabetes mellitus', 'type 2 diabetes', 'type 1 diabetes', 'dm', 'diabetic'],
      drugs: ['olanzapine', 'clozapine'],
      severity: 'high' as const, title: 'CAUTION / AVOID: Atypical Antipsychotic in Diabetes',
      why: 'Can worsen glucose regulation, increase insulin resistance, and cause weight gain.',
      recommendation: 'Prefer Aripiprazole if antipsychotic needed. Monitor HbA1c and fasting glucose.' },
    { conditions: ['diabetes', 'diabetes mellitus', 'type 2 diabetes', 'type 1 diabetes', 'dm', 'diabetic'],
      drugs: ['niacin'],
      severity: 'moderate' as const, title: 'CAUTION: Niacin (Vitamin B3) in Diabetes',
      why: 'High-dose Niacin reduces insulin sensitivity and can increase blood glucose.',
      recommendation: 'Monitor glucose carefully. Consider statins as alternative for lipid management.' },
    { conditions: ['diabetes', 'diabetes mellitus', 'type 2 diabetes', 'type 1 diabetes', 'dm', 'diabetic'],
      drugs: ['salbutamol', 'albuterol'],
      severity: 'moderate' as const, title: 'CAUTION: Beta-2 Agonist in Diabetes',
      why: 'Systemic beta-2 stimulation can increase glucose via glycogenolysis.',
      recommendation: 'Use inhaled route. Monitor blood glucose if using nebulized/oral form.' },
    // 3. MI / Cardiac Risk
    { conditions: ['myocardial infarction', 'heart attack', 'acute mi', 'mi', 'acs', 'acute coronary', 'cardiac risk', 'cardiac'],
      drugs: ['ibuprofen', 'naproxen', 'diclofenac', 'ketorolac'],
      severity: 'high' as const, title: 'AVOID: NSAID in Cardiac Risk / MI',
      why: 'NSAIDs increase thrombotic cardiovascular risk and may worsen outcomes after MI.',
      recommendation: 'Use Paracetamol or opioid analgesics instead.' },
    { conditions: ['myocardial infarction', 'heart attack', 'acute mi', 'mi', 'acs', 'acute coronary', 'cardiac risk', 'cardiac'],
      drugs: ['sildenafil', 'tadalafil', 'vardenafil'],
      severity: 'critical' as const, title: 'CONTRAINDICATED: PDE-5 Inhibitor with Nitrates / Acute MI',
      why: 'Potentiates nitrate-mediated vasodilation, causing severe hypotension and dangerous BP drop.',
      recommendation: 'Absolutely contraindicated with concurrent nitrate therapy.' },
    { conditions: ['myocardial infarction', 'heart attack', 'acute mi', 'mi', 'acs', 'acute coronary', 'cardiac risk', 'cardiac'],
      drugs: ['ergotamine'],
      severity: 'high' as const, title: 'AVOID: Ergotamine in Cardiac Ischemia',
      why: 'Ergot alkaloids cause vasoconstriction and can worsen myocardial ischemia.',
      recommendation: 'Use non-vasoactive analgesics for migraine management.' },
    // 4. Stroke
    { conditions: ['stroke', 'cerebrovascular accident', 'cva', 'cerebral hemorrhage', 'intracranial hemorrhage'],
      drugs: ['alteplase', 'tenecteplase'],
      severity: 'critical' as const, title: 'CONTRAINDICATED: Thrombolytic in Hemorrhagic Stroke',
      why: 'Thrombolysis can cause or worsen life-threatening intracranial bleeding.',
      recommendation: 'Only use in ischemic stroke after imaging confirms no hemorrhage.' },
    { conditions: ['stroke', 'cerebrovascular accident', 'cva', 'cerebral hemorrhage', 'intracranial hemorrhage'],
      drugs: ['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran'],
      severity: 'critical' as const, title: 'CONTRAINDICATED: Anticoagulant in Active Intracranial Bleeding',
      why: 'Anticoagulants increase bleeding risk and can worsen active intracranial hemorrhage.',
      recommendation: 'Contraindicated in hemorrhagic stroke. Re-evaluate only after bleeding resolves.' },
    // 5. Heart Failure
    { conditions: ['heart failure', 'chf', 'congestive heart failure', 'hf', 'cardiac failure'],
      drugs: ['ibuprofen', 'naproxen', 'diclofenac', 'ketorolac'],
      severity: 'high' as const, title: 'AVOID: NSAID in Heart Failure',
      why: 'NSAIDs cause sodium/water retention, worsening renal function and heart failure.',
      recommendation: 'Avoid all NSAIDs. Use Paracetamol for pain.' },
    { conditions: ['heart failure', 'chf', 'congestive heart failure', 'hf', 'cardiac failure'],
      drugs: ['verapamil', 'diltiazem'],
      severity: 'high' as const, title: 'AVOID: Non-DHP CCB in Heart Failure (HFrEF)',
      why: 'Negative inotropic effects can reduce cardiac contractivity and depress cardiac function.',
      recommendation: 'Use Amlodipine (DHP CCB) if calcium channel blocker needed.' },
    { conditions: ['heart failure', 'chf', 'congestive heart failure', 'hf', 'cardiac failure'],
      drugs: ['pioglitazone', 'rosiglitazone'],
      severity: 'critical' as const, title: 'CONTRAINDICATED: Thiazolidinedione in Heart Failure',
      why: 'Thiazolidinediones cause fluid retention and edema, worsening heart failure.',
      recommendation: 'Avoid in NYHA Class III-IV HF. Use Metformin or SGLT2 inhibitors instead.' },
    // 6. Asthma
    { conditions: ['asthma', 'bronchial asthma', 'reactive airway', 'copd', 'bronchospasm'],
      drugs: ['propranolol', 'timolol', 'carvedilol', 'nadolol', 'sotalol'],
      severity: 'critical' as const, title: 'CONTRAINDICATED: Non-selective Beta-Blocker in Asthma',
      why: 'Beta-2 blockade can cause severe bronchospasm and worsen asthma.',
      recommendation: 'Avoid all non-selective beta-blockers. Use cardioselective agent (Bisoprolol) if essential.' },
    { conditions: ['asthma', 'bronchial asthma', 'reactive airway'],
      drugs: ['aspirin', 'ketorolac', 'diclofenac', 'ibuprofen', 'naproxen'],
      severity: 'high' as const, title: 'AVOID: NSAID in Aspirin-Sensitive Asthma',
      why: 'NSAIDs can trigger bronchospasm in susceptible patients via COX-1 inhibition.',
      recommendation: 'Avoid all NSAIDs. Use Paracetamol for analgesia.' },
    // 7. Peptic Ulcer / GI Bleeding
    { conditions: ['peptic ulcer', 'gastric ulcer', 'duodenal ulcer', 'gi bleed', 'gastrointestinal bleed', 'gastritis', 'gerd'],
      drugs: ['ibuprofen', 'diclofenac', 'ketorolac', 'naproxen'],
      severity: 'critical' as const, title: 'CONTRAINDICATED: NSAID in Peptic Ulcer / GI Bleeding',
      why: 'NSAIDs damage gastric mucosa, cause ulceration and increase GI bleeding risk.',
      recommendation: 'Absolutely avoid. Use Paracetamol. If essential, co-prescribe PPI (Pantoprazole).' },
    { conditions: ['peptic ulcer', 'gastric ulcer', 'duodenal ulcer', 'gi bleed', 'gastrointestinal bleed'],
      drugs: ['aspirin'],
      severity: 'critical' as const, title: 'CONTRAINDICATED: Aspirin in Active GI Bleeding',
      why: 'Aspirin inhibits platelet aggregation and can worsen active GI bleeding significantly.',
      recommendation: 'Discontinue during active bleeding. Resume only with PPI cover if cardiovascular benefit outweighs risk.' },
  ];

  // Initial Load: Patients and Medicine catalogue
  useEffect(() => {
    const initData = async () => {
      try {
        const [patList, medList] = await Promise.all([
          api.getPatients(),
          api.getMedicines(),
        ]);
        setPatients(patList);
        setAvailableMedicines(medList);

        const patientIdParam = searchParams.get('patient_id');
        if (patientIdParam) {
          const match = patList.find((p) => p.id === Number(patientIdParam));
          if (match) setSelectedPatient(match);
        } else {
          // Default to Rahul Mehta (987654321001) for best demo scenario
          const rahul = patList.find((p) => p.patient_id === '987654321001') || patList[0];
          if (rahul) setSelectedPatient(rahul);
        }
      } catch (err) {
        console.error('Error loading prescription wizard data:', err);
      }
    };

    initData();
  }, [searchParams]);

  // Real-time contraindication checker against patient's conditions & allergies
  const checkContraindications = (drugGenericName: string) => {
    if (!selectedPatient) { setLiveWarnings([]); return; }
    const drugLower = drugGenericName.toLowerCase();
    const warnings: ContraindicationWarning[] = [];

    // Gather patient conditions and allergies (both are relevant triggers)
    const patientConditions = (selectedPatient.conditions || []).map((c: any) => (c.condition_name || '').toLowerCase());
    const patientAllergies = (selectedPatient.allergies || []).map((a: any) => (a.substance || '').toLowerCase());
    const allTriggers = [...patientConditions, ...patientAllergies];

    for (const rule of CONTRAINDICATION_RULES) {
      // Does the drug match?
      const drugMatches = rule.drugs.some(d => drugLower.includes(d));
      if (!drugMatches) continue;

      // Does the patient have a matching condition/allergy?
      for (const trigger of allTriggers) {
        const conditionMatches = rule.conditions.some(c => trigger.includes(c) || c.includes(trigger));
        if (conditionMatches) {
          warnings.push({
            severity: rule.severity,
            title: rule.title,
            why: rule.why,
            recommendation: rule.recommendation,
            matchedCondition: trigger,
          });
          break; // one match per rule is enough
        }
      }
    }

    // Also check for cardiac risk markers in allergies (automated extraction from lab reports)
    const cardiacKeywords = ['cardiac', 'troponin', 'nt-probnp', 'ck-mb', 'hs-crp', 'heart', 'coronary', 'mi'];
    const hasCardiacRisk = allTriggers.some(t => cardiacKeywords.some(k => t.includes(k)));
    if (hasCardiacRisk) {
      const cardiacDangerDrugs = ['ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'sildenafil', 'tadalafil', 'vardenafil', 'ergotamine'];
      if (cardiacDangerDrugs.some(d => drugLower.includes(d))) {
        // Check we haven't already added a similar warning
        const alreadyWarned = warnings.some(w => w.title.includes('Cardiac') || w.title.includes('MI'));
        if (!alreadyWarned) {
          warnings.push({
            severity: drugLower.includes('sildenafil') || drugLower.includes('tadalafil') || drugLower.includes('vardenafil') ? 'critical' : 'high',
            title: `⚠️ Cardiac Risk Alert: ${drugGenericName} — Patient has Cardiac Risk Markers`,
            why: 'Patient has documented cardiac risk markers (hs-CRP, Troponin-I, NT-proBNP, CK-MB). This medication may worsen cardiovascular outcomes.',
            recommendation: 'Consult cardiology before prescribing. Consider safer alternative medications.',
            matchedCondition: 'Cardiac Risk Markers (Lab-detected)',
          });
        }
      }
    }

    setLiveWarnings(warnings);
  };

  // Handle Medicine catalog selection in form
  const handleSelectCatalogMed = (medId: string) => {
    const med = availableMedicines.find((m) => m.id === Number(medId));
    if (med) {
      setItemForm({
        medicine_id: med.id,
        generic_name: med.generic_name,
        brand_name: med.brand_name,
        dosage: med.strength,
        frequency: med.typical_dose || 'Once daily',
        duration_days: 14,
        route: med.route || 'Oral',
        instructions: 'Take as directed',
        allergy_class: med.allergy_class,
      });
      // Trigger real-time contraindication check
      checkContraindications(med.generic_name);
    } else {
      setLiveWarnings([]);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.generic_name.trim()) return;
    setSelectedItems([...selectedItems, itemForm]);
    setLiveWarnings([]);
    // Reset form for next item
    setItemForm({
      generic_name: '',
      brand_name: '',
      dosage: '500 mg',
      frequency: 'Twice daily (BID) with meals',
      duration_days: 14,
      route: 'Oral',
      instructions: 'Take after meals with water',
    });
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Run Safety Engine (Step 3)
  const triggerSafetyCheck = async () => {
    if (!selectedPatient) return;
    setSafetyLoading(true);
    try {
      const results = await api.runSafetyCheck(selectedPatient.id, selectedItems);
      setSafetyResults(results);
    } catch (err) {
      console.error('Safety check failed:', err);
    } finally {
      setSafetyLoading(false);
    }
  };

  // Run AI Insights (Step 4)
  const triggerAIInsights = async () => {
    if (!selectedPatient) return;
    setAiLoading(true);
    try {
      const insights = await api.getAIInsights(
        selectedPatient.id,
        selectedItems,
        safetyResults?.alerts || []
      );
      setAiInsights(insights);
    } catch (err) {
      console.error('AI Insights failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Advance steps with automatic checks
  const goToNextStep = async () => {
    if (currentStep === 1) {
      if (!selectedPatient) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedItems.length === 0) return;
      setCurrentStep(3);
      await triggerSafetyCheck();
    } else if (currentStep === 3) {
      setCurrentStep(4);
      await triggerAIInsights();
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setCurrentStep(6);
    } else if (currentStep === 6) {
      await handleFinalizePrescription();
    }
  };

  // Finalize Prescription (Step 7)
  const handleFinalizePrescription = async () => {
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      // 1. Create prescription draft in database
      const created = await api.createPrescription({
        patient_id: selectedPatient.id,
        diagnosis,
        general_instructions: generalInstructions,
        follow_up_date: followUpDate,
        items: selectedItems,
      });

      // 2. Finalize to generate QR code and lock status
      const finalized = await api.finalizePrescription(created.id);
      setFinalizedRx(finalized);
      setCurrentStep(7);
    } catch (err) {
      console.error('Failed to finalize prescription:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    { num: 1, title: 'Patient Safety Snapshot' },
    { num: 2, title: 'Add Medicines' },
    { num: 3, title: 'Clinical Safety Engine' },
    { num: 4, title: 'AI Clinical Insights' },
    { num: 5, title: 'Prescription Notes' },
    { num: 6, title: 'Review Order' },
    { num: 7, title: 'Finalized & Verified QR' },
  ];

  const filteredPatients = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Digital Prescription</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Multi-step workflow with real-time rule-based clinical safety verification and AI decision support.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/doctor/prescriptions')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Exit Wizard
        </Button>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
          {stepTitles.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    isCurrent ? 'text-brand-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
                {s.num < 7 && <span className="h-0.5 w-6 bg-slate-200 hidden sm:block mx-1"></span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= STEP 1: PATIENT SELECTION & SAFETY SNAPSHOT ================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Step 1 — Patient Selection & Clinical Safety Snapshot"
              subtitle="Search and select the patient to review their critical safety profile before prescribing"
            />

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Search Patient Record
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by patient name or ID (e.g., Rahul Mehta, 987654321001)..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {patientSearch && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-lg">
                  {filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientSearch('');
                      }}
                      className="p-2.5 hover:bg-brand-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-900">{p.full_name}</span>
                      <span className="font-mono text-slate-500">{p.patient_id} • {p.gender}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Patient Clinical Snapshot */}
            {selectedPatient && (
              <div className="border border-brand-200 rounded-xl bg-brand-50/20 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedPatient.full_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ID: <span className="font-mono font-bold text-brand-700">{selectedPatient.patient_id}</span> •{' '}
                      Age: 42 Yrs • Gender: {selectedPatient.gender} • Blood Group: <strong className="text-rose-600">{selectedPatient.blood_group}</strong>
                    </p>
                  </div>
                  <Badge variant="green" size="md">
                    Active Patient Selected
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Allergies */}
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
                    <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Documented Allergies ({selectedPatient.allergies?.length || 0})
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {selectedPatient.allergies?.length ? (
                        selectedPatient.allergies.map((a) => (
                          <div key={a.id} className="text-xs text-rose-950 font-semibold bg-white/80 p-2 rounded-lg border border-rose-200/60">
                            <div>{a.substance} ({a.severity})</div>
                            <div className="text-[11px] text-rose-700 font-normal mt-0.5">Reaction: {a.reaction}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">NKDA (No known drug allergies)</p>
                      )}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50">
                    <p className="text-xs font-bold text-sky-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Activity className="w-4 h-4 text-sky-600" />
                      Active Conditions ({selectedPatient.conditions?.length || 0})
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {selectedPatient.conditions?.length ? (
                        selectedPatient.conditions.map((c) => (
                          <div key={c.id} className="text-xs text-sky-950 font-semibold bg-white/80 p-2 rounded-lg border border-sky-200/60">
                            <div>{c.condition_name}</div>
                            <div className="text-[11px] text-sky-700 font-normal mt-0.5 font-mono">ICD-10: {c.icd10_code || 'R69'}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No active chronic conditions</p>
                      )}
                    </div>
                  </div>

                  {/* Vitals & Lab Baseline */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Baseline Vitals & Renal Labs
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Blood Pressure:</span>
                        <span className="font-bold">128/84 mmHg</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Fasting Glucose:</span>
                        <span className="font-bold">124 mg/dL</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Serum Creatinine:</span>
                        <span className="font-bold text-brand-700">1.2 mg/dL (Normal)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Latest HbA1c:</span>
                        <span className="font-bold text-purple-700">7.1%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
              <Button
                variant="primary"
                size="md"
                disabled={!selectedPatient}
                onClick={goToNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Select Medicines
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= STEP 2: MEDICINES SELECTION ================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Step 2 — Prescribe Medicines"
              subtitle={`Select medications from catalogue or input custom dosing for ${selectedPatient?.full_name}`}
            />

            {/* Quick Demo Selector for Important Demonstration Scenario */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Recommended Demo Scenario Selector
                </p>
                <p className="text-xs text-purple-700 mt-0.5">
                  Click below to quickly load <strong>Amoxicillin 500mg</strong> (triggers documented Penicillin allergy warning) or <strong>Ibuprofen</strong> (triggers DDI + Renal consideration).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ai"
                  size="sm"
                  onClick={() => {
                    const amox = availableMedicines.find((m) => m.generic_name.includes('Amoxicillin'));
                    if (amox) {
                      setItemForm({
                        medicine_id: amox.id,
                        generic_name: amox.generic_name,
                        brand_name: amox.brand_name,
                        dosage: '500 mg',
                        frequency: 'Three times daily (TID) after meals',
                        duration_days: 7,
                        route: 'Oral',
                        instructions: 'Complete full 7-day antibiotic course',
                        allergy_class: 'Penicillin',
                      });
                    }
                  }}
                >
                  Load Amoxicillin (Allergy Demo)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const ibup = availableMedicines.find((m) => m.generic_name.includes('Ibuprofen'));
                    if (ibup) {
                      setItemForm({
                        medicine_id: ibup.id,
                        generic_name: ibup.generic_name,
                        brand_name: ibup.brand_name,
                        dosage: '400 mg',
                        frequency: 'Twice daily after meals',
                        duration_days: 5,
                        route: 'Oral',
                        instructions: 'Take strictly with food',
                        allergy_class: 'NSAID',
                      });
                    }
                  }}
                >
                  Load Ibuprofen (DDI Demo)
                </Button>
              </div>
            </div>

            {/* Add Medicine Form */}
            <form onSubmit={handleAddItem} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Add Medication to Prescription
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Select from Medicine Database"
                  onChange={(e) => handleSelectCatalogMed(e.target.value)}
                  value={itemForm.medicine_id || ''}
                >
                  <option value="">-- Choose from 40+ Catalogue Drugs --</option>
                  {availableMedicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.generic_name} ({m.brand_name}) - {m.strength}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Generic Name *"
                  value={itemForm.generic_name}
                  onChange={(e) => setItemForm({ ...itemForm, generic_name: e.target.value })}
                  placeholder="e.g. Amoxicillin Trihydrate"
                  required
                />
              </div>

              {/* 🔴 REAL-TIME CONTRAINDICATION WARNINGS */}
              {liveWarnings.length > 0 && (
                <div className="space-y-2 animate-in fade-in">
                  {liveWarnings.map((w, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border-2 flex items-start gap-3 ${
                        w.severity === 'critical'
                          ? 'bg-rose-50 border-rose-400 shadow-rose-100 shadow-md'
                          : w.severity === 'high'
                          ? 'bg-amber-50 border-amber-400 shadow-amber-100 shadow-sm'
                          : 'bg-yellow-50 border-yellow-300'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <ShieldAlert className={`w-5 h-5 ${
                          w.severity === 'critical' ? 'text-rose-600' : w.severity === 'high' ? 'text-amber-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            w.severity === 'critical'
                              ? 'bg-rose-600 text-white'
                              : w.severity === 'high'
                              ? 'bg-amber-600 text-white'
                              : 'bg-yellow-500 text-white'
                          }`}>
                            {w.severity === 'critical' ? '🚫 CONTRAINDICATED' : w.severity === 'high' ? '⚠️ AVOID' : '⚡ CAUTION'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Matched: <strong>{w.matchedCondition}</strong>
                          </span>
                        </div>
                        <p className={`text-sm font-bold mt-1 ${
                          w.severity === 'critical' ? 'text-rose-900' : w.severity === 'high' ? 'text-amber-900' : 'text-yellow-900'
                        }`}>
                          {w.title}
                        </p>
                        <p className="text-xs text-slate-700 mt-1">
                          <strong>Why:</strong> {w.why}
                        </p>
                        <p className="text-xs text-emerald-800 mt-1 bg-emerald-50 rounded-lg px-2 py-1 inline-block">
                          <strong>✅ Recommendation:</strong> {w.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input
                  label="Dosage Strength *"
                  value={itemForm.dosage}
                  onChange={(e) => setItemForm({ ...itemForm, dosage: e.target.value })}
                  placeholder="500 mg"
                  required
                />
                <Input
                  label="Frequency *"
                  value={itemForm.frequency}
                  onChange={(e) => setItemForm({ ...itemForm, frequency: e.target.value })}
                  placeholder="Twice daily (BID)"
                  required
                />
                <Input
                  label="Duration (Days) *"
                  type="number"
                  value={itemForm.duration_days}
                  onChange={(e) => setItemForm({ ...itemForm, duration_days: Number(e.target.value) })}
                  required
                />
                <Select
                  label="Route"
                  value={itemForm.route}
                  onChange={(e) => setItemForm({ ...itemForm, route: e.target.value })}
                >
                  <option value="Oral">Oral</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Sublingual">Sublingual</option>
                  <option value="Subcutaneous">Subcutaneous</option>
                  <option value="Intravenous">Intravenous</option>
                  <option value="Topical">Topical</option>
                  <option value="Ophthalmic">Ophthalmic</option>
                </Select>
              </div>

              <Input
                label="Specific Patient Instructions"
                value={itemForm.instructions}
                onChange={(e) => setItemForm({ ...itemForm, instructions: e.target.value })}
                placeholder="Take immediately following meals with water"
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add to Prescription List
                </Button>
              </div>
            </form>

            {/* List of Prescribed Medicines */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Prescription Items ({selectedItems.length})
              </h4>

              {selectedItems.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  No medicines added yet. Use the form above or click a demo scenario button.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Medicine</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Instructions</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {item.generic_name}
                            {item.brand_name && (
                              <span className="block text-[11px] text-slate-400 font-normal">
                                {item.brand_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-brand-700">{item.dosage}</td>
                          <td className="py-3 px-3 text-slate-700">{item.frequency}</td>
                          <td className="py-3 px-3 text-slate-700">{item.duration_days} days</td>
                          <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">{item.instructions}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Patient
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={selectedItems.length === 0}
                onClick={goToNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Run Safety Engine ({selectedItems.length} Meds)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= STEP 3: AUTOMATIC CLINICAL SAFETY CHECK ================= */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  Step 3 — Deterministic Clinical Safety Engine Analysis
                </span>
              }
              subtitle="Rule-based validation cross-referencing allergies, drug-drug interactions, comorbidities, and laboratory parameters"
            />

            {safetyLoading ? (
              <div className="py-16 text-center text-sm text-slate-500">
                <RefreshCw className="w-6 h-6 text-brand-600 animate-spin mx-auto mb-3" />
                <p className="font-semibold text-slate-800">Executing deterministic safety rules...</p>
                <p className="text-xs text-slate-400 mt-1">Cross-referencing allergy matrix, active chronic therapy, and renal profile.</p>
              </div>
            ) : safetyResults ? (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    safetyResults.summary.total === 0
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : safetyResults.summary.critical > 0 || safetyResults.summary.high > 0
                      ? 'border-rose-200 bg-rose-50 text-rose-950'
                      : 'border-amber-200 bg-amber-50 text-amber-950'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm">
                      {safetyResults.summary.total === 0
                        ? '✓ All Safety Checks Passed'
                        : `Clinical Safety Advisories Flagged (${safetyResults.summary.total} Alert${
                            safetyResults.summary.total > 1 ? 's' : ''
                          })`}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {safetyResults.summary.total === 0
                        ? 'No documented allergy conflicts, severe drug interactions, or renal contraindications detected.'
                        : 'Review the flagged items below before finalizing. The software provides decision support; you make the clinical decision.'}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs font-bold shrink-0">
                    {safetyResults.summary.critical > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-200 text-rose-900">
                        {safetyResults.summary.critical} Critical
                      </span>
                    )}
                    {safetyResults.summary.high > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                        {safetyResults.summary.high} High
                      </span>
                    )}
                    {safetyResults.summary.moderate > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                        {safetyResults.summary.moderate} Moderate
                      </span>
                    )}
                  </div>
                </div>

                {/* Individual Explanatory Alert Cards */}
                <div className="space-y-3">
                  {safetyResults.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        alert.severity === 'critical' || alert.severity === 'high'
                          ? 'border-rose-200 bg-rose-50/40 text-rose-950'
                          : 'border-amber-200 bg-amber-50/40 text-amber-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            className={`w-5 h-5 shrink-0 ${
                              alert.severity === 'critical' || alert.severity === 'high'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}
                          />
                          <h4 className="font-bold text-sm tracking-tight">{alert.title}</h4>
                        </div>
                        <Badge
                          variant={alert.severity === 'critical' || alert.severity === 'high' ? 'red' : 'amber'}
                          size="sm"
                          pulse={alert.severity === 'critical' || alert.severity === 'high'}
                        >
                          {alert.severity.toUpperCase()} RISK
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-slate-200/50">
                        <div>
                          <strong className="text-slate-900 block mb-0.5">Why it matters:</strong>
                          <p className="text-slate-600 leading-relaxed">{alert.why}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 block mb-0.5">Recommended Clinical Action:</strong>
                          <p className="text-slate-700 font-medium leading-relaxed">{alert.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Edit Medicines
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={goToNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to AI Clinical Insights
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= STEP 4: AI CLINICAL DECISION SUPPORT ================= */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader
              title={
                <span className="flex items-center gap-2 text-purple-950">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Step 4 — AI Clinical Decision Support Insights
                </span>
              }
              subtitle="Explainable synthesis of patient context, lab correlations, and flagged safety advisories"
            />

            {aiLoading ? (
              <div className="py-16 text-center text-sm text-purple-900">
                <Sparkles className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-3" />
                <p className="font-semibold">Synthesizing clinical decision support...</p>
                <p className="text-xs text-purple-600 mt-1">Connecting Ollama local LLM with automatic DemoAIService fallback.</p>
              </div>
            ) : aiInsights ? (
              <div className="space-y-5">
                {/* Provider Badge & Disclaimer Header */}
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse"></span>
                    <span className="text-xs font-bold text-purple-900">
                      Active AI Engine: {aiInsights.provider}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full">
                    Explainable AI
                  </span>
                </div>

                {/* Patient Summary */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Clinical Context Summary
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {aiInsights.patient_context_summary}
                  </p>
                </div>

                {/* Key Observations */}
                {aiInsights.key_observations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                      Key Clinical Observations
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                      {aiInsights.key_observations.map((obs, i) => (
                        <li key={i}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Safety Interpretation */}
                {aiInsights.safety_interpretation.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Safety Warning Rationale
                    </h4>
                    <div className="space-y-2">
                      {aiInsights.safety_interpretation.map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                          <p className="font-bold text-slate-900">{item.alert_title}</p>
                          <p className="text-slate-600 mt-1">{item.clinical_rationale}</p>
                          <p className="text-amber-800 font-semibold mt-1">Suggested Review: {item.suggested_action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lab Correlations & Doctor Review Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Laboratory Value Correlation
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {aiInsights.lab_correlation.map((lc, i) => (
                        <li key={i}>{lc}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Points for Doctor's Verification
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {aiInsights.suggested_review_points.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Strict Medical Disclaimer */}
                <Alert type="ai" title="Clinical Decision Support Notice">
                  {aiInsights.disclaimer}
                </Alert>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Safety Alerts
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={goToNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Prescription Notes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= STEP 5: PRESCRIPTION NOTES ================= */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Step 5 — Clinical Diagnosis & General Instructions"
              subtitle="Document clinical diagnosis, lifestyle guidance, and schedule follow-up consultation"
            />

            <div className="space-y-4">
              <Input
                label="Primary Clinical Diagnosis *"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Type 2 Diabetes Mellitus & Stage 1 Essential Hypertension"
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  General Dietary & Lifestyle Instructions
                </label>
                <textarea
                  rows={3}
                  value={generalInstructions}
                  onChange={(e) => setGeneralInstructions(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Dietary precautions, hydration advice, exercise recommendations..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Recommended Follow-up Consultation Date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-center">
                  <span className="font-bold text-slate-800">Consulting Physician</span>
                  <span className="text-slate-600 mt-0.5">Dr. Rahul Mehta • Cardiology & Internal Medicine</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">MCI-DL-99823-KAR</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(4)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to AI Insights
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={goToNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Review Full Order
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= STEP 6: COMPLETE REVIEW BEFORE FINALIZATION ================= */}
      {currentStep === 6 && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Step 6 — Final Clinical Review"
              subtitle="Verify all patient details, prescribed medications, and instructions prior to signing"
            />

            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-6">
              {/* Patient & Doctor Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Patient</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedPatient?.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedPatient?.patient_id} • Age: 42 • {selectedPatient?.gender}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Prescriber</span>
                  <h3 className="text-base font-bold text-slate-900">Dr. Rahul Mehta</h3>
                  <p className="text-xs text-slate-500">Cardiology & Internal Medicine • MCI-DL-99823</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Diagnosis</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{diagnosis}</p>
              </div>

              {/* Prescribed Items Table */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                  Medications Prescribed ({selectedItems.length})
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Medicine</th>
                        <th className="py-2.5 px-3">Dose</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.generic_name} {item.brand_name && `(${item.brand_name})`}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-brand-700">{item.dosage}</td>
                          <td className="py-2.5 px-3 text-slate-700">{item.frequency}</td>
                          <td className="py-2.5 px-3 text-slate-700">{item.duration_days} days</td>
                          <td className="py-2.5 px-3 text-slate-500">{item.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Advice & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">General Advice</span>
                  <p className="text-xs text-slate-700 mt-0.5">{generalInstructions}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Follow-up Consultation</span>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5">{followUpDate}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(5)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Edit Notes
              </Button>
              <Button
                variant="primary"
                size="lg"
                isLoading={submitting}
                onClick={handleFinalizePrescription}
                leftIcon={<CheckCircle2 className="w-5 h-5" />}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                Sign & Finalize Prescription
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= STEP 7: FINALIZED WITH QR & PRINTABLE VIEW ================= */}
      {currentStep === 7 && finalizedRx && (
        <div className="space-y-6">
          <Card className="border-emerald-200 bg-gradient-to-b from-white to-emerald-50/20">
            <div className="text-center pb-6 border-b border-slate-100">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Prescription Successfully Finalized</h2>
              <p className="text-xs text-slate-500 mt-1">
                Authentic digital prescription issued with cryptographic QR code for pharmacy verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              {/* QR Code Presentation */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-subtle text-center">
                {finalizedRx.qr_code_data ? (
                  <img
                    src={finalizedRx.qr_code_data}
                    alt="Prescription QR Code"
                    className="w-44 h-44 object-contain rounded-lg border border-slate-100 shadow-sm"
                  />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                <span className="font-mono text-xs font-bold text-brand-700 mt-3 block">
                  {finalizedRx.prescription_id}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Scan to verify at any partner pharmacy</span>
              </div>

              {/* Prescription Metadata */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Prescription ID</span>
                    <span className="font-mono font-bold text-sm text-brand-700">{finalizedRx.prescription_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Status</span>
                    <Badge variant="blue" size="md">{finalizedRx.status}</Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Patient</span>
                    <span className="font-bold text-slate-900">{finalizedRx.patient_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Prescribing Doctor</span>
                    <span className="font-bold text-slate-900">{finalizedRx.doctor_name}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Items Prescribed</span>
                  <div className="space-y-1.5">
                    {finalizedRx.items.map((it) => (
                      <div key={it.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-slate-900">{it.generic_name} ({it.dosage})</span>
                        <span className="text-slate-500 font-medium">{it.frequency} • {it.duration_days} days</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions: Download PDF, Verify at Pharmacy */}
                <div className="flex flex-wrap gap-2.5 pt-3">
                  <a
                    href={api.getPrescriptionPdfUrl(finalizedRx.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download Official PDF
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    leftIcon={<Printer className="w-4 h-4" />}
                  >
                    Print Record
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/pharmacy/verify?id=${finalizedRx.prescription_id}`)}
                    leftIcon={<QrCode className="w-4 h-4" />}
                  >
                    Test Pharmacy Verification
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedItems([]);
                  setFinalizedRx(null);
                }}
              >
                Write Another Prescription
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/doctor/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
