import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import TextEditor from '../components/TextEditor';
import { useTermsConditions } from '../../api/contentmanagement'; // reuse pattern
import toast from 'react-hot-toast';

function TermsAndConditions() {
  const {
    terms,
    loading,
    error,
    fetchTermsAdmin,
    updateTerms,
  } = useTermsConditions();

  useEffect(() => {
    fetchTermsAdmin();
  }, [fetchTermsAdmin]);

  const handleSave = async (content) => {
    await updateTerms({ content });
    toast.success('Terms & Conditions updated successfully!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Terms and Conditions"
        breadcrumbs={[
          { label: "Contents" },
          { label: "Terms and Conditions", active: true }
        ]}
      />

      <TextEditor
        title="Terms and Conditions"
        initialValue={terms?.content || ""}
        onSave={handleSave}
      />
    </div>
  );
}

export default TermsAndConditions;
