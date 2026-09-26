import { DirectionsBike, DirectionsWalk } from "@mui/icons-material";

const getName = (obj) => {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  if (typeof obj === "object") {
    return obj.en || obj.name || obj.title || obj.en_US || (Object.values(obj).find(v => typeof v === 'string') || "—");
  }
  return String(obj);
};

const getAddress = (addr) => {
  if (!addr) return "—";
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
  if (addr.pincode || addr.postalCode) parts.push(addr.pincode || addr.postalCode);
  if (parts.length) return parts.join(", ");
  try {
    return JSON.stringify(addr);
  } catch (e) {
    return String(addr);
  }
};

const formatOrderId = (order) => {
  if (!order) return "—";
  if (order.orderNumber) return `#${order.orderNumber}`;
  if (order._id) return `#${order._id.slice(-6).toUpperCase()}`;
  return "—";
};

const mapOrdersToTableData = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => ({
    id: order._id,
    icon: order.orderType === "pickup" || order.orderType === "self_pickup" ? <DirectionsWalk /> : <DirectionsBike />, 
    orderId: formatOrderId(order),
    customerName: order.customer?.name || "Customer",
    customerMobile: order.customer?.mobile || "—",
    orderType: order.orderType === "pickup" || order.orderType === "self_pickup" ? "Self Pickup" : "Delivery", 
    restaurant: getName(order.restaurant?.name) || "Restaurant",
    date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
    deliveryPeople: order.rider?.user?.name || order.rider?.name || "Unassigned",
    address: order.deliveryAddress ? getAddress(order.deliveryAddress) : (order.restaurant?.address ? getAddress(order.restaurant.address) : "—"),
    paymentMode: (order.paymentMethod || "COD").toUpperCase(),
    paymentStatus: order.paymentStatus || "pending",
    total: Number(order.totalAmount || order.itemTotal || 0).toFixed(2),
  }));
};

const mapProcessingOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => ({
    id: order._id,
    icon: order.orderType === "pickup" || order.orderType === "self_pickup" ? <DirectionsWalk /> : <DirectionsBike />,
    orderId: formatOrderId(order),
    customerName: order.customer?.name || getName(order.customer?.name) || "Customer",
    orderType: order.orderType === "pickup" || order.orderType === "self_pickup" ? "Self Pickup" : "Delivery",
    restaurant: getName(order.restaurant?.name) || "Restaurant",
    date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
    address: order.deliveryAddress ? getAddress(order.deliveryAddress) : (order.restaurant?.address ? getAddress(order.restaurant.address) : "—"),
    paymentMode: (order.paymentMethod || "COD").toUpperCase(),
    total: Number(order.totalAmount || order.itemTotal || 0).toFixed(2),
    status: order.status || "preparing"
  }));
};

const mapPickUpOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => ({
    id: order._id,
    icon: <DirectionsWalk />,
    orderId: formatOrderId(order),
    customerName: order.customer?.name || getName(order.customer?.name) || "Customer",
    orderType: "Self Pickup",
    restaurant: getName(order.restaurant?.name) || "Restaurant",
    date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
    address: order.restaurant?.address ? getAddress(order.restaurant.address) : "At Restaurant Counter",
    paymentMode: (order.paymentMethod || "COD").toUpperCase(),
    total: Number(order.totalAmount || order.itemTotal || 0).toFixed(2),
    status: order.status
  }));
};

const mapCancelledOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => ({
    id: order._id,
    icon: order.orderType === "pickup" || order.orderType === "self_pickup" ? <DirectionsWalk /> : <DirectionsBike />,
    orderId: formatOrderId(order),
    customerName: order.customer?.name || getName(order.customer?.name) || "Customer",
    orderType: order.orderType === "pickup" || order.orderType === "self_pickup" ? "Self Pickup" : "Delivery",
    restaurant: getName(order.restaurant?.name) || "Restaurant",
    date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
    address: order.deliveryAddress ? getAddress(order.deliveryAddress) : (order.restaurant?.address ? getAddress(order.restaurant.address) : "—"),
    paymentMode: (order.paymentMethod || "COD").toUpperCase(),
    total: Number(order.totalAmount || order.itemTotal || 0).toFixed(2),
    cancellationReason: order.cancellationReason || "Customer cancelled"
  }));
};

const mapDeliveredOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => ({
    id: order._id,
    orderId: formatOrderId(order),
    customerName: order.customer?.name || "Customer",
    orderType: order.orderType === "pickup" || order.orderType === "self_pickup" ? "Self Pickup" : "Delivery",
    restaurant: getName(order.restaurant?.name) || "Restaurant",
    date: new Date(order.deliveredAt || order.createdAt || Date.now()).toLocaleString("en-IN"),
    address: order.deliveryAddress ? getAddress(order.deliveryAddress) : (order.restaurant?.address ? getAddress(order.restaurant.address) : "—"),
    paymentMode: (order.paymentMethod || "COD").toUpperCase(),
    total: Number(order.totalAmount || 0).toFixed(2),
    icon: order.orderType === "pickup" || order.orderType === "self_pickup" ? <DirectionsWalk /> : <DirectionsBike />,
  }));
};

const mapFailedOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => ({
    id: order._id,
    orderId: formatOrderId(order),
    customerName: order.customer?.name || getName(order.customer?.name) || "Customer",
    orderType: order.orderType === "pickup" || order.orderType === "self_pickup" ? "Self Pickup" : "Delivery",
    restaurant: getName(order.restaurant?.name) || "Restaurant",
    date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
    address: order.deliveryAddress ? getAddress(order.deliveryAddress) : "—",
    paymentMode: (order.paymentMethod || "COD").toUpperCase(),
    total: Number(order.totalAmount || 0).toFixed(2),
    icon: order.orderType === "pickup" || order.orderType === "self_pickup" ? <DirectionsWalk /> : <DirectionsBike />,
  }));
};

const mapRefundOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => ({
    id: order._id,
    orderId: formatOrderId(order),
    customerName: order.customer?.name || getName(order.customer?.name) || "Customer",
    orderType: order.orderType === "pickup" || order.orderType === "self_pickup" ? "Self Pickup" : "Delivery",
    restaurant: getName(order.restaurant?.name) || "Restaurant",
    date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
    address: order.deliveryAddress ? getAddress(order.deliveryAddress) : "—",
    paymentMode: (order.paymentMethod || "COD").toUpperCase(),
    total: Number(order.totalAmount || 0).toFixed(2),
    icon: order.orderType === "pickup" || order.orderType === "self_pickup" ? <DirectionsWalk /> : <DirectionsBike />,
  }));
};

export { 
  mapOrdersToTableData,
  mapProcessingOrders,
  mapPickUpOrders,
  mapCancelledOrders,
  mapDeliveredOrders,
  mapFailedOrders,
  mapRefundOrders,
  getName,
  getAddress,
  formatOrderId
};
