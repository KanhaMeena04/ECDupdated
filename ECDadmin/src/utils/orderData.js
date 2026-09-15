import { DirectionsBike, DirectionsWalk } from "@mui/icons-material";


const getName = (obj) => (obj && obj.en) || "N/A";

const getAddress = (addr) => {
  if (!addr) return "N/A";
  if (typeof addr === "string") return addr;
  if (addr.addressLine) return addr.addressLine;
  if (addr.fullAddress) return addr.fullAddress;
  if (addr.formatted) return addr.formatted;
  const parts = [];
  if (addr.addressLine) parts.push(addr.addressLine);
  if (addr.street) parts.push(addr.street);
  if (addr.area) parts.push(addr.area || addr.suburb);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  if (addr.country) parts.push(addr.country);
  if (parts.length) return parts.join(", ");
  try {
    return JSON.stringify(addr);
  } catch (e) {
    return String(addr);
  }
};

const sampleDummyOrders = [
  {
    id: "65a1001",
    orderId: "ORD-9841",
    customerName: "Rajesh Kumar",
    orderType: "Delivery",
    restaurant: "Royal Curry House",
    date: new Date().toLocaleString(),
    deliveryPeople: "Rahul Rider",
    address: "Block B, Flat 204, Green Park, New Delhi",
    paymentMode: "ONLINE",
    total: "450.00"
  },
  {
    id: "65a1002",
    orderId: "ORD-9842",
    customerName: "Alice Smith",
    orderType: "Delivery",
    restaurant: "Pizza Palace",
    date: new Date().toLocaleString(),
    deliveryPeople: "Amit Sharma",
    address: "Sector 14, MG Road, Gurgaon",
    paymentMode: "COD",
    total: "820.00"
  },
  {
    id: "65a1003",
    orderId: "ORD-9843",
    customerName: "Marco Pierre",
    orderType: "Pickup",
    restaurant: "Tandoori Nights",
    date: new Date().toLocaleString(),
    deliveryPeople: "Unassigned",
    address: "Civil Lines, Main Market, Jaipur",
    paymentMode: "ONLINE",
    total: "310.00"
  }
];

const mapOrdersToTableData = (orders) => {
  if (!orders || orders.length === 0) return sampleDummyOrders;
  return orders.map((order) => ({
    id: order._id,
    icon: order.rider ? <DirectionsBike /> : <DirectionsBike />, 
    orderId: order._id ? order._id.slice(-6).toUpperCase() : "ORD-000",
    customerName: order.customer?.name || "Unknown Customer",
    orderType: order.orderType || "Delivery", 
    restaurant: order.restaurant?.name?.en || "Restaurant",
    date: new Date(order.createdAt || Date.now()).toLocaleString(),
    deliveryPeople: order.rider?.name || "Unassigned",
    address: order.deliveryAddress?.addressLine || 
             order.restaurant?.address || 
             "N/A",
    paymentMode: order.paymentMethod?.toUpperCase() || "N/A",
    total: `${order.totalAmount?.toFixed(2) || "0.00"}`,
  }));
};

const mapProcessingOrders = (orders) =>
  orders.map((order) => ({
    id: order._id,
    icon:
      order.orderType === "Delivery" ? (
        <DirectionsBike />
      ) : (
        <DirectionsWalk />
      ),
    orderId: order._id.slice(-6).toUpperCase(),
    customerName: getName(order.customer?.name),
    orderType: order.orderType,
    restaurant: getName(order.restaurant?.name),
    date: new Date(order.createdAt).toLocaleString(),
    address: order.address
      ? typeof order.address === "string"
        ? order.address
        : getAddress(order.address)
      : order.deliveryAddress
      ? getAddress(order.deliveryAddress)
      : order.restaurant?.address
      ? getAddress(order.restaurant.address)
      : "Address not available",
    paymentMode: order.paymentMode,
    total: Number(order.total || 0),
  }));


  const mapPickUpOrders = (orders) =>
  orders.map((order) => ({
    id: order._id,
    icon:
      order.orderType === "Delivery" ? (
        <DirectionsBike />
      ) : (
        <DirectionsWalk />
      ),
    orderId: order._id.slice(-6).toUpperCase(),
    customerName: getName(order.customer?.name),
    orderType: order.orderType,
    restaurant: getName(order.restaurant?.name),
    date: new Date(order.createdAt).toLocaleString(),
    address: order.address
      ? typeof order.address === "string"
        ? order.address
        : getAddress(order.address)
      : order.deliveryAddress
      ? getAddress(order.deliveryAddress)
      : order.restaurant?.address
      ? getAddress(order.restaurant.address)
      : "Address not available",
    paymentMode: order.paymentMode,
    total: Number(order.total || 0),
  }));


const mapCancelledOrders = (orders) =>
  orders.map((order) => ({
    id: order._id,
    icon:
      order.orderType === "Delivery" ? (
        <DirectionsBike />
      ) : (
        <DirectionsWalk />
      ),
    orderId: order._id.slice(-6).toUpperCase(),
    customerName: getName(order.customer?.name),
    orderType: order.orderType,
    restaurant: getName(order.restaurant?.name),
    date: new Date(order.createdAt).toLocaleString(),
    address: order.address
      ? typeof order.address === "string"
        ? order.address
        : getAddress(order.address)
      : order.deliveryAddress
      ? getAddress(order.deliveryAddress)
      : order.restaurant?.address
      ? getAddress(order.restaurant.address)
      : "Address not available",
    paymentMode: order.paymentMode,
    total: Number(order.total || 0),
  }));

 const mapDeliveredOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];

  return orders.map((order) => ({
    id: order._id,

    // short readable ID (since orderNumber does NOT exist)
    orderId: order._id?.slice(-6).toUpperCase(),

    customerName: order.customer?.name || "N/A",

    // delivered orders are always delivery in your system
    orderType: "Delivery",

    restaurant: getName(order.restaurant?.name) || "-",

    // deliveredAt is more accurate than createdAt
    date: new Date(
      order.deliveredAt || order.createdAt
    ).toLocaleString(),

    address: order.deliveryAddress
      ? getAddress(order.deliveryAddress)
      : "-",

    paymentMode: order.paymentMethod
      ? order.paymentMethod.toUpperCase()
      : "N/A",

    total: Number(order.totalAmount || 0),

    icon: <DirectionsBike />,
  }));
};

 const mapFailedOrders = (orders = []) =>
  orders.map((order) => ({
    id: order._id,
    orderId: order.orderNumber,
    customerName: getName(order.customer?.name),
    orderType: order.orderType,
    restaurant: getName(order.restaurant?.name) || "-",
    date: new Date(order.createdAt).toLocaleString(),
    address: order.deliveryAddress ? getAddress(order.deliveryAddress) : "-",
    paymentMode: order.paymentMethod,
    total: Number(order.totalAmount || 0),
    icon:
      order.orderType === "Delivery" ? (
        <DirectionsBike />
      ) : (
        <DirectionsWalk />
      ),
  }));

  const mapRefundOrders = (orders = []) =>
  orders.map((order) => ({
    id: order._id,
    orderId: order.orderNumber,
    customerName: getName(order.customer?.name),
    orderType: order.orderType,
    restaurant: getName(order.restaurant?.name) || "-",
    date: new Date(order.createdAt).toLocaleString(),
    address: order.deliveryAddress ? getAddress(order.deliveryAddress) : "-",
    paymentMode: order.paymentMethod,
    total: Number(order.totalAmount || 0),
    icon:
      order.orderType === "Delivery" ? (
        <DirectionsBike />
      ) : (
        <DirectionsWalk />
      ),
  }));

  export { 
	mapOrdersToTableData ,
	 mapProcessingOrders,
	 mapPickUpOrders,
	 mapCancelledOrders,
	 mapDeliveredOrders,
	 mapFailedOrders,
   mapRefundOrders,
   getName,
   getAddress,
  };
