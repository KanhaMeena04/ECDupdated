import { MoreVertical } from "lucide-react";
import { Visibility } from "@mui/icons-material";
import OrderTable from "../components/OrderTable";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useAdminOrders } from "../../api/order.js";
import { mapCancelledOrders } from "../../../utils/orderData.js";

export default function CancelledOrders() {
const navigate=useNavigate()
  const handleView = (row) => {
    navigate(`/admin/orders/${row._id}`);
  };
const cancelledOrdersColumns = [
  {
    key: "orderId",
    label: "Order ID",
    render: (row) => (
      <span className="flex items-center gap-2 font-medium text-gray-700">
        {row.icon}
        {row.orderId}
      </span>
    ),
  },
  {
    key: "view",
    label: "View Order",
    render: (row) => (
      <Visibility
        className="text-gray-500 cursor-pointer"
        onClick={() => navigate(`/view-order/${row.id}`)}
      />
    ),
  },
  {
    key: "customerName",
    label: "Customer Name",
    render: (row) => (
      <div>
        <p className="font-medium">{row.customerName}</p>
        <p className="text-xs text-gray-400">***********</p>
      </div>
    ),
  },
  {
    key: "orderType",
    label: "Order Type",
    render: (row) => (
      <span
        className={`px-3 py-1 text-xs rounded-md font-medium ${
          row.orderType === "Delivery"
            ? "bg-green-100 text-green-600"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {row.orderType}
      </span>
    ),
  },
  { key: "restaurant", label: "Restaurant" },
  { key: "date", label: "Date" },
  {
    key: "address",
    label: "Address",
    render: (row) => (
      <div className="max-w-[320px] truncate" title={row.address}>
        {row.address}
      </div>
    ),
  },
  {
    key: "paymentMode",
    label: "Payment Mode",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          row.paymentMode === "COD"
            ? "bg-green-100 text-green-700"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {row.paymentMode === "COD" ? "COD" : "Online Payment"}
      </span>
    ),
  },
  {
    key: "total",
    label: "Total",
    render: (row) => `RM ${row.total.toFixed(2)}`,
  },
  
 
];



  const { orders, loading, error } = useAdminOrders({
    status: "cancelled",
  });

  const cancelledOrdersData = mapCancelledOrders(orders);

  return (
	 <div className="w-full px-6 py-4">
      <PageHeader
        title="Cancelled Orders"
        breadcrumbs={[
          { label: "Order Management" },
          { label: "Cancelled Orders", active: true },
        ]}
      />

      {/* Search */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg">
        <OrderTable
          columns={cancelledOrdersColumns}
          data={cancelledOrdersData}
          loading={loading}
           onView={handleView}
        />
        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
	
  );
}