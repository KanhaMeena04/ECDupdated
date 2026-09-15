import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  Box,
  TextField,
  MenuItem,
  Select,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';
import { Translate } from '@mui/icons-material';

const CreateRoleForm = () => {
  const [tabValue, setTabValue] = useState(0);

  // Permission modules based on your screenshot
  const permissions = [
    "Dashboard", "Order", "Restaurant", "City", "Vehicle", 
    "Driver", "Document", "Promocode", "User", "Cuisines", 
    "Category", "Reports"
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Paper className="p-8 rounded-lg shadow-sm max-w-7xl mx-auto">
        {/* Language Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, val) => setTabValue(val)}
            TabIndicatorProps={{ className: "bg-[#248C70]" }}
          >
            <Tab 
              icon={<Translate fontSize="small" />} 
              iconPosition="start" 
              label="English" 
              className={tabValue === 0 ? "text-[#248C70]" : ""}
            />
            <Tab 
              icon={<Translate fontSize="small" />} 
              iconPosition="start" 
              label="Arabic" 
              className={tabValue === 1 ? "text-[#248C70]" : ""}
            />
          </Tabs>
        </Box>

        <form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            {/* Left side inputs */}
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500">New Role Name*</label>
                <TextField placeholder="Role Name" size="small" fullWidth />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500">Duplicate Role of</label>
                <Select displayEmpty size="small" fullWidth defaultValue="">
                  <MenuItem value="">Role Name</MenuItem>
                </Select>
              </div>
            </div>

            {/* Right side inputs */}
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500">Account Type*</label>
                <TextField placeholder="Role Type" size="small" fullWidth />
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="mt-8">
            <label className="text-sm text-gray-500 mb-2 block">Permissions*</label>
            <TableContainer component={Paper} variant="outlined" className="max-w-xl">
              <Table size="small">
                <TableHead className="bg-gray-50">
                  <TableRow>
                    <TableCell className="font-bold text-gray-600 uppercase text-xs">Name</TableCell>
                    <TableCell align="center" className="font-bold text-gray-600 uppercase text-xs">View</TableCell>
                    <TableCell align="center" className="font-bold text-gray-600 uppercase text-xs">Edit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((name) => (
                    <TableRow key={name} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500 text-sm py-1 px-4">{name}</TableCell>
                      <TableCell align="center" className="py-1">
                        <Checkbox 
                          size="small" 
                          sx={{ '&.Mui-checked': { color: '#248C70' } }} 
                        />
                      </TableCell>
                      <TableCell align="center" className="py-1">
                        <Checkbox 
                          size="small" 
                          sx={{ '&.Mui-checked': { color: '#248C70' } }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-start">
            <Button
              variant="contained"
              className="bg-[#248C70] hover:bg-[#1c6d57] px-10 py-2 capitalize shadow-none"
            >
              Save
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
};

export default CreateRoleForm;