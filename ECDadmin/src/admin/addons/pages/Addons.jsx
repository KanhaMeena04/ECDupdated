import React from 'react';
import { IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import PageActionBar from '../../components/PageActionBar';
import PageHeader from '../../components/PageHeader';
import RestaurantTable from '../../components/RestaurantTable';
import { useAddons, useDeleteAddon } from '../../api/addons';

function Addons() {
  const navigate = useNavigate();
  const { addons, loading } = useAddons();
  const { deleteAddon } = useDeleteAddon();

  const columns = [
    { key: 'sr', label: '#' },

    { key: 'restaurant', label: 'Restaurant' },

    { key: 'name', label: 'Addon Name' },

    { key: 'price', label: 'Price' },

    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <>
          <IconButton
            onClick={() => navigate(`/edit-addon/${row._id}`)}
            color="primary"
          >
            <Edit />
          </IconButton>

          <IconButton
            onClick={() => deleteAddon(row._id)}
            color="error"
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  const rows = addons.map((addon) => ({
    ...addon,
    restaurant:
      typeof addon.restaurant?.name === 'string'
        ? addon.restaurant.name
        : addon.restaurant?.name?.en || '—',
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Addons List"
        breadcrumbs={[
          { label: 'Addons' },
          { label: 'Addons List', active: true },
        ]}
      />

      <PageActionBar
        actionLabel="Add Addon"
        onButtonClick={() => navigate('/add-addon')}
        searchLabel="Search"
        buttonLabel="Add Addons"
      />

      <RestaurantTable
        columns={columns}
        rows={rows}
      />
    </div>
  );
}

export default Addons;
