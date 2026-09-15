import React, { useState } from 'react';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import PageActionBar from '../../components/PageActionBar';
import PageHeader from '../../components/PageHeader';
import AddPromocodeForm from '../components/AddPromocodeForm';
import LanguageSwitcher from '../../components/LanguageSwitcher';
const AddPromoCodes = () => {

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="p-6 bg-gray-50 min-h-screen">
        <PageHeader
          title="Add Promocode "
          breadcrumbs={[
            { label: "Promocodes" },
            { label: "Add Promocode", active: true }
          ]}
        />

        <div className="mt-6">
          <LanguageSwitcher />
        </div>

        <div className="mt-6">
          <AddPromocodeForm />
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default AddPromoCodes;