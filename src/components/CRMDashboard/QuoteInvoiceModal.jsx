// QuoteInvoiceModal.jsx - Admin tool to create quotes/invoices for user requests
import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, FileText, Send, Download, Loader2,
  Plane, Car, Ship, Building2, Wine, Calendar, MapPin,
  Users, Clock, DollarSign, Percent, Check, AlertCircle
} from 'lucide-react';
import { generateQuoteInvoiceHTML, downloadHTMLAsPDF } from '../../services/pdfHtmlGenerator';

// Service type options with icons and default pricing
const SERVICE_TYPES = [
  { id: 'private_jet', label: 'Private Jet Charter', icon: Plane, defaultUnit: 'flight' },
  { id: 'helicopter', label: 'Helicopter Charter', icon: Plane, defaultUnit: 'flight' },
  { id: 'empty_leg', label: 'Empty Leg Flight', icon: Plane, defaultUnit: 'seat' },
  { id: 'ground_transport', label: 'Ground Transport', icon: Car, defaultUnit: 'transfer' },
  { id: 'yacht', label: 'Yacht Charter', icon: Ship, defaultUnit: 'day' },
  { id: 'concierge', label: 'Concierge Service', icon: Building2, defaultUnit: 'service' },
  { id: 'wine', label: 'Wine & Spirits', icon: Wine, defaultUnit: 'bottle' },
  { id: 'custom', label: 'Custom Service', icon: FileText, defaultUnit: 'item' }
];

const QuoteInvoiceModal = ({ request, user, onClose, onSave }) => {
  const [documentType, setDocumentType] = useState('quote'); // 'quote' or 'invoice'
  const [services, setServices] = useState([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due upon receipt');
  const [discount, setDiscount] = useState({ type: 'fixed', value: 0 });
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize with request data
  useEffect(() => {
    if (request) {
      // Parse request data
      let data = request.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = {}; }
      }
      data = data || {};

      // Pre-fill notes with request summary
      const summary = [];
      if (data.from && data.to) summary.push(`Route: ${data.from} → ${data.to}`);
      if (data.date || data.departure_date) summary.push(`Date: ${data.date || data.departure_date}`);
      if (data.passengers || data.pax) summary.push(`Passengers: ${data.passengers || data.pax}`);
      setNotes(summary.join('\n'));

      // Set valid until to 7 days from now for quotes
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 7);
      setValidUntil(validDate.toISOString().split('T')[0]);

      // Try to detect service type and pre-add
      const type = request.type?.toLowerCase() || '';
      let serviceType = 'custom';
      if (type.includes('jet') || type.includes('aircraft')) serviceType = 'private_jet';
      else if (type.includes('helicopter') || type.includes('heli')) serviceType = 'helicopter';
      else if (type.includes('empty')) serviceType = 'empty_leg';
      else if (type.includes('transfer') || type.includes('car') || type.includes('taxi')) serviceType = 'ground_transport';
      else if (type.includes('yacht')) serviceType = 'yacht';

      // Add initial service based on request type
      addService(serviceType, data);
    }
  }, [request]);

  // Add a new service line
  const addService = (typeId = 'custom', prefillData = null) => {
    const serviceType = SERVICE_TYPES.find(s => s.id === typeId) || SERVICE_TYPES[SERVICE_TYPES.length - 1];

    const newService = {
      id: Date.now(),
      type: serviceType.id,
      description: prefillData?.name || prefillData?.title || '',
      details: '',
      quantity: 1,
      unit: serviceType.defaultUnit,
      unitPrice: 0,
      // Pre-fill from request data if available
      from: prefillData?.from || prefillData?.origin || '',
      to: prefillData?.to || prefillData?.destination || '',
      date: prefillData?.date || prefillData?.departure_date || '',
      passengers: prefillData?.passengers || prefillData?.pax || ''
    };

    setServices(prev => [...prev, newService]);
  };

  // Update a service
  const updateService = (id, field, value) => {
    setServices(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Remove a service
  const removeService = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // Calculate totals
  const subtotal = services.reduce((sum, s) => sum + (s.quantity * s.unitPrice), 0);
  const discountAmount = discount.type === 'percent'
    ? (subtotal * discount.value / 100)
    : discount.value;
  const total = Math.max(0, subtotal - discountAmount);

  // Generate and download PDF
  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      // Parse user info
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client';
      const userEmail = user?.email || request?.data?.email || '';

      const quoteData = {
        type: documentType,
        number: `${documentType.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toISOString(),
        validUntil: documentType === 'quote' ? validUntil : null,
        paymentTerms: documentType === 'invoice' ? paymentTerms : null,
        client: {
          name: userName,
          email: userEmail,
          phone: request?.data?.phone || user?.user_metadata?.phone || ''
        },
        services: services.map(s => ({
          type: s.type,
          description: s.description || SERVICE_TYPES.find(t => t.id === s.type)?.label || 'Service',
          details: s.details,
          from: s.from,
          to: s.to,
          date: s.date,
          passengers: s.passengers,
          quantity: s.quantity,
          unit: s.unit,
          unitPrice: s.unitPrice,
          total: s.quantity * s.unitPrice
        })),
        subtotal,
        discount: discountAmount > 0 ? {
          type: discount.type,
          value: discount.value,
          amount: discountAmount
        } : null,
        total,
        notes,
        requestId: request?.id
      };

      const html = generateQuoteInvoiceHTML(quoteData);
      const filename = `PrivateCharterX_${quoteData.number}.pdf`;

      await downloadHTMLAsPDF(html, filename);
      setSaved(true);

      // Optionally save to database
      if (onSave) {
        await onSave(quoteData);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Get icon for service type
  const getServiceIcon = (typeId) => {
    const service = SERVICE_TYPES.find(s => s.id === typeId);
    return service?.icon || FileText;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Create {documentType === 'quote' ? 'Quote' : 'Invoice'}
              </h2>
              <p className="text-xs text-gray-500">
                Request #{request?.id?.slice(0, 8)} • {user?.email || 'Unknown client'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setDocumentType('quote')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                documentType === 'quote'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Quote (Proposal)
            </button>
            <button
              onClick={() => setDocumentType('invoice')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                documentType === 'invoice'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Invoice (Final)
            </button>
          </div>

          {/* Services Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Services</h3>
              <button
                onClick={() => addService()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add Service
              </button>
            </div>

            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <FileText size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No services added yet</p>
                  <button
                    onClick={() => addService()}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Click to add a service
                  </button>
                </div>
              ) : (
                services.map((service, index) => {
                  const ServiceIcon = getServiceIcon(service.type);
                  return (
                    <div key={service.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-start gap-3">
                        {/* Service Type Selector */}
                        <div className="flex-shrink-0">
                          <select
                            value={service.type}
                            onChange={(e) => updateService(service.id, 'type', e.target.value)}
                            className="w-10 h-10 bg-white border border-gray-200 rounded-lg text-center appearance-none cursor-pointer"
                            style={{
                              backgroundImage: 'none',
                              textIndent: '-9999px'
                            }}
                            title="Select service type"
                          >
                            {SERVICE_TYPES.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                          <div className="w-10 h-10 absolute pointer-events-none flex items-center justify-center -mt-10">
                            <ServiceIcon size={18} className="text-gray-600" />
                          </div>
                        </div>

                        {/* Service Details */}
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={service.description}
                              onChange={(e) => updateService(service.id, 'description', e.target.value)}
                              placeholder="Service description"
                              className="col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                            />

                            {/* Route fields for transport services */}
                            {['private_jet', 'helicopter', 'empty_leg', 'ground_transport', 'yacht'].includes(service.type) && (
                              <>
                                <div className="relative">
                                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={service.from}
                                    onChange={(e) => updateService(service.id, 'from', e.target.value)}
                                    placeholder="From"
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="relative">
                                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={service.to}
                                    onChange={(e) => updateService(service.id, 'to', e.target.value)}
                                    placeholder="To"
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="relative">
                                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="date"
                                    value={service.date}
                                    onChange={(e) => updateService(service.id, 'date', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="relative">
                                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="number"
                                    value={service.passengers}
                                    onChange={(e) => updateService(service.id, 'passengers', e.target.value)}
                                    placeholder="Passengers"
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                              </>
                            )}

                            <textarea
                              value={service.details}
                              onChange={(e) => updateService(service.id, 'details', e.target.value)}
                              placeholder="Additional details (aircraft type, amenities, etc.)"
                              rows={2}
                              className="col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm resize-none"
                            />
                          </div>

                          {/* Pricing Row */}
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={service.quantity}
                                onChange={(e) => updateService(service.id, 'quantity', parseInt(e.target.value) || 1)}
                                min="1"
                                className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-center"
                              />
                              <span className="text-xs text-gray-500">×</span>
                              <select
                                value={service.unit}
                                onChange={(e) => updateService(service.id, 'unit', e.target.value)}
                                className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                              >
                                <option value="flight">flight</option>
                                <option value="seat">seat</option>
                                <option value="hour">hour</option>
                                <option value="day">day</option>
                                <option value="transfer">transfer</option>
                                <option value="bottle">bottle</option>
                                <option value="item">item</option>
                                <option value="service">service</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">@</span>
                              <div className="relative">
                                <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="number"
                                  value={service.unitPrice}
                                  onChange={(e) => updateService(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  className="w-28 pl-7 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div className="flex-1 text-right">
                              <span className="text-sm font-semibold text-gray-900">
                                ${(service.quantity * service.unitPrice).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeService(service.id)}
                          className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Discount */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Discount</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={discount.type}
                  onChange={(e) => setDiscount(prev => ({ ...prev, type: e.target.value }))}
                  className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value="fixed">Fixed ($)</option>
                  <option value="percent">Percent (%)</option>
                </select>
                <input
                  type="number"
                  value={discount.value}
                  onChange={(e) => setDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-right"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Validity / Payment Terms */}
          <div className="grid grid-cols-2 gap-4">
            {documentType === 'quote' ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="Due upon receipt">Due upon receipt</option>
                  <option value="Net 7">Net 7 days</option>
                  <option value="Net 15">Net 15 days</option>
                  <option value="Net 30">Net 30 days</option>
                  <option value="50% upfront">50% upfront, 50% on completion</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes / Terms</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes or terms..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-900 text-white rounded-xl p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Discount {discount.type === 'percent' ? `(${discount.value}%)` : ''}
                  </span>
                  <span className="text-red-400">-${discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                <span>Total</span>
                <span>${total.toLocaleString()} USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {saved ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <Check size={14} /> PDF Generated Successfully
              </span>
            ) : (
              <span>PDF will be downloaded when generated</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={services.length === 0 || generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Generate PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteInvoiceModal;
