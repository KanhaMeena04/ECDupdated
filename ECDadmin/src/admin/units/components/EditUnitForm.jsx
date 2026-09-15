import React, { useState, useEffect } from "react";
import { TextField, Select, FormControl, MenuItem, Button, Box, Tabs, Tab } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useUnitDetails, useUnit } from "../../api/unit";
import { useNavigate, useParams } from "react-router-dom";

const EditUnitForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { unit, loading: loadingDetails } = useUnitDetails(id);
  const { updateUnit, loading: updating } = useUnit();

  const [tabValue, setTabValue] = useState(0);
  const [symbol, setSymbol] = useState("kg"); // ✅ default value
  const [status, setStatus] = useState("active"); // ✅ default value

  // Update state when unit data is fetched
  useEffect(() => {
    if (unit) {
      setSymbol(unit.symbol || "kg");
      setStatus(unit.status || "active");
    }
  }, [unit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol || !status) return;
    await updateUnit(id, { symbol, status });
    navigate("/units");
  };

  if (loadingDetails) return <p className="p-4 text-gray-500">Loading unit details...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-7xl mx-auto">
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            TabIndicatorProps={{ style: { backgroundColor: "#10b981" } }}
          >
            <Tab icon={<LanguageIcon />} iconPosition="start" label="English" />
            <Tab icon={<LanguageIcon />} iconPosition="start" label="Arabic" />
          </Tabs>
        </Box>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            {/* Unit Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400">Unit Name</label>
              <TextField
                fullWidth
                size="small"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>

            {/* Units Symbol */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400">Units Symbol</label>
              <FormControl fullWidth size="small">
                <Select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  displayEmpty
                  renderValue={(v) => v || <span className="text-gray-400">Select Units Symbol</span>}
                >
                  <MenuItem value="kg">Kilogram (kg)</MenuItem>
                  <MenuItem value="m">Meter (m)</MenuItem>
                  <MenuItem value="pc">Piece (pc)</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400">Status</label>
              <FormControl fullWidth size="small">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  displayEmpty
                  renderValue={(v) => v || <span className="text-gray-400">Select Status</span>}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="mt-8">
            <Button
              type="submit"
              variant="contained"
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700 normal-case px-8 py-2 shadow-none"
            >
              {updating ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUnitForm;
