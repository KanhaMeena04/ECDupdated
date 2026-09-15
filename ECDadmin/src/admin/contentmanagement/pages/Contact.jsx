import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import TextEditor from '../components/TextEditor';
import { useTermsConditions } from '../../api/contentmanagement'; // reuse pattern

function Contact() {
  const {
    terms,
    loading,
    error,
    fetchTermsAdmin,
    updateTerms,
  } = useTermsConditions(); // backend should map this to contact page

  useEffect(() => {
    fetchTermsAdmin();
  }, [fetchTermsAdmin]);

  const handleSave = async (content) => {
    await updateTerms({ content });
    alert('Contact page updated successfully!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Contact"
        breadcrumbs={[
          { label: "Contents" },
          { label: "Contact", active: true }
        ]}
      />

      <TextEditor
        title="Contact Information & Instructions"
        initialValue={terms?.content || ""}
        onSave={handleSave}
      />
    </div>
  );
}

export default Contact;
