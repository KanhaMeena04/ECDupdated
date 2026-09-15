import React, { useState, useEffect } from "react";
import {
  TextField,
  Autocomplete,
  Button,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { useUnitSymbol } from "../../api/unitsymbol";
import { useParams, useNavigate } from "react-router-dom";

const EditUnitSymbolForm = () => {
  const { id } = useParams(); // If editing
  const navigate = useNavigate();
  const { addUnit, updateUnit, getUnitById } = useUnitSymbol();

  const [tabValue, setTabValue] = useState(0);
  const [symbol, setSymbol] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);

  // Fetch details if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      getUnitById(id)
        .then((unit) => {
          setSymbol(unit.symbol || "");
          setStatus(unit.status || "Active");
        })
        .finally(() => setLoading(false));
    }
  }, [id, getUnitById]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol || !status) return;

    setLoading(true);
    try {
      if (id) {
        await updateUnit(id, { symbol, status });
      } else {
        await addUnit({ symbol, status });
      }
      navigate("/units"); // navigate back to unit table
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6 max-w-full">


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Unit Name(Symbol)</label>
            <TextField
              fullWidth
              placeholder="Name"
              size="small"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Status</label>
            <Autocomplete
              size="small"
              options={["Active", "Inactive"]}
              value={status}
              onChange={(_, val) => setStatus(val)}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
          </div>
        </div>

        <div className="flex justify-start">
          <Button
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: "#248C70",
              "&:hover": { backgroundColor: "#1c6d57" },
              textTransform: "none",
              px: 3,
              borderRadius: "4px",
              boxShadow: "none",
            }}
            onClick={handleSubmit}
          >
            {loading ? (id ? "Updating..." : "Saving...") : id ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditUnitSymbolForm;
