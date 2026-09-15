import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import PageActionBar from '../../components/PageActionBar';
import FAQForm from '../components/FAQForm';
import FAQTable from '../components/FAQTable';
import EditFAQForm from '../components/EditFAQForm';
import { useFAQs } from '../../api/contentmanagement';

function FAQ() {
  const {
    faqs,
    loading,
    fetchFAQsAdmin,
    createFAQ,
    updateFAQ,
    deleteFAQ,
  } = useFAQs();

  const [currentView, setCurrentView] = useState('list');
  const [activeData, setActiveData] = useState(null);

  useEffect(() => {
    fetchFAQsAdmin();
  }, [fetchFAQsAdmin]);

  const handleSaveNewFAQ = async (data) => {
    await createFAQ(data);
    await fetchFAQsAdmin();
    setCurrentView('list');
  };

  const handleUpdateFAQ = async (data) => {
    await updateFAQ(activeData._id, data);
    await fetchFAQsAdmin();
    setCurrentView('list');
  };

  const handleDeleteFAQ = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    await deleteFAQ(id);
    await fetchFAQsAdmin();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="FAQ"
        breadcrumbs={[
          { label: "Contents" },
          { label: "FAQ Contents", active: true }
        ]}
      />

      {currentView === 'list' && (
        <PageActionBar
          buttonLabel="Add FAQ"
          onButtonClick={() => setCurrentView('add')}
        />
      )}

      <div className="mt-4">
        {currentView === 'list' && (
          <FAQTable
            faqs={faqs}
            loading={loading}
            onEditClick={(faq) => {
              setActiveData(faq);
              setCurrentView('edit');
            }}
            onDeleteClick={handleDeleteFAQ}
          />
        )}

        {currentView === 'add' && (
          <FAQForm
            onSave={handleSaveNewFAQ}
            onCancel={() => setCurrentView('list')}
          />
        )}

        {currentView === 'edit' && (
          <EditFAQForm
            initialData={activeData}
            onSave={handleUpdateFAQ}
            onCancel={() => setCurrentView('list')}
          />
        )}
      </div>
    </div>
  );
}

export default FAQ;
