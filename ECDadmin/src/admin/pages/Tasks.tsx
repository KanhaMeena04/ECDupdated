import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from '../components/AppNavbar';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import AppTheme from '../dashboard/shared-theme/AppTheme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../dashboard/theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const Tasks: React.FC = () => {
  return (
    <AppTheme themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu />
        <AppNavbar />
        {/* Main content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Box
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header 
              onToggleDashboard={undefined}
              showToggleButton={false}
            />
            {/* Blank content area */}
            <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
              <Paper sx={{ p: 8, backgroundColor: 'transparent' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  Tasks
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  This is the Tasks page. Content will be added here later.
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default Tasks;
