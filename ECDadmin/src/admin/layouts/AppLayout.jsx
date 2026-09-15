// layouts/AppLayout.jsx
// layouts/AppLayout.tsx
import * as React from "react";
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import SideMenu from "../components/SideMenu";
import AppNavbar from "../components/AppNavbar";
import Header from "../components/Header";

export default function AppLayout() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen) => () => setOpen(newOpen);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideMenu />
      <AppNavbar open={open} toggleDrawer={toggleDrawer} />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Stack sx={{ mx: 3, mt: 8 }}>
          <Header onToggleDashboard={toggleDrawer(true)} />

          {/* 👇 PAGE CONTENT COMES HERE */}
          <Outlet />
        </Stack>
      </Box>
    </Box>
  );
}
