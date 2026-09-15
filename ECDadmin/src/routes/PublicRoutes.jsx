import { Routes, Route } from "react-router-dom";
import { lazy } from "react";

const AdminLogin = lazy(() => import("../admin/pages/AdminLogin"));
// later:
// const UserLogin = lazy(() => import("../user/pages/Login"));
// const RiderLogin = lazy(() => import("../rider/pages/Login"));

const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
    </Routes>
  );
};

export default PublicRoutes;
