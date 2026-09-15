import React from "react";
import AdminCreateRiderForm from "./AdminCreateRiderForm";
import RiderDocumentForm from "./RiderDocumentForm";
import RiderBankDetailsForm from "./RiderBankDetailsForm";
import { useCreateRider } from "../../api/driver.js";
const CreateRiderWrapper = () => {
  const {
    formData,
    activeStep,
    loading,
    status,
    handleChange,
    handleNestedChange,
    handleDocumentChange,
    nextStep,
    prevStep,
    submitRider,
  } = useCreateRider();

  switch (activeStep) {
    case 0:
      return (
        <AdminCreateRiderForm
          formData={formData}
          loading={loading}
          status={status}
          handleChange={handleChange}
          handleNestedChange={handleNestedChange}
          nextStep={nextStep}
        />
      );

    case 1:
      return (
        <RiderDocumentForm
          formData={formData}
          handleDocumentChange={handleDocumentChange}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      );

    case 2:
      return (
        <RiderBankDetailsForm
          formData={formData}
          handleNestedChange={handleNestedChange}
          prevStep={prevStep}
          submitRider={submitRider}
          loading={loading}
        />
      );

    default:
      return null;
  }
};

export default CreateRiderWrapper;
