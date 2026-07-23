import React, { useState } from 'react';
import { X, MapPin, Package, AlertTriangle, FileText } from 'lucide-react';

const TicketCreationModal = ({ pngRegions, onClose, onSubmit, isOnline }) => {
  const [formData, setFormData] = useState({
    region: '',
    province: '',
    district: '',
    facility: '',
    equipment: '',
    equipmentId: '',
    faultDescription: '',
    priority: 'medium',
    createdBy: 'Current User'
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Reset dependent fields
    if (field === 'region') {
      setFormData(prev => ({ ...prev, province: '', district: '', facility: '' }));
    }
    if (field === 'province') {
      setFormData(prev => ({ ...prev, district: '', facility: '' }));
    }
  };

  const generateReferenceNumber = () => {
    const region = pngRegions?.[formData?.region];
    const province = region?.provinces?.[formData?.province];
    const district = formData?.district;
    const facility = formData?.facility;

    const regionCode = region?.code || 'XXX';
    const provinceCode = province?.code || 'XXX';
    const districtCode = district?.slice(0, 3)?.toUpperCase() || 'XXX';
    const facilityCode = facility?.includes('General') ? 'GEN' : 
                         facility?.includes('Hospital') ? 'HP' : 
                         facility?.includes('Clinic') ? 'CLN' : 
                         facility?.includes('Health Centre') ? 'HC' : 'FAC';

    const date = new Date()?.toISOString()?.split('T')?.[0]?.replace(/-/g, '');
    const serial = String(Math.floor(Math.random() * 9999) + 1)?.padStart(4, '0');

    return `${regionCode}-${provinceCode}-${districtCode}-${facilityCode}-${date}-${serial}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.region) newErrors.region = 'Region is required';
    if (!formData?.province) newErrors.province = 'Province is required';
    if (!formData?.district) newErrors.district = 'District is required';
    if (!formData?.facility) newErrors.facility = 'Facility name is required';
    if (!formData?.equipment) newErrors.equipment = 'Equipment name is required';
    if (!formData?.equipmentId) newErrors.equipmentId = 'Equipment ID is required';
    if (!formData?.faultDescription || formData?.faultDescription?.length < 10) {
      newErrors.faultDescription = 'Fault description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    const referenceNumber = generateReferenceNumber();
    onSubmit({
      ...formData,
      referenceNumber
    });
  };

  const availableProvinces = formData?.region ? 
    Object.entries(pngRegions?.[formData?.region]?.provinces || {}) : [];

  const availableDistricts = formData?.province ? 
    pngRegions?.[formData?.region]?.provinces?.[formData?.province]?.districts || [] : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Ticket</h2>
              <p className="text-sm text-gray-500">Report cold chain equipment issue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Offline Warning */}
          {!isOnline && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Offline Mode</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Your ticket will be saved locally and synced when you're back online
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 font-medium">
              <MapPin className="w-5 h-5" />
              <span>Location Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData?.region}
                  onChange={(e) => handleInputChange('region', e?.target?.value)}
                  className={`w-full px-3 py-2 border ${errors?.region ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select Region</option>
                  {Object.entries(pngRegions)?.map(([key, region]) => (
                    <option key={key} value={key}>{region?.name}</option>
                  ))}
                </select>
                {errors?.region && <p className="text-red-500 text-xs mt-1">{errors?.region}</p>}
              </div>

              {/* Province */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData?.province}
                  onChange={(e) => handleInputChange('province', e?.target?.value)}
                  disabled={!formData?.region}
                  className={`w-full px-3 py-2 border ${errors?.province ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  <option value="">Select Province</option>
                  {availableProvinces?.map(([key, province]) => (
                    <option key={key} value={key}>{province?.name}</option>
                  ))}
                </select>
                {errors?.province && <p className="text-red-500 text-xs mt-1">{errors?.province}</p>}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData?.district}
                  onChange={(e) => handleInputChange('district', e?.target?.value)}
                  disabled={!formData?.province}
                  className={`w-full px-3 py-2 border ${errors?.district ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  <option value="">Select District</option>
                  {availableDistricts?.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {errors?.district && <p className="text-red-500 text-xs mt-1">{errors?.district}</p>}
              </div>

              {/* Facility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData?.facility}
                  onChange={(e) => handleInputChange('facility', e?.target?.value)}
                  placeholder="e.g., Mount Hagen General Hospital"
                  className={`w-full px-3 py-2 border ${errors?.facility ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors?.facility && <p className="text-red-500 text-xs mt-1">{errors?.facility}</p>}
              </div>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 font-medium">
              <Package className="w-5 h-5" />
              <span>Equipment Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Equipment Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData?.equipment}
                  onChange={(e) => handleInputChange('equipment', e?.target?.value)}
                  placeholder="e.g., Vaccine Refrigerator VR-450"
                  className={`w-full px-3 py-2 border ${errors?.equipment ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors?.equipment && <p className="text-red-500 text-xs mt-1">{errors?.equipment}</p>}
              </div>

              {/* Equipment ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData?.equipmentId}
                  onChange={(e) => handleInputChange('equipmentId', e?.target?.value)}
                  placeholder="e.g., VR-450-2023-001"
                  className={`w-full px-3 py-2 border ${errors?.equipmentId ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors?.equipmentId && <p className="text-red-500 text-xs mt-1">{errors?.equipmentId}</p>}
              </div>
            </div>
          </div>

          {/* Fault Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fault Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData?.faultDescription}
              onChange={(e) => handleInputChange('faultDescription', e?.target?.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className={`w-full px-3 py-2 border ${errors?.faultDescription ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors?.faultDescription && <p className="text-red-500 text-xs mt-1">{errors?.faultDescription}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters ({formData?.faultDescription?.length}/10)
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['high', 'medium', 'low']?.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleInputChange('priority', priority)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    formData?.priority === priority
                      ? priority === 'high' ? 'border-red-500 bg-red-50 text-red-700' :
                        priority === 'medium'? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-blue-500 bg-blue-50 text-blue-700' :'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium capitalize">{priority}</div>
                  <div className="text-xs mt-1">
                    {priority === 'high' && 'Immediate attention required'}
                    {priority === 'medium' && 'Address within 48 hours'}
                    {priority === 'low' && 'Routine maintenance'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketCreationModal;