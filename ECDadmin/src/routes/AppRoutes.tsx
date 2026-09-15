import { LocalizationProvider } from "@mui/x-date-pickers";
import AdminRoutes from "../admin/route/AdminRoutes";
import PublicRoutes from "./PublicRoutes";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
const AppRoutes = () => {
  return (
    
     <LocalizationProvider dateAdapter={AdapterDayjs}>
      <PublicRoutes/>
      <AdminRoutes />
    
      
      {/* <UserRoutes />
      <RiderRoutes /> */}
    </LocalizationProvider>
  );
};

export default AppRoutes;
