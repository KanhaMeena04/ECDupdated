import { useState } from "react";
import { TextField, MenuItem, Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "../../api/vehicle.js";
import { Image as ImageIcon, CloudUpload as UploadIcon } from "@mui/icons-material";

// BRAND CONSTANTS
const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

const AddVehicleForm = () => {
  const navigate = useNavigate();
  const { addVehicle, loading } = useVehicles();

  const [form, setForm] = useState({
    name: "",
    vehicleNumber: "",
    status: "active",
    insuranceNumber: "",
    rcNumber: "",
    insuranceExpiry: "",
    rcExpiry: "",
    vehicleImage: null,
    insuranceImage: null,
    rcImage: null,
  });

  const [preview, setPreview] = useState({
    vehicleImage: null,
    insuranceImage: null,
    rcImage: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({ ...prev, [field]: file }));
    setPreview((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      await addVehicle(formData);
      navigate("/vehicle-list");
    } catch (err) {
      console.error("Error adding vehicle:", err);
    }
  };

  // 🔹 Updated Reusable File Upload Field with Branding
  const FileUploadField = ({ label, field, previewUrl }) => (
    <div className="flex flex-col w-full">
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-center gap-4 p-3 rounded-lg border border-dashed border-gray-300 hover:border-red-400 transition-colors bg-gray-50">
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon sx={{ color: 'divider' }} />
          )}
        </div>
        <div className="relative flex-grow">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={(e) => handleFileChange(e, field)}
          />
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm font-medium truncate max-w-[180px]">
              {form[field]?.name || "Upload Document"}
            </span>
            <span className="text-[10px] font-black" style={{ color: BRAND_MAIN }}>
              CLICK TO BROWSE
            </span>
          </div>
        </div>
        <UploadIcon sx={{ color: 'divider', fontSize: 20 }} />
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-white min-h-screen rounded-xl shadow-sm border border-gray-100">
      <Box className="mb-8">
        <Typography variant="h5" fontWeight={900} sx={{ color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: -0.5 }}>
          Vehicle Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Register a new vehicle to the delivery fleet
        </Typography>
      </Box>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
          <div className="space-y-6">
            <TextField
              label="Vehicle Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
            />

            <TextField
              select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>

            <TextField
              label="RC Number"
              name="rcNumber"
              value={form.rcNumber}
              onChange={handleChange}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
            />

            <TextField
              type="date"
              label="RC Expiry Date"
              name="rcExpiry"
              value={form.rcExpiry}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
            />

            <FileUploadField
              label="Insurance Document"
              field="insuranceImage"
              previewUrl={preview.insuranceImage}
            />
          </div>

          <div className="space-y-6">
            <TextField
              label="Vehicle Plate Number"
              name="vehicleNumber"
              value={form.vehicleNumber}
              onChange={handleChange}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
            />

            <TextField
              label="Insurance Number"
              name="insuranceNumber"
              value={form.insuranceNumber}
              onChange={handleChange}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
            />

            <TextField
              type="date"
              label="Insurance Expiry Date"
              name="insuranceExpiry"
              value={form.insuranceExpiry}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
            />

            <FileUploadField
              label="Vehicle Side View Image"
              field="vehicleImage"
              previewUrl={preview.vehicleImage}
            />

            <FileUploadField
              label="Registration (RC) Image"
              field="rcImage"
              previewUrl={preview.rcImage}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: BRAND_MAIN,
              '&:hover': { backgroundColor: '#c41a1f' },
              px: 8,
              py: 1.5,
              fontWeight: 'bold',
              fontSize: '1rem',
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(237, 32, 38, 0.2)'
            }}
          >
            {loading ? "Processing..." : "Register Vehicle"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddVehicleForm;

























// import { useState } from "react";
// import { TextField, MenuItem, Button } from "@mui/material";
// import { useNavigate } from "react-router-dom";
// import { useVehicles } from "../../api/vehicle.js";
// import { Image as ImageIcon } from "@mui/icons-material";

// // 🔹 Convert File to Base64
// const fileToBase64 = (file) =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = (err) => reject(err);
//   });

// const AddVehicleForm = () => {
//   const navigate = useNavigate();
//   const { addVehicle, loading } = useVehicles();

//   const [form, setForm] = useState({
//     name: "",
//     vehicleNumber: "",
//     status: "active",
//     insuranceNumber: "",
//     rcNumber: "",
//     insuranceExpiry: "",
//     rcExpiry: "",
//     vehicleImage: null,
//     insuranceImage: null,
//     rcImage: null,
//   });

//   const [preview, setPreview] = useState({
//     vehicleImage: null,
//     insuranceImage: null,
//     rcImage: null,
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e, field) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setForm((prev) => ({ ...prev, [field]: file }));
//     setPreview((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
//   };

//  const handleSubmit = async (e) => {
//   e.preventDefault();
//   try {
//     const formData = new FormData();
//     Object.entries(form).forEach(([key, value]) => {
//       if (value) formData.append(key, value); // value can be File or string
//     });

//     await addVehicle(formData); // hook handles multipart/form-data
//     navigate("/vehicle-list");
//   } catch (err) {
//     console.error("Error adding vehicle:", err);
//   }
// };


//   // 🔹 Reusable File Upload Field Component
//   const FileUploadField = ({ label, field, previewUrl }) => (
//     <div className="flex flex-col w-full">
//       <label className="text-sm text-gray-500 mb-1">{label}</label>
//       <div className="flex items-center gap-4">
//         <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden border">
//           {previewUrl ? (
//             <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
//           ) : (
//             <ImageIcon className="text-gray-400" />
//           )}
//         </div>
//         <div className="relative flex-grow">
//           <input
//             type="file"
//             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
//             onChange={(e) => handleFileChange(e, field)}
//           />
//           <div className="border rounded flex items-center justify-between px-3 py-2 bg-white">
//             <span className="text-gray-400 text-sm truncate">
//               {form[field]?.name || "Choose a file or drop it here..."}
//             </span>
//             <span className="text-xs font-bold text-gray-400 border-l pl-2">
//               Browse
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-4 bg-white min-h-screen">
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
//           <div className="space-y-6">
//             <TextField
//               label="Vehicle Name"
//               name="name"
//               value={form.name}
//               onChange={handleChange}
//               fullWidth
//               size="small"
//             />

//             <TextField
//               select
//               label="Status"
//               name="status"
//               value={form.status}
//               onChange={handleChange}
//               fullWidth
//               size="small"
//             >
//               <MenuItem value="active">Active</MenuItem>
//               <MenuItem value="inactive">Inactive</MenuItem>
//             </TextField>

//             <TextField
//               label="RC No"
//               name="rcNumber"
//               value={form.rcNumber}
//               onChange={handleChange}
//               fullWidth
//               size="small"
//             />

//             <TextField
//               type="date"
//               label="RC Expiry Date"
//               name="rcExpiry"
//               value={form.rcExpiry}
//               onChange={handleChange}
//               fullWidth
//               size="small"
//               InputLabelProps={{ shrink: true }}
//             />

//             <FileUploadField
//               label="Insurance Image"
//               field="insuranceImage"
//               previewUrl={preview.insuranceImage}
//             />
//           </div>

//           <div className="space-y-6">
//             <TextField
//               label="Vehicle No"
//               name="vehicleNumber"
//               value={form.vehicleNumber}
//               onChange={handleChange}
//               fullWidth
//               size="small"
//             />

//             <TextField
//               label="Insurance No"
//               name="insuranceNumber"
//               value={form.insuranceNumber}
//               onChange={handleChange}
//               fullWidth
//               size="small"
//             />

//             <TextField
//               type="date"
//               label="Insurance Expiry Date"
//               name="insuranceExpiry"
//               value={form.insuranceExpiry}
//               onChange={handleChange}
//               fullWidth
//               size="small"
//               InputLabelProps={{ shrink: true }}
//             />

//             <FileUploadField
//               label="Vehicle Image"
//               field="vehicleImage"
//               previewUrl={preview.vehicleImage}
//             />

//             <FileUploadField
//               label="RC Image"
//               field="rcImage"
//               previewUrl={preview.rcImage}
//             />
//           </div>
//         </div>

//         <div className="pt-4">
//           <Button
//             type="submit"
//             variant="contained"
//             disabled={loading}
//             className="!bg-teal-600 !px-10 !py-2"
//           >
//             {loading ? "Saving..." : "Save"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default AddVehicleForm;

// git remote add origin https://github.com/ITKHUSHI/FPF.git