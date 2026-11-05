import React from "react";
import {
  Visibility,
  Edit,
  Delete,
  ReceiptLongOutlined,
  RestartAlt,
} from "@mui/icons-material";

const OrderTable = ({
  columns = [],
  data = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  emptyMessage,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-bold text-gray-700">Loading orders...</p>
        <p className="text-xs text-gray-400 mt-1">Fetching live orders from database</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
          <ReceiptLongOutlined sx={{ fontSize: 32 }} />
        </div>
        <h3 className="text-base font-bold text-gray-800">
          {emptyMessage || "No Orders Found"}
        </h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          There are currently no orders matching your status, date, or search filter. Orders will appear here in real-time as they are placed or updated.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all border border-emerald-200/80 cursor-pointer"
          >
            <RestartAlt fontSize="small" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  const totalSum = data.reduce((sum, row) => sum + (Number(row.total || 0) || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "68vh" }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/90 backdrop-blur sticky top-0 z-10 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3.5 text-xs font-extrabold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}

              {(onView || onEdit || onDelete) && (
                <th className="px-4 py-3.5 text-xs font-extrabold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap">
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr
                key={row._id || row.id || idx}
                className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                onClick={() => onView && onView(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-xs text-gray-700 align-middle">
                    {col.render ? col.render(row) : (row[col.key] ?? "—")}
                  </td>
                ))}

                {(onView || onEdit || onDelete) && (
                  <td className="px-4 py-3 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="View order details"
                        >
                          <Visibility sx={{ fontSize: 18 }} />
                        </button>
                      )}

                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit order"
                        >
                          <Edit sx={{ fontSize: 18 }} />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete order"
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary Stats */}
      <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-2">
          <span>Showing <strong className="text-gray-800 font-bold">{data.length}</strong> orders</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Total Value: <strong className="text-emerald-700 font-bold text-sm">₹{totalSum.toFixed(2)}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default OrderTable;
