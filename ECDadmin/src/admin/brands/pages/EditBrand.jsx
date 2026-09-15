import React from "react";
import PageHeader from "../../components/PageHeader";
import EditBrandForm from "../components/EditBrandForm";

const EditBrand = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Edit Brand"
          breadcrumbs={[
            { label: "Brands" },
            { label: "Edit Brand", active: true },
          ]}
        />

        <div className="flex justify-between items-center mb-8 border-b border-gray-100">
        </div>

        <EditBrandForm />
      </div>
    </div>
  );
};

export default EditBrand;
