import React from 'react';
import PageHeader from '../../components/PageHeader';
import AddCuisineForm from '../components/AddCuisineForm';

function AddCuisine() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Add Cuisine"
        breadcrumbs={[
          { label: "Cuisines" },
          { label: "Add Cuisine", active: true }
        ]}
      />

      <AddCuisineForm />
    </div>
  );
}

export default AddCuisine;
