import React, { useState } from "react";
import { TextField, MenuItem, Select, FormControl, Button } from "@mui/material";
import { useAddUnit } from "../../api/unit";
import { useNavigate } from "react-router-dom";

const AddUnitForm = () => {
  const [symbol, setSymbol] = useState("");
  const [status, setStatus] = useState("");
  const navigate=useNavigate()

  const { addUnit, loading, error, success } = useAddUnit();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol || !status) return;
    await addUnit({ symbol, status });
    navigate("/unit-list")
    
    setSymbol(""); // reset form
    setStatus("");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-7xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-600">Unit added successfully</p>}

          <div className="mt-8">
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 normal-case px-8 py-2 shadow-none"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUnitForm;

