import React, { useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { useCuisine } from '../../api/cuisine.js';

const CuisineList = () => {
  const { cuisines, loading, fetchCuisines } = useCuisine();

  useEffect(() => {
    fetchCuisines();
  }, [fetchCuisines]);

  const columns = [
    { 
      field: 'name', 
      headerName: 'Name',
      render: (value) => (
        <span className="font-medium text-gray-700">{value}</span>
      )
    }
  ];

  return (
    <div className="p-6">
      <DataTable
        title="Cuisine"
        columns={columns}
        data={cuisines}
        loading={loading}
        onEdit={(row) => console.log("Edit", row)}
        onDelete={(row) => console.log("Delete", row)}
      />
    </div>
  );
};

export default CuisineList;
