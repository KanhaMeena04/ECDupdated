import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Tabs, Tab } from "@mui/material";
import { User, FileText, Landmark } from "lucide-react";
import { useParams } from "react-router-dom";

import { useRiderDetails, useUpdateRider } from "../../api/driver";

// Import your actual forms
import EditRiderForm from "./EditRiderForm";
import EditRiderDocumentForm from "./EditRiderDocument";
import EditRiderBankDetailsForm from "./EditRiderBankDetails";

// Default empty form structure
const EMPTY_FORM = {
  name: "",
  email: "",
  mobile: "",
  profilePic: "",
  address: { street: "", city: "", state: "", country: "", zipCode: "" },
  workCity: "",
  workZone: "",
  vehicle: { type: "bike", model: "", number: "", vehicleVerified: false, approvalStatus: "pending" },
  documents: {
    license: { number: "", frontImage: "", backImage: "" },
    rc: { number: "", image: "", expiryDate: "" },
    insurance: { number: "", image: "", expiryDate: "" },
    medicalCertificate: "",
    gst: ""
  },
  bankDetails: {
    accountName: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    branchAddress: "",
    swiftCode: "",
    routingNumber: ""
  },
};

const EditRiderWrapper = () => {
  const params = useParams();
  const riderId = useMemo(() => params.riderId ?? params.id ?? null, [params]);

  // ✅ Hooks must be unconditional
  const { rider, loading: fetchLoading, error } = useRiderDetails(riderId);
  const { updateRider, loading: updateLoading } = useUpdateRider();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(EMPTY_FORM);

  /* ----------------------------
     MAP BACKEND → FORM STATE
  ----------------------------- */
  useEffect(() => {
    if (!rider) return;

    setFormData({
      // USER
      name: rider.user?.name ?? "",
      email: rider.user?.email ?? "",
      mobile: rider.user?.mobile ?? "",
      profilePic: rider.user?.profilePic ?? "",

      // ADDRESS
      address: {
        street: rider.address?.street ?? "",
        city: rider.address?.city ?? "",
        state: rider.address?.state ?? "",
        country: rider.address?.country ?? "",
        zipCode: rider.address?.zipCode ?? "",
      },

      // WORK LOCATION
      workCity: rider.workCity ?? "",
      workZone: rider.workZone ?? "",

      // VEHICLE
      vehicle: {
        type: rider.vehicle?.type ?? "bike",
        model: rider.vehicle?.model ?? "",
        number: rider.vehicle?.number ?? "",
        vehicleVerified: rider.vehicle?.vehicleVerified ?? false,
        approvalStatus: rider.vehicle?.vehicleApproval?.status ?? "pending",
      },

      // DOCUMENTS
      documents: {
        license: {
          number: rider.documents?.license?.number ?? "",
          frontImage: rider.documents?.license?.frontImage ?? "",
          backImage: rider.documents?.license?.backImage ?? "",
        },
        rc: {
          number: rider.documents?.rc?.number ?? "",
          image: rider.documents?.rc?.image ?? "",
          expiryDate: rider.documents?.rc?.expiryDate ?? "",
        },
        insurance: {
          number: rider.documents?.insurance?.number ?? "",
          image: rider.documents?.insurance?.image ?? "",
          expiryDate: rider.documents?.insurance?.expiryDate ?? "",
        },
        medicalCertificate: rider.documents?.medicalCertificate ?? "",
        gst: rider.documents?.gst ?? "",
      },

      // BANK DETAILS
      bankDetails: {
        accountName: rider.bankDetails?.accountName ?? "",
        accountNumber: rider.bankDetails?.accountNumber ?? "",
        bankName: rider.bankDetails?.bankName ?? "",
        branchName: rider.bankDetails?.branchName ?? "",
        branchAddress: rider.bankDetails?.branchAddress ?? "",
        swiftCode: rider.bankDetails?.swiftCode ?? "",
        routingNumber: rider.bankDetails?.routingNumber ?? "",
      },
    });
  }, [rider]);

  /* ----------------------------
     HANDLERS
  ----------------------------- */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleNestedChange = useCallback((parent, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value },
    }));
  }, []);

  const submitUpdate = async () => {
    await updateRider(riderId, formData);
  };

  /* ----------------------------
     GUARDS
  ----------------------------- */
  if (!riderId)
    return <div className="p-10 text-red-600 font-bold">Rider ID missing in route</div>;

  if (fetchLoading) return <div className="p-10">Loading rider...</div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;

  /* ----------------------------
     UI
  ----------------------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto bg-white rounded-md shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-4 bg-gray-50/50">
          <Tabs
            value={activeStep}
            onChange={(_, v) => setActiveStep(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<User size={18} />} iconPosition="start" label="Driver Details" />
            <Tab icon={<FileText size={18} />} iconPosition="start" label="Documents" />
            <Tab icon={<Landmark size={18} />} iconPosition="start" label="Bank Details" />
          </Tabs>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {activeStep === 0 && (
            <EditRiderForm
              formData={formData}
              handleChange={handleChange}
              handleNestedChange={handleNestedChange}
              nextStep={() => setActiveStep(1)}
            />
          )}

          {activeStep === 1 && (
            <EditRiderDocumentForm
              prevStep={() => setActiveStep(0)}
              loading={updateLoading}
              documents={formData.documents}
              handleNestedChange={handleNestedChange}
            />
          )}

          {activeStep === 2 && (
            <EditRiderBankDetailsForm
              prevStep={() => setActiveStep(1)}
              loading={updateLoading}
              bankDetails={formData.bankDetails}
              handleNestedChange={handleNestedChange}
              submitRider={submitUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditRiderWrapper;
