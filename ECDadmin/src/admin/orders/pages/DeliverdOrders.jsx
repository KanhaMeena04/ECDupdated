import { MoreVertical } from "lucide-react";
import { Visibility } from "@mui/icons-material";
import { DirectionsBike, DirectionsWalk } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import OrderTable from "../components/OrderTable";
import { useAdminOrders } from "../../api/order.js";
import { mapDeliveredOrders } from "../../../utils/orderData.js";

export default function DeliveredOrders() {
  const navigate = useNavigate();

const { orders, loading } = useAdminOrders({
  status: "delivered",
});
const data = mapDeliveredOrders(orders);

  const DeliveredOrdersColumns = [
  {
    key: "orderId",
    label: "Order ID",
    render: (row) => (
      <span className="flex items-center gap-2 font-medium text-gray-700">
        {row.orderType === "Delivery" ? <DirectionsBike /> : <DirectionsWalk />}
        {row.orderId}
      </span>
    ),
  },
  {
    key: "view",
    label: "View",
    render: (row) => (
      <Visibility
        className="text-gray-500 cursor-pointer"
        onClick={() => navigate(`/view-order/${row.id}`)}
      />
    ),
  },
  {
    key: "customerName",
    label: "Customer",
  },
  {
    key: "orderType",
    label: "Type",
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
  {
    key: "restaurant",
    label: "Restaurant",
  },
  {
    key: "date",
    label: "Date",
  },
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
    label: "Payment",
    render: (row) => (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          row.paymentMode === "COD"
            ? "bg-green-100 text-green-700"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {row.paymentMode}
      </span>
    ),
  },
  {
    key: "total",
    label: "Total",
    render: (row) => `₹ ${Number(row.total).toFixed(2)}`,
  },
  {
    key: "menu",
    label: "Action",
    render: () => (
      <button className="p-2 hover:bg-gray-100 rounded">
        <MoreVertical size={16} />
      </button>
    ),
  },
];


  return (
    <div className="w-full px-6 py-4">
      <PageHeader
        title="Delivered Orders"
        breadcrumbs={[
          { label: "Order Management" },
          { label: "Delivered Orders", active: true },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders"
            className="pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="p-6">
        <OrderTable
          columns={DeliveredOrdersColumns}
          data={data}
          loading={loading}
        />
      </div>
    </div>
  );
}
