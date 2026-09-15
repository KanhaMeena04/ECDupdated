// DynamicTable.jsx
import {
  Visibility,
  Edit,
  Delete,
} from "@mui/icons-material";

const OrderTable = ({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
}) => {
  if (!data?.length) {
    return (
      <div className="bg-white rounded-lg p-6 text-center text-gray-400">
        No orders found
      </div>
    );
  }

  return (
    <div className="table-wrapper bg-white rounded-lg">
      <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-gray-600 border"
                >
                  {col.label}
                </th>
              ))}

              {(onView || onEdit || onDelete) && (
                <th className="px-4 py-3 text-left font-semibold text-gray-600 border">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr
                key={row._id || row.id}
                className="border hover:bg-gray-50 transition"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 border">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}

                {(onView || onEdit || onDelete) && (
                  <td className="px-4 py-3 border">
                    <div className="flex gap-3 text-gray-600">
                      {onView && (
                        <Visibility
                          className="cursor-pointer hover:text-black"
                          onClick={() => onView(row)}
                        />
                      )}

                      {onEdit && (
                        <Edit
                          className="cursor-pointer hover:text-black"
                          onClick={() => onEdit(row)}
                        />
                      )}

                      {onDelete && (
                        <Delete
                          className="cursor-pointer hover:text-red-500"
                          onClick={() => onDelete(row)}
                        />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
