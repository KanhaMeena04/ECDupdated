import React, { useState } from "react";
import {
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Paper,
  Typography,
  Alert,
  Box
} from "@mui/material";
import { useAddCity } from "../../api/city"; // adjust path if needed

// BRAND CONSTANTS
const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

const AddCityForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    country: "",
    isActive: true,
    isDefault: false,
  });

  const { addCity, status } = useAddCity();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await addCity(formData);

    if (success) {
      setFormData({
        name: "",
        state: "",
        country: "",
        isActive: true,
        isDefault: false,
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Paper 
        elevation={0}
        className="w-full max-w-md p-8 shadow-xl border-t-4"
        sx={{ 
          borderRadius: 4, 
          borderTopColor: BRAND_MAIN,
          backgroundColor: "#ffffff"
        }}
      >
        <Typography variant="h5" className="font-bold text-gray-800 mb-2">
          Add New City
        </Typography>
        <Typography variant="body2" className="text-gray-500 mb-6">
          Define a new operational service area
        </Typography>

        {status.msg && (
          <Alert 
            severity={status.type} 
            className="mb-6"
            sx={{ borderRadius: 2 }}
          >
            {status.msg}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* City Name */}
          <TextField
            fullWidth
            label="City Name"
            variant="outlined"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
            sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
          />

          {/* State */}
          <TextField
            fullWidth
            label="State"
            variant="outlined"
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
            required
            sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
          />

          {/* Country */}
          <TextField
            fullWidth
            label="Country"
            variant="outlined"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            required
            sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN }, "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN } }}
          />

          {/* Toggles */}
          <Box 
            className="flex flex-col sm:flex-row sm:justify-between gap-4 py-3 px-4 rounded-xl"
            sx={{ backgroundColor: BRAND_BG_LIGHT }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.checked,
                    })
                  }
                  sx={{
                    "& .Mui-checked": { color: BRAND_MAIN },
                    "& .Mui-checked + .MuiSwitch-track": {
                      backgroundColor: BRAND_MAIN,
                    },
                  }}
                />
              }
              label={<Typography variant="body2" fontWeight={600}>Active Status</Typography>}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isDefault: e.target.checked,
                    })
                  }
                  sx={{
                    "& .Mui-checked": { color: BRAND_MAIN },
                    "& .Mui-checked + .MuiSwitch-track": {
                      backgroundColor: BRAND_MAIN,
                    },
                  }}
                />
              }
              label={<Typography variant="body2" fontWeight={600}>Set as Default</Typography>}
            />
          </Box>

          {/* Submit Button */}
          <Button
            fullWidth
            type="submit"
            variant="contained"
            className="py-3 mt-4 normal-case text-lg font-bold"
            sx={{
              backgroundColor: BRAND_MAIN,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(237, 32, 38, 0.3)",
              "&:hover": {
                backgroundColor: "#c41a1f",
                boxShadow: "0 6px 16px rgba(237, 32, 38, 0.4)",
              },
            }}
          >
            Create City
          </Button>
        </form>
      </Paper>
    </div>
  );
};

export default AddCityForm;


















// import React, { useState } from "react";
// import {
//   TextField,
//   Switch,
//   FormControlLabel,
//   Button,
//   Paper,
//   Typography,
//   Alert,
// } from "@mui/material";
// import { useAddCity } from "../../api/city"; // adjust path if needed

// const AddCityForm = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     state: "",
//     country: "",
//     isActive: true,
//     isDefault: false,
//   });

//   const { addCity, status } = useAddCity();

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const success = await addCity(formData);

//     if (success) {
//       setFormData({
//         name: "",
//         state: "",
//         country: "",
//         isActive: true,
//         isDefault: false,
//       });
//     }
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
//       <Paper className="w-full max-w-md p-8 shadow-lg border-t-4">
//         <Typography variant="h5" className="font-bold text-gray-800 mb-6">
//           Add New City
//         </Typography>

//         {status.msg && (
//           <Alert severity={status.type} className="mb-4">
//             {status.msg}
//           </Alert>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* City Name */}
//           <TextField
//             fullWidth
//             label="City Name"
//             variant="outlined"
//             value={formData.name}
//             onChange={(e) =>
//               setFormData({ ...formData, name: e.target.value })
//             }
//             required
//           />

//           {/* State */}
//           <TextField
//             fullWidth
//             label="State"
//             variant="outlined"
//             value={formData.state}
//             onChange={(e) =>
//               setFormData({ ...formData, state: e.target.value })
//             }
//             required
//           />

//           {/* Country */}
//           <TextField
//             fullWidth
//             label="Country"
//             variant="outlined"
//             value={formData.country}
//             onChange={(e) =>
//               setFormData({ ...formData, country: e.target.value })
//             }
//             required
//           />

//           {/* Toggles */}
//           <div className="flex flex-col sm:flex-row sm:justify-between gap-4 py-2">
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={formData.isActive}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       isActive: e.target.checked,
//                     })
//                   }
//                   sx={{
//                     "& .Mui-checked": { color: "#991b1b" },
//                     "& .Mui-checked + .MuiSwitch-track": {
//                       backgroundColor: "#991b1b",
//                     },
//                   }}
//                 />
//               }
//               label="Active Status"
//             />

//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={formData.isDefault}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       isDefault: e.target.checked,
//                     })
//                   }
//                   sx={{
//                     "& .Mui-checked": { color: "#991b1b" },
//                     "& .Mui-checked + .MuiSwitch-track": {
//                       backgroundColor: "#991b1b",
//                     },
//                   }}
//                 />
//               }
//               label="Set as Default"
//             />
//           </div>

//           {/* Submit Button */}
//           <Button
//             fullWidth
//             type="submit"
//             variant="contained"
//             className=" py-3 mt-4 normal-case text-lg"
//             sx={{backgroundColor: '#248C70',}}
//           >
//             Create City
//           </Button>
//         </form>
//       </Paper>
//     </div>
//   );
// };

// export default AddCityForm;

