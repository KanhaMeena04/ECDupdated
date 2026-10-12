import { DirectionsBike, DirectionsWalk } from "@mui/icons-material";

const getName = (obj) => {
  if (!obj) return "—";
  if (typeof obj === "string") return obj.trim() || "—";
  if (typeof obj === "object") {
    return (
      obj.en ||
      obj.name ||
      obj.title ||
      obj.en_US ||
      Object.values(obj).find((v) => typeof v === "string" && v.trim().length > 0) ||
      "—"
    );
  }
  return String(obj);
};

const extractCustomerName = (order) => {
  if (!order) return "Customer";
  if (order.customerName && order.customerName !== "—" && order.customerName !== "Customer") {
    return order.customerName;
  }
  const cust = order.customer || order.user;
  if (cust) {
    if (typeof cust === "string" && cust.trim() && cust !== "—") return cust;
    if (cust.name && cust.name !== "—" && cust.name !== "User" && cust.name !== "Customer") {
      return cust.name;
    }
    const fullName = [cust.firstName, cust.lastName].filter(Boolean).join(" ");
    if (fullName && fullName.trim()) return fullName;
    if (cust.mobile) return `Customer (${cust.mobile.slice(-4)})`;
    if (cust.phone) return `Customer (${cust.phone.slice(-4)})`;
  }
  if (order.deliveryAddress?.name && order.deliveryAddress.name.trim()) {
    return order.deliveryAddress.name;
  }
  if (order.customerMobile && order.customerMobile !== "—") {
    return `Customer (${order.customerMobile.slice(-4)})`;
  }
  if (order.deliveryPhone) {
    return `Customer (${String(order.deliveryPhone).slice(-4)})`;
  }
  return "Customer";
};

const extractCustomerMobile = (order) => {
  if (!order) return "—";
  if (order.customerMobile && order.customerMobile !== "—") return order.customerMobile;
  const cust = order.customer || order.user;
  if (cust && typeof cust === "object") {
    if (cust.mobile) return cust.mobile;
    if (cust.phone) return cust.phone;
  }
  if (order.customerPhone) return order.customerPhone;
  if (order.deliveryPhone) return String(order.deliveryPhone);
  if (order.deliveryAddress?.phone) return String(order.deliveryAddress.phone);
  if (order.address?.phone) return String(order.address.phone);
  return "—";
};

const extractRestaurantName = (order) => {
  if (!order) return "ECD Restaurant";
  if (order.restaurantName && order.restaurantName !== "—" && order.restaurantName !== "Restaurant") {
    return order.restaurantName;
  }
  const rest = order.restaurant || order.store;
  if (rest) {
    if (typeof rest === "string" && rest.trim() && rest !== "—") return rest;
    if (typeof rest.name === "string" && rest.name.trim() && rest.name !== "—") return rest.name;
    if (rest.name && typeof rest.name === "object") {
      const n =
        rest.name.en ||
        rest.name.name ||
        rest.name.title ||
        Object.values(rest.name).find((v) => typeof v === "string" && v.trim().length > 0);
      if (n && n !== "—") return n;
    }
  }
  if (order.storeName && order.storeName !== "—") return order.storeName;
  return "ECD Partner Restaurant";
};

const extractRestaurantId = (order) => {
  if (!order) return "RNT001";
  if (order.restaurantId) return order.restaurantId;
  const rest = order.restaurant || order.store;
  if (rest && typeof rest === "object") {
    if (rest.restaurantId) return rest.restaurantId;
    if (rest._id) return `RNT${rest._id.toString().slice(-4).toUpperCase()}`;
  }
  return "RNT001";
};

const getAddress = (addr) => {
  if (!addr) return "—";
  if (typeof addr === "string") return addr;
  if (addr.fullAddress) return addr.fullAddress;
  if (addr.addressLine) return addr.addressLine;
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
  if (order.orderId) return `#${order.orderId}`;
  if (order._id) return `#${order._id.slice(-6).toUpperCase()}`;
  return "—";
};

const mapOrdersToTableData = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    const isPickup = order.orderType === "pickup" || order.orderType === "self_pickup";
    return {
      id: order._id,
      icon: isPickup ? <DirectionsWalk /> : <DirectionsBike />,
      orderId: formatOrderId(order),
      orderNumber: order.orderNumber || order.orderId || (order._id ? `ORD${order._id.slice(-4).toUpperCase()}` : "ORD001"),
      customerId: order.customerId || order.customer?.customerId || "C001",
      customerName: extractCustomerName(order),
      customerMobile: extractCustomerMobile(order),
      orderType: isPickup ? "Self Pickup" : "Delivery",
      restaurantId: extractRestaurantId(order),
      restaurant: extractRestaurantName(order),
      date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
      riderId: order.riderId || order.rider?.riderId || (order.rider ? "RDR001" : "—"),
      deliveryPeople: order.rider?.user?.name || order.rider?.name || "Unassigned",
      address: order.deliveryAddress ? getAddress(order.deliveryAddress) : (order.restaurant?.address ? getAddress(order.restaurant.address) : "—"),
      paymentMode: (order.paymentMethod || "COD").toUpperCase(),
      paymentStatus: order.paymentStatus || "pending",
      total: Number(order.totalAmount || order.itemTotal || 0).toFixed(2),
    };
  });
};

const mapProcessingOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    const isPickup = order.orderType === "pickup" || order.orderType === "self_pickup";
    return {
      id: order._id,
      icon: isPickup ? <DirectionsWalk /> : <DirectionsBike />,
      orderId: formatOrderId(order),
      orderNumber: order.orderNumber || order.orderId || (order._id ? `ORD${order._id.slice(-4).toUpperCase()}` : "ORD001"),
      customerId: order.customerId || order.customer?.customerId || "C001",
      customerName: extractCustomerName(order),
      customerMobile: extractCustomerMobile(order),
      orderType: isPickup ? "Self Pickup" : "Delivery",
      restaurantId: extractRestaurantId(order),
      restaurant: extractRestaurantName(order),
      date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
      riderId: order.riderId || order.rider?.riderId || (order.rider ? "RDR001" : "—"),
      deliveryPeople: order.rider?.user?.name || order.rider?.name || "Unassigned",
      address: order.deliveryAddress ? getAddress(order.deliveryAddress) : (order.restaurant?.address ? getAddress(order.restaurant.address) : "—"),
      paymentMode: (order.paymentMethod || "COD").toUpperCase(),
      total: Number(order.totalAmount || order.itemTotal || 0).toFixed(2),
      status: order.status || "preparing",
    };
  });
};

const mapPickUpOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => ({
    id: order._id,
    icon: <DirectionsWalk />,
    orderId: formatOrderId(order),
    orderNumber: order.orderNumber || order.orderId || (order._id ? `ORD${order._id.slice(-4).toUpperCase()}` : "ORD001"),
    customerId: order.customerId || order.customer?.customerId || "C001",
    customerName: extractCustomerName(order),
    customerMobile: extractCustomerMobile(order),
    orderType: "Self Pickup",
    restaurantId: extractRestaurantId(order),
    restaurant: extractRestaurantName(order),
    date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
    address: order.restaurant?.address ? getAddress(order.restaurant.address) : "At Restaurant Counter",
    paymentMode: (order.paymentMethod || "COD").toUpperCase(),
    total: Number(order.totalAmount || order.itemTotal || 0).toFixed(2),
    status: order.status || "ready",
  }));
};

const mapCancelledOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    const isPickup = order.orderType === "pickup" || order.orderType === "self_pickup";
    return {
      id: order._id,
      icon: isPickup ? <DirectionsWalk /> : <DirectionsBike />,
      orderId: formatOrderId(order),
      orderNumber: order.orderNumber || order.orderId || (order._id ? `ORD${order._id.slice(-4).toUpperCase()}` : "ORD001"),
      customerId: order.customerId || order.customer?.customerId || "C001",
      customerName: extractCustomerName(order),
      customerMobile: extractCustomerMobile(order),
      orderType: isPickup ? "Self Pickup" : "Delivery",
      restaurantId: extractRestaurantId(order),
      restaurant: extractRestaurantName(order),
      date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
      address: order.deliveryAddress ? getAddress(order.deliveryAddress) : (order.restaurant?.address ? getAddress(order.restaurant.address) : "—"),
      paymentMode: (order.paymentMethod || "COD").toUpperCase(),
      total: Number(order.totalAmount || order.itemTotal || 0).toFixed(2),
      cancellationReason: order.cancellationReason || "Customer cancelled",
    };
  });
};

const mapDeliveredOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    const isPickup = order.orderType === "pickup" || order.orderType === "self_pickup";
    return {
      id: order._id,
      icon: isPickup ? <DirectionsWalk /> : <DirectionsBike />,
      orderId: formatOrderId(order),
      orderNumber: order.orderNumber || order.orderId || (order._id ? `ORD${order._id.slice(-4).toUpperCase()}` : "ORD001"),
      customerId: order.customerId || order.customer?.customerId || "C001",
      customerName: extractCustomerName(order),
      customerMobile: extractCustomerMobile(order),
      orderType: isPickup ? "Self Pickup" : "Delivery",
      restaurantId: extractRestaurantId(order),
      restaurant: extractRestaurantName(order),
      date: new Date(order.deliveredAt || order.createdAt || Date.now()).toLocaleString("en-IN"),
      riderId: order.riderId || order.rider?.riderId || (order.rider ? "RDR001" : "—"),
      deliveryPeople: order.rider?.user?.name || order.rider?.name || "Unassigned",
      address: order.deliveryAddress ? getAddress(order.deliveryAddress) : (order.restaurant?.address ? getAddress(order.restaurant.address) : "—"),
      paymentMode: (order.paymentMethod || "COD").toUpperCase(),
      total: Number(order.totalAmount || 0).toFixed(2),
    };
  });
};

const mapFailedOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    const isPickup = order.orderType === "pickup" || order.orderType === "self_pickup";
    return {
      id: order._id,
      icon: isPickup ? <DirectionsWalk /> : <DirectionsBike />,
      orderId: formatOrderId(order),
      orderNumber: order.orderNumber || order.orderId || (order._id ? `ORD${order._id.slice(-4).toUpperCase()}` : "ORD001"),
      customerId: order.customerId || order.customer?.customerId || "C001",
      customerName: extractCustomerName(order),
      customerMobile: extractCustomerMobile(order),
      orderType: isPickup ? "Self Pickup" : "Delivery",
      restaurantId: extractRestaurantId(order),
      restaurant: extractRestaurantName(order),
      date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
      address: order.deliveryAddress ? getAddress(order.deliveryAddress) : "—",
      paymentMode: (order.paymentMethod || "COD").toUpperCase(),
      total: Number(order.totalAmount || 0).toFixed(2),
    };
  });
};

const mapRefundOrders = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    const isPickup = order.orderType === "pickup" || order.orderType === "self_pickup";
    return {
      id: order._id,
      icon: isPickup ? <DirectionsWalk /> : <DirectionsBike />,
      orderId: formatOrderId(order),
      customerId: order.customerId || order.customer?.customerId || "C001",
      customerName: extractCustomerName(order),
      customerMobile: extractCustomerMobile(order),
      orderType: isPickup ? "Self Pickup" : "Delivery",
      restaurantId: extractRestaurantId(order),
      restaurant: extractRestaurantName(order),
      date: new Date(order.createdAt || Date.now()).toLocaleString("en-IN"),
      address: order.deliveryAddress ? getAddress(order.deliveryAddress) : "—",
      paymentMode: (order.paymentMethod || "COD").toUpperCase(),
      total: Number(order.totalAmount || 0).toFixed(2),
    };
  });
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
  extractCustomerName,
  extractCustomerMobile,
  extractRestaurantName,
  extractRestaurantId,
  getAddress,
  formatOrderId,
};
