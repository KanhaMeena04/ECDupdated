import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import PageActionBar from "../../components/PageActionBar"
import BrandTable from '../components/BrandTable';
const BrandList = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
	   <PageHeader
				title="Brands List"
				breadcrumbs={[
				  { label: "Brand List" },
				  { label: "Brands", active: true }
				]}
				/>
      
            <PageActionBar
                  buttonLabel="Add Brand"   
                  onButtonClick={() => navigate("/add-brand")} 
                  searchLabel="Search"
            />

<BrandTable/>
    
    </div>
  );
};

export default BrandList;