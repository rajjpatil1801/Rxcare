import os, django
os.environ['DJANGO_SETTINGS_MODULE']='rxcare.settings'
django.setup()
from pharmacy.models import Medicine

new_meds = [
    {'generic_name': 'Pseudoephedrine', 'brand_name': 'Sudafed', 'category': 'Decongestant / Sympathomimetic', 'strength': '60 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Sympathomimetic', 'contraindications': 'Hypertension, MAOIs', 'typical_dose': 'Every 4-6 hours'},
    {'generic_name': 'Phenylephrine', 'brand_name': 'Sinarest', 'category': 'Decongestant / Alpha-1 Agonist', 'strength': '10 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Sympathomimetic', 'contraindications': 'Hypertension, Severe CVD', 'typical_dose': 'Every 4 hours'},
    {'generic_name': 'Ergotamine Tartrate', 'brand_name': 'Ergomar', 'category': 'Antimigraine / Ergot Alkaloid', 'strength': '1 mg', 'dosage_form': 'Sublingual Tablet', 'route': 'Sublingual', 'allergy_class': 'Ergot Alkaloid', 'contraindications': 'Hypertension, CAD, PVD', 'typical_dose': 'PRN for migraine'},
    {'generic_name': 'Prednisolone', 'brand_name': 'Omnacortil', 'category': 'Corticosteroid / Anti-inflammatory', 'strength': '10 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Corticosteroid', 'contraindications': 'Uncontrolled diabetes, Active infections', 'typical_dose': 'Once daily (morning)'},
    {'generic_name': 'Olanzapine', 'brand_name': 'Oleanz', 'category': 'Antipsychotic / Atypical', 'strength': '5 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Atypical Antipsychotic', 'contraindications': 'Diabetes mellitus, Metabolic syndrome', 'typical_dose': 'Once daily at bedtime'},
    {'generic_name': 'Niacin', 'brand_name': 'Nialip', 'category': 'Vitamin / Lipid-modifying Agent', 'strength': '500 mg', 'dosage_form': 'Extended Release Tablet', 'route': 'Oral', 'allergy_class': 'Vitamin B3', 'contraindications': 'Active liver disease, Diabetes caution', 'typical_dose': 'Once daily with food'},
    {'generic_name': 'Sildenafil Citrate', 'brand_name': 'Viagra', 'category': 'PDE-5 Inhibitor / Vasodilator', 'strength': '50 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'PDE-5 Inhibitor', 'contraindications': 'Nitrates, Acute MI', 'typical_dose': 'PRN (max once daily)'},
    {'generic_name': 'Tadalafil', 'brand_name': 'Megalis', 'category': 'PDE-5 Inhibitor / Vasodilator', 'strength': '10 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'PDE-5 Inhibitor', 'contraindications': 'Nitrates, Acute MI', 'typical_dose': 'PRN (max once daily)'},
    {'generic_name': 'Vardenafil', 'brand_name': 'Levitra', 'category': 'PDE-5 Inhibitor / Vasodilator', 'strength': '10 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'PDE-5 Inhibitor', 'contraindications': 'Nitrates, Acute MI', 'typical_dose': 'PRN (max once daily)'},
    {'generic_name': 'Alteplase', 'brand_name': 'Actilyse', 'category': 'Thrombolytic / tPA', 'strength': '50 mg', 'dosage_form': 'IV Injection', 'route': 'Intravenous', 'allergy_class': 'Thrombolytic', 'contraindications': 'Active bleeding, Recent hemorrhagic stroke', 'typical_dose': 'Per protocol'},
    {'generic_name': 'Warfarin Sodium', 'brand_name': 'Warf', 'category': 'Anticoagulant / Vitamin K Antagonist', 'strength': '5 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Coumarin', 'contraindications': 'Active bleeding, Hemorrhagic stroke', 'typical_dose': 'Once daily (INR-guided)'},
    {'generic_name': 'Apixaban', 'brand_name': 'Eliquis', 'category': 'Anticoagulant / Direct Factor Xa Inhibitor', 'strength': '5 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'DOAC', 'contraindications': 'Active pathological bleeding', 'typical_dose': 'Twice daily'},
    {'generic_name': 'Rivaroxaban', 'brand_name': 'Xarelto', 'category': 'Anticoagulant / Direct Factor Xa Inhibitor', 'strength': '20 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'DOAC', 'contraindications': 'Active pathological bleeding', 'typical_dose': 'Once daily with food'},
    {'generic_name': 'Dabigatran Etexilate', 'brand_name': 'Pradaxa', 'category': 'Anticoagulant / Direct Thrombin Inhibitor', 'strength': '150 mg', 'dosage_form': 'Capsule', 'route': 'Oral', 'allergy_class': 'DOAC', 'contraindications': 'Active pathological bleeding', 'typical_dose': 'Twice daily'},
    {'generic_name': 'Verapamil Hydrochloride', 'brand_name': 'Calaptin', 'category': 'Cardiovascular / Non-DHP Calcium Channel Blocker', 'strength': '80 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Calcium Channel Blocker', 'contraindications': 'Heart failure (HFrEF), Severe bradycardia', 'typical_dose': 'Three times daily'},
    {'generic_name': 'Diltiazem Hydrochloride', 'brand_name': 'Dilzem', 'category': 'Cardiovascular / Non-DHP Calcium Channel Blocker', 'strength': '60 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Calcium Channel Blocker', 'contraindications': 'Heart failure (HFrEF), Severe bradycardia', 'typical_dose': 'Three times daily'},
    {'generic_name': 'Pioglitazone', 'brand_name': 'Pioz', 'category': 'Antidiabetic / Thiazolidinedione', 'strength': '15 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Thiazolidinedione', 'contraindications': 'Heart failure, Bladder cancer', 'typical_dose': 'Once daily'},
    {'generic_name': 'Rosiglitazone', 'brand_name': 'Windia', 'category': 'Antidiabetic / Thiazolidinedione', 'strength': '4 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'Thiazolidinedione', 'contraindications': 'Heart failure, Ischemic heart disease', 'typical_dose': 'Once daily'},
    {'generic_name': 'Timolol Maleate', 'brand_name': 'Glucomol', 'category': 'Cardiovascular / Non-selective Beta Blocker', 'strength': '0.5%', 'dosage_form': 'Eye Drops', 'route': 'Ophthalmic', 'allergy_class': 'Beta Blocker', 'contraindications': 'Asthma, COPD, Bradycardia', 'typical_dose': 'Twice daily (one drop)'},
    {'generic_name': 'Aspirin', 'brand_name': 'Disprin', 'category': 'Antiplatelet / NSAID', 'strength': '75 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'NSAID', 'contraindications': 'Active GI bleed, Aspirin-sensitive asthma', 'typical_dose': 'Once daily'},
    {'generic_name': 'Ketorolac Tromethamine', 'brand_name': 'Ketanov', 'category': 'Analgesic / NSAID', 'strength': '10 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'NSAID', 'contraindications': 'Peptic ulcer, GI bleeding, Asthma', 'typical_dose': 'Every 4-6 hours (max 5 days)'},
    {'generic_name': 'Diclofenac Sodium', 'brand_name': 'Voveran', 'category': 'Analgesic / NSAID', 'strength': '50 mg', 'dosage_form': 'Tablet', 'route': 'Oral', 'allergy_class': 'NSAID', 'contraindications': 'Peptic ulcer, GI bleeding, CVD risk', 'typical_dose': 'Two to three times daily'},
]

for med_data in new_meds:
    obj, created = Medicine.objects.get_or_create(
        generic_name=med_data['generic_name'],
        defaults=med_data
    )
    status = 'CREATED' if created else 'ALREADY EXISTS'
    print(f'{status}: {obj.generic_name} ({obj.brand_name}) - {obj.strength}')

print(f'\nTotal medicines now: {Medicine.objects.count()}')
