import { MoreVertical } from "lucide-react";
import { Visibility, ArrowForward } from "@mui/icons-material";
import { DirectionsBike, DirectionsWalk } from "@mui/icons-material";
import OrderTable from "../components/OrderTable";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAdminOrders } from "../../api/order.js";
import { getName } from '../../../utils/orderData';

export default function AbandonOrders() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { orders } = useAdminOrders({ status: "abandon" });

    const handleView = (row) => {
    navigate(`/admin/orders/${row._id}`);
  };

  const mappedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        icon: order.orderType === "Takeaway" ? <DirectionsWalk /> : <DirectionsBike />,
        customerName: getName(order.customer?.name) || "",
      })),
    [orders]
  );

  const abandonOrdersColumns = [
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
    // {
    //   key: "action",
    //   label: "Action",
    //   render: () => <ArrowForward className="text-gray-500 cursor-pointer" />,
    // },
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
    {
      key: "action",
      label: "Action",
      render: () => (
        <button className="p-2 hover:bg-gray-100 rounded">
          <MoreVertical size={16} />
        </button>
      ),
    },
  ];

  // Filter mapped orders by search query
  const filteredOrders = searchQuery
    ? mappedOrders.filter((order) =>
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mappedOrders;

  return (
    <div className="w-full px-6 py-4">
      <PageHeader
        title="Abandon Orders"
        breadcrumbs={[
          { label: "Order Management" },
          { label: "Abandon Orders", active: true },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="p-6">
        <OrderTable columns={abandonOrdersColumns} data={filteredOrders} 
         onView={handleView}
        />


      
      </div>
    </div>
  );
}
