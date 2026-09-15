import React, { useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import TextEditor from '../components/TextEditor';
import { usePrivacyPolicy } from '../../api/contentmanagement'; // reuse pattern
import toast from 'react-hot-toast';

function PrivacyPolicy() {
  const {
    policy,
    loading,
    error,
    fetchPolicyAdmin,
    updatePolicy,
  } = usePrivacyPolicy();

  useEffect(() => {
    fetchPolicyAdmin();
  }, [fetchPolicyAdmin]);

  const handleSave = async (content) => {
    await updatePolicy({ content });
    toast.success('Privacy Policy updated successfully!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Privacy Policy"
        breadcrumbs={[
          { label: "Contents" },
          { label: "Privacy Policy", active: true }
        ]}
      />

      <TextEditor
        title="Privacy Policy"
        initialValue={policy?.content || ""}
        onSave={handleSave}
      />
    </div>
  );
}

export default PrivacyPolicy;
