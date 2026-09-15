import React, { useState } from "react";
import { useUnitSymbol } from "../../api/unitsymbol";
import UnitTable from "./UnitTable.jsx";
import { useNavigate } from "react-router-dom";

const UnitSymbolTable = () => {
  const { units: rawUnits, loading, error, deleteUnit } = useUnitSymbol();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const navigate = useNavigate();

  // Ensure units is always an array
  const units = Array.isArray(rawUnits) ? rawUnits : [];

  if (loading) return <div className="p-4 text-gray-500">Loading units...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">
      <UnitTable
        units={units.slice(0, entriesPerPage)}
        onEdit={(id) => navigate(`/edit-unit-symbol/${id}`)}
        onDelete={(id) => {
          if (window.confirm("Are you sure you want to delete this unit?")) deleteUnit(id);
        }}
      />

      {/* Footer Pagination */}
      <div className="flex justify-between items-center mt-4 px-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          Showing 1 to
          <select
            className="border border-gray-300 rounded px-1 py-0.5 bg-white outline-none"
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          of {units.length} entries
        </div>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full">‹</button>
          <button className="w-8 h-8 flex items-center justify-center bg-[#00a65a] text-white rounded-full text-xs">1</button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full">›</button>
        </div>
      </div>
    </div>
  );
};

export default UnitSymbolTable;


