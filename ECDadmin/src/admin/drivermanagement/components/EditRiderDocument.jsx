import React, { useState, useEffect } from 'react';
import { Button, Grid, TextField, Box, Typography } from '@mui/material';
import { Image as ImageIcon, ChevronRight } from 'lucide-react';

const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

const FILE_FIELDS = [
  { key: 'gst', label: 'GST Registration' },
  { key: 'insurance', label: 'Driver Insurance Policy' },
  { key: 'medicalCertificate', label: 'Medical Fitness Certificate' },
  { key: 'licenseFront', label: 'Driver License (Front)' },
  { key: 'licenseBack', label: 'Driver License (Back)' },
];

const EditRiderDocumentForm = ({ prevStep, nextStep, loading, documents, handleNestedChange }) => {
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    const newPreviews = {};
    if (!documents) return;

    Object.keys(documents).forEach((key) => {
      const file = documents[key];
      
      if (file instanceof File) {
        newPreviews[key] = URL.createObjectURL(file);
      } else if (typeof file === 'string' && file.length > 0) {
        newPreviews[key] = file;
      } else if (documents.license && (key === 'licenseFront' || key === 'licenseBack')) {
        const field = key === 'licenseFront' ? 'frontImage' : 'backImage';
        const licenseImg = documents.license[field];
        if (licenseImg instanceof File) {
            newPreviews[key] = URL.createObjectURL(licenseImg);
        } else if (typeof licenseImg === 'string') {
            newPreviews[key] = licenseImg;
        }
      } else if (documents.insurance && key === 'insurance') {
        const insImg = documents.insurance.image;
        if (insImg instanceof File) {
            newPreviews[key] = URL.createObjectURL(insImg);
        } else if (typeof insImg === 'string') {
            newPreviews[key] = insImg;
        }
      }
    });

    setPreviews(newPreviews);

    return () => {
      Object.values(newPreviews).forEach(url => {
        if (typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [documents]);

  const handleFileChange = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (key === 'licenseFront' || key === 'licenseBack') {
      handleNestedChange('documents', 'license', {
        ...documents.license,
        [key === 'licenseFront' ? 'frontImage' : 'backImage']: file
      });
    } else if (key === 'insurance') {
      handleNestedChange('documents', 'insurance', {
        ...documents.insurance,
        image: file
      });
    } else {
      handleNestedChange('documents', key, file);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100">
      <div className="mb-8 border-l-4 pl-4" style={{ borderColor: BRAND_MAIN }}>
        <h2 className="text-lg font-black text-gray-800 uppercase">Documents</h2>
      </div>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6} className="space-y-6">
          {FILE_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                  {previews[key] ? (
                    <img src={previews[key]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={18} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-grow">
                   <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none', borderColor: '#e2e8f0', color: '#64748b' }}
                  >
                    {documents[key]?.name ? documents[key].name : "Choose File"}
                    <input type="file" hidden accept="image/*,.pdf" onChange={(e) => handleFileChange(key, e)} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ p: 3, bgcolor: BRAND_BG_LIGHT, borderRadius: '12px' }}>
             <Typography variant="caption" fontWeight={900} color={BRAND_MAIN} sx={{ mb: 2, display: 'block' }}>
               INSURANCE EXPIRY
             </Typography>
             <TextField
                fullWidth type="date" variant="outlined" size="small"
                value={documents?.insurance?.expiryDate?.split('T')[0] || ''}
                onChange={(e) => handleNestedChange('documents', 'insurance', { ...documents.insurance, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: 'white' }}
              />
          </Box>
        </Grid>
      </Grid>

      {/* FOOTER ACTIONS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 4, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={prevStep} variant="text" sx={{ color: 'gray', fontWeight: 'bold' }}>
          Back
        </Button>

        <Button 
          onClick={()=>nextStep} // ✅ This now points to setActiveStep(2)
          variant="contained" 
          sx={{ 
            backgroundColor: BRAND_MAIN, 
            '&:hover': { backgroundColor: '#c41a1f' }, 
            px: 4, borderRadius: '8px', fontWeight: 'bold' 
          }}
        >
          Next <ChevronRight size={18} className="ml-1" />
        </Button>
      </Box>
    </div>
  );
};

export default EditRiderDocumentForm;