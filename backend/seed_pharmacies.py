import os, django, random
os.environ['DJANGO_SETTINGS_MODULE'] = 'rxcare.settings'
django.setup()

from pharmacy.models import Pharmacy, PharmacyInventory, Medicine

# Clear old demo pharmacies (keep PharmacyProfile-based ones untouched)
Pharmacy.objects.all().delete()

# 6 demo pharmacy stores around Bangalore (MG Road area)
stores = [
    {
        'name': 'MedPlus Pharmacy - MG Road',
        'address': 'Shop 4, Ground Floor, Raheja Arcade, MG Road, Bengaluru 560001',
        'phone': '+91 80 4567 1234',
        'distance_km': 0.3,
        'rating': 4.8,
        'latitude': 12.9758,
        'longitude': 77.6045,
        'opening_hours': '8:00 AM - 11:00 PM',
    },
    {
        'name': 'Apollo Pharmacy - Brigade Road',
        'address': '12, Brigade Road, Near Garuda Mall, Bengaluru 560025',
        'phone': '+91 80 4567 5678',
        'distance_km': 0.7,
        'rating': 4.6,
        'latitude': 12.9726,
        'longitude': 77.6077,
        'opening_hours': '24 Hours',
    },
    {
        'name': 'Wellness Forever - Indiranagar',
        'address': '100 Feet Road, Indiranagar, Bengaluru 560038',
        'phone': '+91 80 4123 9876',
        'distance_km': 1.2,
        'rating': 4.5,
        'latitude': 12.9784,
        'longitude': 77.6408,
        'opening_hours': '9:00 AM - 10:00 PM',
    },
    {
        'name': 'Netmeds Store - Koramangala',
        'address': '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034',
        'phone': '+91 80 4987 6543',
        'distance_km': 2.5,
        'rating': 4.3,
        'latitude': 12.9352,
        'longitude': 77.6245,
        'opening_hours': '8:30 AM - 9:30 PM',
    },
    {
        'name': 'PharmEasy Hub - Whitefield',
        'address': 'ITPL Main Road, Whitefield, Bengaluru 560066',
        'phone': '+91 80 4321 8765',
        'distance_km': 4.8,
        'rating': 4.4,
        'latitude': 12.9698,
        'longitude': 77.7500,
        'opening_hours': '9:00 AM - 9:00 PM',
    },
    {
        'name': 'Reliance Health Pharmacy - Jayanagar',
        'address': '11th Main, 4th Block, Jayanagar, Bengaluru 560011',
        'phone': '+91 80 4555 7890',
        'distance_km': 3.1,
        'rating': 4.7,
        'latitude': 12.9250,
        'longitude': 77.5838,
        'opening_hours': '7:30 AM - 10:30 PM',
    },
]

created_pharmacies = []
for s in stores:
    p = Pharmacy.objects.create(**s)
    created_pharmacies.append(p)
    print(f'Created: {p.name} ({p.latitude}, {p.longitude})')

# Now seed inventory - each pharmacy has varied stock
all_medicines = list(Medicine.objects.all())
print(f'\nSeeding inventory for {len(all_medicines)} medicines across {len(created_pharmacies)} pharmacies...')

# Price ranges by category
price_map = {
    'Analgesic': (15, 45), 'Antibiotic': (35, 120), 'Antihypertensive': (20, 80),
    'Antidiabetic': (25, 90), 'Cardiovascular': (30, 100), 'Anticoagulant': (80, 250),
    'Respiratory': (40, 120), 'Gastrointestinal': (20, 60), 'Endocrine': (30, 75),
    'Corticosteroid': (15, 50), 'Antipsychotic': (40, 150), 'Vitamin': (20, 60),
    'PDE-5': (100, 350), 'Antimigraine': (50, 180), 'Decongestant': (15, 40),
    'Thrombolytic': (500, 2000), 'Antiplatelet': (20, 60), 'Antihistamine': (10, 35),
}

# Each pharmacy has 70-90% of medicines in stock, some limited, some out
PharmacyInventory.objects.all().delete()
count = 0

for pharmacy in created_pharmacies:
    for med in all_medicines:
        # Determine if this pharmacy stocks this medicine
        stock_chance = random.random()
        
        # 75% chance in stock, 10% limited, 15% out of stock
        if stock_chance < 0.15:
            status = 'OUT_OF_STOCK'
            qty = 0
        elif stock_chance < 0.25:
            status = 'LIMITED_STOCK'
            qty = random.randint(2, 15)
        else:
            status = 'IN_STOCK'
            qty = random.randint(30, 200)

        # Price based on category
        price_range = (15, 80)
        cat = (med.category or '').lower()
        for key, rng in price_map.items():
            if key.lower() in cat:
                price_range = rng
                break
        
        unit_price = round(random.uniform(*price_range), 2)
        
        PharmacyInventory.objects.create(
            pharmacy=pharmacy,
            medicine=med,
            stock_quantity=qty,
            status=status,
            unit_price=unit_price
        )
        count += 1

print(f'Created {count} inventory records.')
print(f'Total pharmacies: {Pharmacy.objects.count()}')
print(f'Total inventory: {PharmacyInventory.objects.count()}')
