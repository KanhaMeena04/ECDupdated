// import React from "react";
// import { Stepper, Step, StepLabel, Button, TextField } from "@mui/material";
// import { Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";

// const RiderDocumentForm = ({
//   formData,
//   handleDocumentChange,
//   nextStep,
//   prevStep,
// }) => {
//   const steps = ["Driver Details", "Document Settings", "Bank Details"];
//   const activeStep = 1;

//   const documentFields = [
//     { id: "gst", label: "GST" },
//     { id: "insurance", label: "Driver Insurance", hasExpiry: true },
//     { id: "medical", label: "Medical Certificate" },
//     { id: "license", label: "License Front" },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-6xl mx-auto mb-10">
//         <Stepper activeStep={activeStep}>
//           {steps.map((label) => (
//             <Step key={label}>
//               <StepLabel>{label}</StepLabel>
//             </Step>
//           ))}
//         </Stepper>
//       </div>

//       <div className="max-w-6xl mx-auto bg-white rounded-lg p-8 shadow-sm">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
//           {documentFields.map((doc) => (
//             <React.Fragment key={doc.id}>
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium text-gray-600">
//                   {doc.label}
//                 </label>

//                 <input
//                   type="file"
//                   onChange={(e) =>
//                     handleDocumentChange(
//                       doc.id,
//                       e.target.files[0],
//                       doc.hasExpiry
//                         ? formData.documents.insurance.expiry
//                         : ""
//                     )
//                   }
//                 />

//                 <div className="mt-3 w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
//                   <ImageIcon className="text-gray-400 w-10 h-10" />
//                 </div>
//               </div>

//               <div className="flex flex-col justify-start pt-7">
//                 {doc.hasExpiry && (
//                   <TextField
//                     type="date"
//                     value={formData.documents.insurance.expiry}
//                     onChange={(e) =>
//                       handleDocumentChange(
//                         "insurance",
//                         formData.documents.insurance.file,
//                         e.target.value
//                       )
//                     }
//                   />
//                 )}
//               </div>
//             </React.Fragment>
//           ))}
//         </div>

//         <div className="mt-12 flex justify-between border-t pt-6">
//           <Button onClick={prevStep} startIcon={<ChevronLeft />}>
//             Previous
//           </Button>
//           <Button onClick={nextStep} endIcon={<ChevronRight />}>
//             Next
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RiderDocumentForm;


import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

const RiderDocumentForm = ({ nextStep, prevStep }) => {
  const [formData, setFormData] = useState({
    documents: {},
  });

  const documentFields = [
    { id: "gst", label: "GST" },
    { id: "insurance", label: "Driver Insurance", hasExpiry: true },
    { id: "medical", label: "Medical Certificate" },
    { id: "licenseFront", label: "License Front" },
    { id: "licenseBack", label: "License Back" },
  ];

  const handleDocumentChange = async (docId, file, expiry) => {
    if (!file) return;
    const base64String = await fileToBase64(file);
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docId]: {
          file: base64String,
          name: file.name,
          expiry: expiry || "",
        },
      },
    }));
  };

  return (
    <div className="min-h-screen bg-white p-4 font-sans">
      <h2 className="text-lg font-medium mb-6">Document Settings</h2>

      {documentFields.map((doc) => (
        <div key={doc.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-gray-500 uppercase">{doc.label}</label>
            <div className="relative flex items-center border border-gray-300 rounded-sm h-10 overflow-hidden">
              <span className="flex-grow px-3 text-sm text-gray-400">
                {formData.documents?.[doc.id]?.name ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    ✅ {formData.documents[doc.id].name}
                  </span>
                ) : (
                  "No file chosen"
                )}
              </span>
              <label className="bg-gray-50 border-l border-gray-300 px-4 h-full flex items-center text-xs text-gray-600 cursor-pointer hover:bg-gray-100">
                Browse
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    handleDocumentChange(
                      doc.id,
                      e.target.files[0],
                      doc.hasExpiry ? formData.documents?.[doc.id]?.expiry : ""
                    )
                  }
                />
              </label>
            </div>
          </div>

          {doc.hasExpiry && (
            <div className="pt-7">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase opacity-0">
                  Placeholder
                </label>
                <div className="relative flex items-center border border-gray-300 rounded-sm h-10 px-3">
                  <Calendar size={16} className="text-gray-400 mr-2" />
                  <input
                    type="date"
                    className="w-full text-sm text-gray-500 outline-none bg-transparent"
                    value={formData.documents?.[doc.id]?.expiry || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          [doc.id]: {
                            ...prev.documents?.[doc.id],
                            expiry: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="mt-12 flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-2 border border-gray-300 rounded text-gray-600 text-sm hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={() => nextStep(formData)}
          className="px-8 py-2 bg-[#00A982] text-white rounded text-sm font-medium hover:bg-[#008f6e]"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default RiderDocumentForm;
