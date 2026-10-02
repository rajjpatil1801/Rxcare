import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Pharmacy, Prescription } from '../types';
import { api } from '../services/api';
import { MapPin, Navigation, Phone, Clock, Store, AlertCircle, CheckCircle2 } from 'lucide-react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons based on stock status
const createIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const greenIcon = createIcon('green');
const orangeIcon = createIcon('orange');
const redIcon = createIcon('red');
const blueIcon = createIcon('blue');

interface PharmacyLocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
}

// Map updater component to auto-fit bounds
const MapUpdater = ({ pharmacies }: { pharmacies: Pharmacy[] }) => {
  const map = useMap();
  useEffect(() => {
    if (pharmacies.length > 0) {
      const bounds = L.latLngBounds(
        pharmacies.map(p => [p.latitude || 12.9716, p.longitude || 77.5946])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pharmacies, map]);
  return null;
};

export const PharmacyLocatorModal: React.FC<PharmacyLocatorModalProps> = ({ isOpen, onClose, prescription }) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && prescription) {
      const fetchPharmacies = async () => {
        setLoading(true);
        try {
          const results = await api.getNearbyPharmacies(undefined, undefined, prescription.id);
          setPharmacies(results);
        } catch (error) {
          console.error('Error fetching pharmacies:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPharmacies();
    } else {
      setPharmacies([]);
    }
  }, [isOpen, prescription]);

  const getStatusColor = (status?: string) => {
    if (status === 'ALL_IN_STOCK' || status === 'IN_STOCK') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (status === 'PARTIAL' || status === 'LIMITED_STOCK') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };
  
  const getStatusIcon = (status?: string) => {
    if (status === 'ALL_IN_STOCK' || status === 'IN_STOCK') return greenIcon;
    if (status === 'PARTIAL' || status === 'LIMITED_STOCK') return orangeIcon;
    return redIcon;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Locate Nearby Pharmacies">
      <div className="flex flex-col h-[70vh] -mx-4 -mb-4 sm:-mx-6 sm:-mb-6">
        {/* Info header */}
        <div className="px-4 sm:px-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <p className="text-sm text-slate-500 mb-2">
            Searching stock for prescription <strong>{prescription?.prescription_id}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {prescription?.items?.map((item, idx) => (
              <Badge key={idx} variant="blue" size="sm">
                {item.generic_name}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-2">
            <Store className="w-12 h-12 text-slate-300" />
            <p>No pharmacies found nearby.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {/* List Sidebar */}
            <div className="w-full md:w-1/3 border-r border-slate-100 overflow-y-auto bg-slate-50/50">
              {pharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="p-4 border-b border-slate-100 hover:bg-white transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">{pharmacy.name}</h4>
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                      {pharmacy.distance_km} km
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-500 space-y-1 mb-2">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{pharmacy.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{pharmacy.opening_hours}</span>
                    </div>
                  </div>

                  <div className={`mt-2 p-2 rounded border text-xs ${getStatusColor(pharmacy.stock_status)}`}>
                    <div className="font-semibold flex items-center gap-1.5 mb-1.5">
                      {pharmacy.stock_status === 'ALL_IN_STOCK' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {pharmacy.stock_status === 'ALL_IN_STOCK' 
                        ? 'All Medicines Available' 
                        : pharmacy.stock_status === 'PARTIAL' 
                        ? `${pharmacy.available_count} of ${pharmacy.total_medicines} Available`
                        : 'Out of Stock'}
                    </div>
                    
                    {pharmacy.medicine_availability && (
                      <div className="space-y-1 mt-2 pt-2 border-t border-current/20">
                        {pharmacy.medicine_availability.map((med) => (
                          <div key={med.medicine_id} className="flex justify-between items-center text-[11px]">
                            <span className="truncate pr-2" title={med.name}>{med.name}</span>
                            <span className="font-semibold shrink-0">
                              {med.available ? `₹${med.unit_price}` : '—'}
                            </span>
                          </div>
                        ))}
                        {pharmacy.available_count && pharmacy.available_count > 0 && (
                          <div className="flex justify-between items-center text-[11px] font-bold mt-1.5 pt-1.5 border-t border-current/20">
                            <span>Estimated Total:</span>
                            <span>₹{pharmacy.total_estimated_price}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Map Area */}
            <div className="w-full md:w-2/3 h-64 md:h-auto relative z-0">
              <MapContainer 
                center={[12.9716, 77.5946]} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater pharmacies={pharmacies} />
                
                {/* Patient Location Marker (Approximate Center) */}
                <Marker position={[12.9716, 77.5946]} icon={blueIcon}>
                  <Popup>
                    <strong>Your Location</strong>
                  </Popup>
                </Marker>

                {/* Pharmacy Markers */}
                {pharmacies.map((pharmacy) => (
                  pharmacy.latitude && pharmacy.longitude && (
                    <Marker 
                      key={pharmacy.id} 
                      position={[pharmacy.latitude, pharmacy.longitude]}
                      icon={getStatusIcon(pharmacy.stock_status)}
                    >
                      <Popup className="pharmacy-popup">
                        <div className="text-sm">
                          <strong className="block text-slate-900 mb-1">{pharmacy.name}</strong>
                          <p className="text-xs text-slate-600 mb-1">{pharmacy.distance_km} km away</p>
                          <p className={`text-xs font-bold ${pharmacy.stock_status === 'ALL_IN_STOCK' ? 'text-emerald-600' : pharmacy.stock_status === 'PARTIAL' ? 'text-amber-600' : 'text-rose-600'}`}>
                            {pharmacy.stock_status === 'ALL_IN_STOCK' 
                              ? 'All Available' 
                              : pharmacy.stock_status === 'PARTIAL' 
                              ? `${pharmacy.available_count}/${pharmacy.total_medicines} Available`
                              : 'Out of Stock'}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
