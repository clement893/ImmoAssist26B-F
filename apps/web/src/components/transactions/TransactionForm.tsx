'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Plus, X } from 'lucide-react';
import AddressAutocompleteInput from '@/components/transactions/AddressAutocompleteInput';

interface Person {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  civil_status?: string;
}

interface Professional {
  name?: string;
  agency_or_firm?: string;
  license_number?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
}

interface TransactionFormData {
  name: string;
  dossier_number?: string;
  status: string;
  transaction_kind?: string;
  expected_closing_date?: string;
  actual_closing_date?: string;
  property_address: string;
  property_city: string;
  property_postal_code: string;
  property_province: string;
  lot_number?: string;
  matricule_number?: string;
  property_type?: string;
  construction_year?: number;
  land_area_sqft?: number;
  land_area_sqm?: number;
  living_area_sqft?: number;
  living_area_sqm?: number;
  total_rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  inclusions?: string[];
  exclusions?: string[];
  sellers: Person[];
  buyers: Person[];
  seller_broker?: Professional;
  buyer_broker?: Professional;
  notary?: Professional;
  inspector?: Professional;
  surveyor?: Professional;
  mortgage_advisor?: Professional;
  listing_price?: number;
  offered_price?: number;
  final_sale_price?: number;
  deposit_amount?: number;
  broker_commission_percent?: number;
  broker_commission_amount?: number;
  down_payment_amount?: number;
  mortgage_amount?: number;
  mortgage_institution?: string;
  mortgage_type?: string;
  mortgage_interest_rate?: number;
  mortgage_term_years?: number;
  amortization_years?: number;
  mortgage_insurance_required: boolean;
  mortgage_insurance_amount?: number;
  promise_to_purchase_date?: string;
  promise_acceptance_date?: string;
  inspection_deadline?: string;
  inspection_date?: string;
  inspection_condition_lifted_date?: string;
  financing_deadline?: string;
  financing_condition_lifted_date?: string;
  mortgage_act_signing_date?: string;
  sale_act_signing_date?: string;
  possession_date?: string;
  location_certificate_received: boolean;
  location_certificate_date?: string;
  location_certificate_conform?: boolean;
  seller_declaration_signed: boolean;
  seller_declaration_date?: string;
  inspection_report_received: boolean;
  inspection_report_satisfactory?: boolean;
  financing_approval_received: boolean;
  financing_approval_date?: string;
  home_insurance_proof_received: boolean;
  seller_quittance_received: boolean;
  seller_quittance_amount?: number;
  buyer_mutation_tax?: number;
  buyer_notary_fees_sale?: number;
  buyer_notary_fees_mortgage?: number;
  buyer_inspection_fees?: number;
  buyer_appraisal_fees?: number;
  buyer_insurance_tax?: number;
  seller_broker_commission_total?: number;
  seller_quittance_fees?: number;
  seller_mortgage_penalty?: number;
  seller_location_certificate_fees?: number;
  adjustment_municipal_taxes?: number;
  adjustment_school_taxes?: number;
  adjustment_condo_fees?: number;
  adjustment_rental_income?: number;
  registry_publication_number?: string;
  seller_quittance_confirmed: boolean;
  notes?: string;
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TransactionFormData>;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { label: 'En cours', value: 'En cours' },
  { label: 'Conditionnelle', value: 'Conditionnelle' },
  { label: 'Ferme', value: 'Ferme' },
  { label: 'Annulée', value: 'Annulée' },
  { label: 'Conclue', value: 'Conclue' },
];

const TRANSACTION_KIND_OPTIONS = [
  { label: 'Vente (mandat vente)', value: 'vente' },
  { label: 'Achat (mandat achat)', value: 'achat' },
  { label: 'Non spécifié', value: '' },
];

const PROPERTY_TYPE_OPTIONS = [
  { label: 'Unifamiliale', value: 'Unifamiliale' },
  { label: 'Condo', value: 'Condo' },
  { label: 'Duplex', value: 'Duplex' },
  { label: 'Triplex', value: 'Triplex' },
  { label: 'Quadruplex', value: 'Quadruplex' },
  { label: 'Terrain', value: 'Terrain' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Autre', value: 'Autre' },
];

const CIVIL_STATUS_OPTIONS = [
  { label: 'Célibataire', value: 'Célibataire' },
  { label: 'Marié(e)', value: 'Marié' },
  { label: 'Veuf(ve)', value: 'Veuf' },
  { label: 'Divorcé(e)', value: 'Divorcé' },
  { label: 'Uni(e) civilement', value: 'Uni civilement' },
];

const MORTGAGE_TYPE_OPTIONS = [
  { label: 'Taux fixe', value: 'Taux fixe' },
  { label: 'Taux variable', value: 'Taux variable' },
];

export default function TransactionForm({ onSubmit, onCancel, initialData, isLoading }: TransactionFormProps) {
  const [activeTab, setActiveTab] = useState('identification');
  const [formData, setFormData] = useState<TransactionFormData>({
    name: initialData?.name || '',
    dossier_number: initialData?.dossier_number || '',
    status: initialData?.status || 'En cours',
    transaction_kind: initialData?.transaction_kind ?? undefined,
    property_address: initialData?.property_address || '',
    property_city: initialData?.property_city || '',
    property_postal_code: initialData?.property_postal_code || '',
    property_province: initialData?.property_province || 'QC',
    sellers: initialData?.sellers || [{ name: '' }],
    buyers: initialData?.buyers || [{ name: '' }],
    mortgage_insurance_required: initialData?.mortgage_insurance_required || false,
    location_certificate_received: initialData?.location_certificate_received || false,
    seller_declaration_signed: initialData?.seller_declaration_signed || false,
    inspection_report_received: initialData?.inspection_report_received || false,
    financing_approval_received: initialData?.financing_approval_received || false,
    home_insurance_proof_received: initialData?.home_insurance_proof_received || false,
    seller_quittance_received: initialData?.seller_quittance_received || false,
    seller_quittance_confirmed: initialData?.seller_quittance_confirmed || false,
  });

  const tabs = [
    { id: 'identification', label: '1. Identification' },
    { id: 'property', label: '2. Propriété' },
    { id: 'parties', label: '3. Parties' },
    { id: 'financial', label: '4. Financier' },
    { id: 'mortgage', label: '5. Hypothèque' },
    { id: 'dates', label: '6. Dates' },
    { id: 'documents', label: '7. Documents' },
    { id: 'fees', label: '8. Frais' },
    { id: 'adjustments', label: '9. Ajustements' },
    { id: 'post', label: '10. Post-transaction' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const addSeller = () => {
    setFormData({
      ...formData,
      sellers: [...formData.sellers, { name: '' }],
    });
  };

  const removeSeller = (index: number) => {
    setFormData({
      ...formData,
      sellers: formData.sellers.filter((_, i) => i !== index),
    });
  };

  const updateSeller = (index: number, field: keyof Person, value: string) => {
    const updatedSellers = [...formData.sellers];
    const currentSeller = updatedSellers[index] || { name: '' };
    updatedSellers[index] = { 
      ...currentSeller, 
      [field]: value,
      name: field === 'name' ? value : (currentSeller.name || '')
    } as Person;
    setFormData({ ...formData, sellers: updatedSellers });
  };

  const addBuyer = () => {
    setFormData({
      ...formData,
      buyers: [...formData.buyers, { name: '' }],
    });
  };

  const removeBuyer = (index: number) => {
    setFormData({
      ...formData,
      buyers: formData.buyers.filter((_, i) => i !== index),
    });
  };

  const updateBuyer = (index: number, field: keyof Person, value: string) => {
    const updatedBuyers = [...formData.buyers];
    const currentBuyer = updatedBuyers[index] || { name: '' };
    updatedBuyers[index] = { 
      ...currentBuyer, 
      [field]: value,
      name: field === 'name' ? value : (currentBuyer.name || '')
    } as Person;
    setFormData({ ...formData, buyers: updatedBuyers });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-h-[60vh] overflow-y-auto">
        {/* 1. Identification */}
        {activeTab === 'identification' && (
          <div className="space-y-4">
            <Select
              label="Type de pipeline"
              options={TRANSACTION_KIND_OPTIONS}
              value={formData.transaction_kind ?? ''}
              onChange={(e) => setFormData({ ...formData, transaction_kind: e.target.value || undefined })}
            />
            <Input
              label="Nom de la transaction *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Vente Maison Laval - 123 Rue Principale"
            />
            <Input
              label="Numéro de dossier"
              value={formData.dossier_number || ''}
              onChange={(e) => setFormData({ ...formData, dossier_number: e.target.value || undefined })}
              placeholder="Optionnel"
            />
            <Select
              label="Statut"
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
            <Input
              label="Date de clôture prévue"
              type="date"
              value={formData.expected_closing_date || ''}
              onChange={(e) => setFormData({ ...formData, expected_closing_date: e.target.value || undefined })}
            />
            <Input
              label="Date de clôture réelle"
              type="date"
              value={formData.actual_closing_date || ''}
              onChange={(e) => setFormData({ ...formData, actual_closing_date: e.target.value || undefined })}
            />
          </div>
        )}

        {/* 2. Propriété */}
        {activeTab === 'property' && (
          <div className="space-y-4">
            <AddressAutocompleteInput
              label="Adresse complète *"
              value={formData.property_address}
              onChange={(v) => setFormData({ ...formData, property_address: v })}
              onSelect={(result) => {
                setFormData((prev) => ({
                  ...prev,
                  property_address: result.address,
                  property_city: result.city ?? prev.property_city,
                  property_postal_code: result.postal_code ?? prev.property_postal_code,
                  property_province: result.province ?? prev.property_province,
                }));
              }}
              required
              placeholder="Rechercher une adresse (Google)"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ville *"
                value={formData.property_city}
                onChange={(e) => setFormData({ ...formData, property_city: e.target.value })}
                required
              />
              <Input
                label="Code postal *"
                value={formData.property_postal_code}
                onChange={(e) => setFormData({ ...formData, property_postal_code: e.target.value })}
                required
              />
            </div>
            <Input
              label="Province"
              value={formData.property_province}
              onChange={(e) => setFormData({ ...formData, property_province: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Numéro de lot (cadastre)"
                value={formData.lot_number || ''}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value || undefined })}
              />
              <Input
                label="Numéro de matricule"
                value={formData.matricule_number || ''}
                onChange={(e) => setFormData({ ...formData, matricule_number: e.target.value || undefined })}
              />
            </div>
            <Select
              label="Type de propriété"
              options={PROPERTY_TYPE_OPTIONS}
              value={formData.property_type || ''}
              onChange={(e) => setFormData({ ...formData, property_type: e.target.value || undefined })}
              placeholder="Sélectionner un type"
            />
            <Input
              label="Année de construction"
              type="number"
              value={formData.construction_year || ''}
              onChange={(e) => setFormData({ ...formData, construction_year: e.target.value ? parseInt(e.target.value) : undefined })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Superficie du terrain (pi²)"
                type="number"
                value={formData.land_area_sqft || ''}
                onChange={(e) => setFormData({ ...formData, land_area_sqft: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <Input
                label="Superficie du terrain (m²)"
                type="number"
                value={formData.land_area_sqm || ''}
                onChange={(e) => setFormData({ ...formData, land_area_sqm: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Superficie habitable (pi²)"
                type="number"
                value={formData.living_area_sqft || ''}
                onChange={(e) => setFormData({ ...formData, living_area_sqft: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <Input
                label="Superficie habitable (m²)"
                type="number"
                value={formData.living_area_sqm || ''}
                onChange={(e) => setFormData({ ...formData, living_area_sqm: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Nombre de pièces"
                type="number"
                value={formData.total_rooms || ''}
                onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <Input
                label="Chambres"
                type="number"
                value={formData.bedrooms || ''}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <Input
                label="Salles de bain"
                type="number"
                value={formData.bathrooms || ''}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            <Textarea
              label="Inclusions (biens meubles inclus)"
              value={(formData.inclusions || []).join(', ')}
              onChange={(e) => setFormData({ ...formData, inclusions: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined })}
              placeholder="Ex: Réfrigérateur, Lave-vaisselle, Luminaires..."
            />
            <Textarea
              label="Exclusions (biens meubles exclus)"
              value={(formData.exclusions || []).join(', ')}
              onChange={(e) => setFormData({ ...formData, exclusions: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined })}
              placeholder="Ex: Meubles de salon, Tableaux..."
            />
          </div>
        )}

        {/* 3. Parties */}
        {activeTab === 'parties' && (
          <div className="space-y-6">
            {/* Vendeurs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Vendeur(s)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addSeller}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              {formData.sellers.map((seller, index) => (
                <div key={index} className="p-4 border rounded-lg mb-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Vendeur {index + 1}</span>
                    {formData.sellers.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSeller(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    label="Nom complet *"
                    value={seller.name}
                    onChange={(e) => updateSeller(index, 'name', e.target.value)}
                    required
                  />
                  <Input
                    label="Adresse"
                    value={seller.address || ''}
                    onChange={(e) => updateSeller(index, 'address', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Téléphone"
                      value={seller.phone || ''}
                      onChange={(e) => updateSeller(index, 'phone', e.target.value)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={seller.email || ''}
                      onChange={(e) => updateSeller(index, 'email', e.target.value)}
                    />
                  </div>
                  <Select
                    label="État civil"
                    options={CIVIL_STATUS_OPTIONS}
                    value={seller.civil_status || ''}
                    onChange={(e) => updateSeller(index, 'civil_status', e.target.value)}
                    placeholder="Sélectionner"
                  />
                </div>
              ))}
            </div>

            {/* Acheteurs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Acheteur(s)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addBuyer}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              {formData.buyers.map((buyer, index) => (
                <div key={index} className="p-4 border rounded-lg mb-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Acheteur {index + 1}</span>
                    {formData.buyers.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeBuyer(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    label="Nom complet *"
                    value={buyer.name}
                    onChange={(e) => updateBuyer(index, 'name', e.target.value)}
                    required
                  />
                  <Input
                    label="Adresse future"
                    value={buyer.address || ''}
                    onChange={(e) => updateBuyer(index, 'address', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Téléphone"
                      value={buyer.phone || ''}
                      onChange={(e) => updateBuyer(index, 'phone', e.target.value)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={buyer.email || ''}
                      onChange={(e) => updateBuyer(index, 'email', e.target.value)}
                    />
                  </div>
                  <Select
                    label="État civil"
                    options={CIVIL_STATUS_OPTIONS}
                    value={buyer.civil_status || ''}
                    onChange={(e) => updateBuyer(index, 'civil_status', e.target.value)}
                    placeholder="Sélectionner"
                  />
                </div>
              ))}
            </div>

            {/* Professionnels - Courtier vendeur */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="text-lg font-semibold mb-3">Courtier immobilier (vendeur)</h3>
              <Input
                label="Nom"
                value={formData.seller_broker?.name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  seller_broker: { ...formData.seller_broker, name: e.target.value },
                })}
              />
              <Input
                label="Agence"
                value={formData.seller_broker?.agency_or_firm || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  seller_broker: { ...formData.seller_broker, agency_or_firm: e.target.value },
                })}
              />
              <Input
                label="Numéro de permis OACIQ"
                value={formData.seller_broker?.license_number || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  seller_broker: { ...formData.seller_broker, license_number: e.target.value },
                })}
              />
            </div>

            {/* Courtier acheteur */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="text-lg font-semibold mb-3">Courtier immobilier (acheteur)</h3>
              <Input
                label="Nom"
                value={formData.buyer_broker?.name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  buyer_broker: { ...formData.buyer_broker, name: e.target.value },
                })}
              />
              <Input
                label="Agence"
                value={formData.buyer_broker?.agency_or_firm || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  buyer_broker: { ...formData.buyer_broker, agency_or_firm: e.target.value },
                })}
              />
              <Input
                label="Numéro de permis OACIQ"
                value={formData.buyer_broker?.license_number || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  buyer_broker: { ...formData.buyer_broker, license_number: e.target.value },
                })}
              />
            </div>

            {/* Notaire */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="text-lg font-semibold mb-3">Notaire instrumentant</h3>
              <Input
                label="Nom"
                value={formData.notary?.name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  notary: { ...formData.notary, name: e.target.value },
                })}
              />
              <Input
                label="Étude"
                value={formData.notary?.agency_or_firm || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  notary: { ...formData.notary, agency_or_firm: e.target.value },
                })}
              />
            </div>

            {/* Inspecteur */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="text-lg font-semibold mb-3">Inspecteur en bâtiments</h3>
              <Input
                label="Nom"
                value={formData.inspector?.name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  inspector: { ...formData.inspector, name: e.target.value },
                })}
              />
              <Input
                label="Entreprise"
                value={formData.inspector?.agency_or_firm || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  inspector: { ...formData.inspector, agency_or_firm: e.target.value },
                })}
              />
            </div>

            {/* Arpenteur-géomètre */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="text-lg font-semibold mb-3">Arpenteur-géomètre</h3>
              <Input
                label="Nom"
                value={formData.surveyor?.name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  surveyor: { ...formData.surveyor, name: e.target.value },
                })}
              />
              <Input
                label="Entreprise"
                value={formData.surveyor?.agency_or_firm || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  surveyor: { ...formData.surveyor, agency_or_firm: e.target.value },
                })}
              />
            </div>

            {/* Conseiller hypothécaire */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="text-lg font-semibold mb-3">Conseiller hypothécaire</h3>
              <Input
                label="Nom"
                value={formData.mortgage_advisor?.name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  mortgage_advisor: { ...formData.mortgage_advisor, name: e.target.value },
                })}
              />
              <Input
                label="Institution financière"
                value={formData.mortgage_advisor?.agency_or_firm || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  mortgage_advisor: { ...formData.mortgage_advisor, agency_or_firm: e.target.value },
                })}
              />
            </div>
          </div>
        )}

        {/* 4. Financier */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            <Input
              label="Prix de vente demandé"
              type="number"
              step="0.01"
              value={formData.listing_price || ''}
              onChange={(e) => setFormData({ ...formData, listing_price: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Prix d'achat offert"
              type="number"
              step="0.01"
              value={formData.offered_price || ''}
              onChange={(e) => setFormData({ ...formData, offered_price: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Prix de vente final"
              type="number"
              step="0.01"
              value={formData.final_sale_price || ''}
              onChange={(e) => setFormData({ ...formData, final_sale_price: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Montant de l'acompte"
              type="number"
              step="0.01"
              value={formData.deposit_amount || ''}
              onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Rétribution courtier (%)"
                type="number"
                step="0.01"
                value={formData.broker_commission_percent || ''}
                onChange={(e) => setFormData({ ...formData, broker_commission_percent: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <Input
                label="Rétribution courtier ($)"
                type="number"
                step="0.01"
                value={formData.broker_commission_amount || ''}
                onChange={(e) => setFormData({ ...formData, broker_commission_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
          </div>
        )}

        {/* 5. Hypothèque */}
        {activeTab === 'mortgage' && (
          <div className="space-y-4">
            <Input
              label="Montant de la mise de fonds"
              type="number"
              step="0.01"
              value={formData.down_payment_amount || ''}
              onChange={(e) => setFormData({ ...formData, down_payment_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Montant du prêt hypothécaire"
              type="number"
              step="0.01"
              value={formData.mortgage_amount || ''}
              onChange={(e) => setFormData({ ...formData, mortgage_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Institution financière"
              value={formData.mortgage_institution || ''}
              onChange={(e) => setFormData({ ...formData, mortgage_institution: e.target.value || undefined })}
            />
            <Select
              label="Type de prêt"
              options={MORTGAGE_TYPE_OPTIONS}
              value={formData.mortgage_type || ''}
              onChange={(e) => setFormData({ ...formData, mortgage_type: e.target.value || undefined })}
              placeholder="Sélectionner"
            />
            <Input
              label="Taux d'intérêt (%)"
              type="number"
              step="0.01"
              value={formData.mortgage_interest_rate || ''}
              onChange={(e) => setFormData({ ...formData, mortgage_interest_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Terme de l'hypothèque (années)"
                type="number"
                value={formData.mortgage_term_years || ''}
                onChange={(e) => setFormData({ ...formData, mortgage_term_years: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <Input
                label="Période d'amortissement (années)"
                type="number"
                value={formData.amortization_years || ''}
                onChange={(e) => setFormData({ ...formData, amortization_years: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.mortgage_insurance_required}
                onChange={(e) => setFormData({ ...formData, mortgage_insurance_required: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm font-medium">Assurance prêt requise (SCHL, etc.)</label>
            </div>
            {formData.mortgage_insurance_required && (
              <Input
                label="Montant de la prime d'assurance"
                type="number"
                step="0.01"
                value={formData.mortgage_insurance_amount || ''}
                onChange={(e) => setFormData({ ...formData, mortgage_insurance_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            )}
          </div>
        )}

        {/* 6. Dates */}
        {activeTab === 'dates' && (
          <div className="space-y-4">
            <Input
              label="Date de la promesse d'achat"
              type="date"
              value={formData.promise_to_purchase_date || ''}
              onChange={(e) => setFormData({ ...formData, promise_to_purchase_date: e.target.value || undefined })}
            />
            <Input
              label="Date d'acceptation de la PA"
              type="date"
              value={formData.promise_acceptance_date || ''}
              onChange={(e) => setFormData({ ...formData, promise_acceptance_date: e.target.value || undefined })}
            />
            <Input
              label="Date limite - Inspection"
              type="date"
              value={formData.inspection_deadline || ''}
              onChange={(e) => setFormData({ ...formData, inspection_deadline: e.target.value || undefined })}
            />
            <Input
              label="Date de l'inspection"
              type="date"
              value={formData.inspection_date || ''}
              onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value || undefined })}
            />
            <Input
              label="Date de levée de la condition d'inspection"
              type="date"
              value={formData.inspection_condition_lifted_date || ''}
              onChange={(e) => setFormData({ ...formData, inspection_condition_lifted_date: e.target.value || undefined })}
            />
            <Input
              label="Date limite - Financement"
              type="date"
              value={formData.financing_deadline || ''}
              onChange={(e) => setFormData({ ...formData, financing_deadline: e.target.value || undefined })}
            />
            <Input
              label="Date de levée de la condition de financement"
              type="date"
              value={formData.financing_condition_lifted_date || ''}
              onChange={(e) => setFormData({ ...formData, financing_condition_lifted_date: e.target.value || undefined })}
            />
            <Input
              label="Date de signature - Acte d'hypothèque"
              type="date"
              value={formData.mortgage_act_signing_date || ''}
              onChange={(e) => setFormData({ ...formData, mortgage_act_signing_date: e.target.value || undefined })}
            />
            <Input
              label="Date de signature - Acte de vente"
              type="date"
              value={formData.sale_act_signing_date || ''}
              onChange={(e) => setFormData({ ...formData, sale_act_signing_date: e.target.value || undefined })}
            />
            <Input
              label="Date de prise de possession"
              type="date"
              value={formData.possession_date || ''}
              onChange={(e) => setFormData({ ...formData, possession_date: e.target.value || undefined })}
            />
          </div>
        )}

        {/* 7. Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.location_certificate_received}
                  onChange={(e) => setFormData({ ...formData, location_certificate_received: e.target.checked })}
                  className="rounded"
                />
                <label className="font-medium">Certificat de localisation reçu</label>
              </div>
              {formData.location_certificate_received && (
                <>
                  <Input
                    label="Date du certificat"
                    type="date"
                    value={formData.location_certificate_date || ''}
                    onChange={(e) => setFormData({ ...formData, location_certificate_date: e.target.value || undefined })}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Conforme:</label>
                    <select
                      value={formData.location_certificate_conform === undefined ? '' : formData.location_certificate_conform ? 'yes' : 'no'}
                      onChange={(e) => setFormData({
                        ...formData,
                        location_certificate_conform: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined,
                      })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">Non spécifié</option>
                      <option value="yes">Oui</option>
                      <option value="no">Non</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.seller_declaration_signed}
                  onChange={(e) => setFormData({ ...formData, seller_declaration_signed: e.target.checked })}
                  className="rounded"
                />
                <label className="font-medium">Déclaration du vendeur signée</label>
              </div>
              {formData.seller_declaration_signed && (
                <Input
                  label="Date de signature"
                  type="date"
                  value={formData.seller_declaration_date || ''}
                  onChange={(e) => setFormData({ ...formData, seller_declaration_date: e.target.value || undefined })}
                />
              )}
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.inspection_report_received}
                  onChange={(e) => setFormData({ ...formData, inspection_report_received: e.target.checked })}
                  className="rounded"
                />
                <label className="font-medium">Rapport d'inspection reçu</label>
              </div>
              {formData.inspection_report_received && (
                <div className="flex items-center gap-2">
                  <label className="text-sm">Satisfaisant:</label>
                  <select
                    value={formData.inspection_report_satisfactory === undefined ? '' : formData.inspection_report_satisfactory ? 'yes' : 'no'}
                    onChange={(e) => setFormData({
                      ...formData,
                      inspection_report_satisfactory: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined,
                    })}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">Non spécifié</option>
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.financing_approval_received}
                  onChange={(e) => setFormData({ ...formData, financing_approval_received: e.target.checked })}
                  className="rounded"
                />
                <label className="font-medium">Approbation de financement reçue</label>
              </div>
              {formData.financing_approval_received && (
                <Input
                  label="Date de réception"
                  type="date"
                  value={formData.financing_approval_date || ''}
                  onChange={(e) => setFormData({ ...formData, financing_approval_date: e.target.value || undefined })}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.home_insurance_proof_received}
                onChange={(e) => setFormData({ ...formData, home_insurance_proof_received: e.target.checked })}
                className="rounded"
              />
              <label className="font-medium">Preuve d'assurance habitation reçue</label>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.seller_quittance_received}
                  onChange={(e) => setFormData({ ...formData, seller_quittance_received: e.target.checked })}
                  className="rounded"
                />
                <label className="font-medium">Quittance (Vendeur) reçue</label>
              </div>
              {formData.seller_quittance_received && (
                <Input
                  label="Montant"
                  type="number"
                  step="0.01"
                  value={formData.seller_quittance_amount || ''}
                  onChange={(e) => setFormData({ ...formData, seller_quittance_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              )}
            </div>
          </div>
        )}

        {/* 8. Frais */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Frais - Acheteur</h3>
              <div className="space-y-4">
                <Input
                  label="Droits de mutation (Taxe de bienvenue)"
                  type="number"
                  step="0.01"
                  value={formData.buyer_mutation_tax || ''}
                  onChange={(e) => setFormData({ ...formData, buyer_mutation_tax: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <Input
                  label="Honoraires du notaire (Vente)"
                  type="number"
                  step="0.01"
                  value={formData.buyer_notary_fees_sale || ''}
                  onChange={(e) => setFormData({ ...formData, buyer_notary_fees_sale: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <Input
                  label="Honoraires du notaire (Hypothèque)"
                  type="number"
                  step="0.01"
                  value={formData.buyer_notary_fees_mortgage || ''}
                  onChange={(e) => setFormData({ ...formData, buyer_notary_fees_mortgage: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <Input
                  label="Frais d'inspection"
                  type="number"
                  step="0.01"
                  value={formData.buyer_inspection_fees || ''}
                  onChange={(e) => setFormData({ ...formData, buyer_inspection_fees: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <Input
                  label="Frais d'évaluation"
                  type="number"
                  step="0.01"
                  value={formData.buyer_appraisal_fees || ''}
                  onChange={(e) => setFormData({ ...formData, buyer_appraisal_fees: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <Input
                  label="Taxe sur prime d'assurance prêt (9%)"
                  type="number"
                  step="0.01"
                  value={formData.buyer_insurance_tax || ''}
                  onChange={(e) => setFormData({ ...formData, buyer_insurance_tax: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Frais - Vendeur</h3>
              <div className="space-y-4">
                <Input
                  label="Rétribution du courtier (+taxes)"
                  type="number"
                  step="0.01"
                  value={formData.seller_broker_commission_total || ''}
                  onChange={(e) => setFormData({ ...formData, seller_broker_commission_total: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <Input
                  label="Frais de quittance (notaire)"
                  type="number"
                  step="0.01"
                  value={formData.seller_quittance_fees || ''}
                  onChange={(e) => setFormData({ ...formData, seller_quittance_fees: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <Input
                  label="Pénalité hypothécaire"
                  type="number"
                  step="0.01"
                  value={formData.seller_mortgage_penalty || ''}
                  onChange={(e) => setFormData({ ...formData, seller_mortgage_penalty: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <Input
                  label="Frais de certificat de localisation"
                  type="number"
                  step="0.01"
                  value={formData.seller_location_certificate_fees || ''}
                  onChange={(e) => setFormData({ ...formData, seller_location_certificate_fees: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 9. Ajustements */}
        {activeTab === 'adjustments' && (
          <div className="space-y-4">
            <Input
              label="Ajustement - Taxes municipales"
              type="number"
              step="0.01"
              value={formData.adjustment_municipal_taxes || ''}
              onChange={(e) => setFormData({ ...formData, adjustment_municipal_taxes: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Ajustement - Taxes scolaires"
              type="number"
              step="0.01"
              value={formData.adjustment_school_taxes || ''}
              onChange={(e) => setFormData({ ...formData, adjustment_school_taxes: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Ajustement - Frais de condo"
              type="number"
              step="0.01"
              value={formData.adjustment_condo_fees || ''}
              onChange={(e) => setFormData({ ...formData, adjustment_condo_fees: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Ajustement - Revenus de location"
              type="number"
              step="0.01"
              value={formData.adjustment_rental_income || ''}
              onChange={(e) => setFormData({ ...formData, adjustment_rental_income: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
        )}

        {/* 10. Post-transaction */}
        {activeTab === 'post' && (
          <div className="space-y-4">
            <Input
              label="Numéro de publication (Registre foncier)"
              value={formData.registry_publication_number || ''}
              onChange={(e) => setFormData({ ...formData, registry_publication_number: e.target.value || undefined })}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.seller_quittance_confirmed}
                onChange={(e) => setFormData({ ...formData, seller_quittance_confirmed: e.target.checked })}
                className="rounded"
              />
              <label className="font-medium">Confirmation de la quittance (Vendeur)</label>
            </div>
            <Textarea
              label="Notes et commentaires"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || undefined })}
              rows={6}
              placeholder="Espace pour toute information additionnelle pertinente..."
            />
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={isLoading || !formData.name || formData.name.trim().length === 0}>
          {isLoading ? 'Création...' : 'Créer la transaction'}
        </Button>
      </div>
    </form>
  );
}
