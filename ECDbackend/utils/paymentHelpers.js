
function isCOD(order) {
  const paymentMethod = typeof order === 'string' 
    ? order 
    : order?.paymentMethod;
  return paymentMethod?.toLowerCase() === 'cod';
}
function isOnline(order) {
  const paymentMethod = typeof order === 'string' 
    ? order 
    : order?.paymentMethod;
  const onlinePaymentMethods = ['card', 'wallet', 'online'];
  return onlinePaymentMethods.includes(paymentMethod?.toLowerCase());
}
function isPaymentComplete(order) {
  if (isCOD(order)) {
    return true;
  }
  return order?.paymentStatus === 'paid';
}
function shouldRestaurantSeeOrder(order) {
  if (isCOD(order)) {
    return {
      visible: true,
      reason: 'COD order - visible immediately'
    };
  }
  if (isOnline(order)) {
    if (order.paymentStatus === 'paid') {
      return {
        visible: true,
        reason: 'Online payment successful'
      };
    }
    return {
      visible: false,
      reason: 'Awaiting payment confirmation'
    };
  }
  return {
    visible: false,
    reason: 'Unknown payment method'
  };
}
function requiresPaymentVerification(order) {
  return isOnline(order) && order?.paymentStatus !== 'paid';
}
function getPaymentMethodName(paymentMethod) {
  const methodNames = {
    'cod': 'Cash on Delivery',
    'card': 'Credit/Debit Card',
    'wallet': 'Wallet',
    'online': 'Online Payment'
  };
  return methodNames[paymentMethod?.toLowerCase()] || 'Unknown';
}
function validatePaymentForProgression(order) {
  if (isCOD(order)) {
    return { valid: true, error: null };
  }
  if (isOnline(order)) {
    if (order.paymentStatus === 'paid') {
      return { valid: true, error: null };
    }
    if (order.paymentStatus === 'pending') {
      return { 
        valid: false, 
        error: 'Payment is still pending. Cannot proceed with order.' 
      };
    }
    if (order.paymentStatus === 'failed') {
      return { 
        valid: false, 
        error: 'Payment failed. Order cannot be processed.' 
      };
    }
  }
  return { 
    valid: false, 
    error: 'Invalid payment method or status' 
  };
}
module.exports = {
  isCOD,
  isOnline,
  isPaymentComplete,
  shouldRestaurantSeeOrder,
  requiresPaymentVerification,
  getPaymentMethodName,
  validatePaymentForProgression
};
