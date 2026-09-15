// tableConfig.js
import { Visibility} from "@mui/icons-material";
import OrderTable from "../components/OrderTable";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useAdminOrders } from "../../api/order.js";
import { mapOrdersToTableData } from "../../../utils/orderData.js";

export default function NewOrder() {
const navigate=useNavigate()
const orderTableColumns = [
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
  { key: "deliveryPeople", label: "Delivery People" },
  {
    key: "address",
    label: "Address",
    render: (row) => (
      <span className="text-gray-600 leading-snug">{row.address}</span>
    ),
  },
  {
    key: "paymentMode",
    label: "Payment Mode",
    render: (row) => (
      <span
        className={`px-3 py-1 text-xs rounded-md font-medium ${
          row.paymentMode === "COD"
            ? "bg-green-100 text-green-600"
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
    render: (row) => (
      <span className="font-medium text-gray-700">RM {row.total}</span>
    ),
  },
  // {
  //   key: "action",
  //   label: "Action",
  //   render: () => (
  //     <MoreVertIcon className="text-gray-500 cursor-pointer" />
  //   ),
  // },
];


  const { orders, loading, error } = useAdminOrders({
    status: "placed",
  });

  const orderTableData = mapOrdersToTableData(orders);


  return (
    <>
     <div className="w-full px-6 py-4">
      <PageHeader
        title="New Orders"
        breadcrumbs={[
          { label: "Order Management" },
          { label: "New Orders", active: true },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        

        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="pl-4 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <OrderTable
          columns={orderTableColumns}
          data={orderTableData}
          loading={loading}
        />
        {error && (
          <p className="text-red-500 text-sm p-4">{error}</p>
        )}
      </div>
    </div>

    </>
  );
}
