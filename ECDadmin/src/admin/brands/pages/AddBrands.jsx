import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import AddBrandForm from '../components/AddBrandForm';
const AddBrand = () => {


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* White Container Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-7xl mx-auto relative">
        
           <PageHeader
						title="Add Brands"
						breadcrumbs={[
						  { label: "Brands" },
						  { label: "Add Brands", active: true }
						]}
						/>
        <div className="flex justify-between items-center mb-8 border-b border-gray-100">

        </div>
      
                <AddBrandForm/>


      </div>
    </div>
  );
};

export default AddBrand;