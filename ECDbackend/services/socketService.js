
let io;
module.exports = {
  init: (socketIO) => {
    io = socketIO;
    console.log('Socket.IO service initialized');
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.IO not initialized! Call init() first.');
    }
    return io;
  },
  emitToUser: (userId, event, data) => {
    if (!io || !userId) return;
    const id = String(userId);
    io.to(`user:${id}`).to(`user_${id}`).to(`customer:${id}`).to(`customer_${id}`).emit(event, data);
  },
  emitToCustomer: (customerId, event, data) => {
    if (!io || !customerId) return;
    const id = String(customerId);
    io.to(`customer:${id}`).to(`customer_${id}`).to(`user:${id}`).to(`user_${id}`).emit(event, data);
  },
  emitToAdmin: (event, data) => {
    if (!io) {
      console.error('❌ Socket.IO not initialized - cannot emit to admin');
      return;
    }
    console.log(`📡 Emitting to admin:dashboard room - Event: ${event}`, data);
    const adminRoom = io.sockets.adapter.rooms.get('admin:dashboard');
    console.log(`👥 Admin room has ${adminRoom ? adminRoom.size : 0} connected clients`);
    io.to('admin:dashboard').emit(event, data);
  },
  emitToRestaurant: (restaurantId, event, data) => {
    if (!io || !restaurantId) return;
    const id = String(restaurantId);
    io.to(`restaurant:${id}`).to(`restaurant_${id}`).emit(event, data);
  },
  emitToRider: (riderId, event, data) => {
    if (!io || !riderId) return;
    const id = String(riderId);
    io.to(`rider:${id}`).to(`rider_${id}`).emit(event, data);
  },
  emitToRiderByUserId: (userId, event, data) => {
    if (!io || !userId) return;
    const id = String(userId);
    io.to(`rider:${id}`).to(`rider_${id}`).to(`user:${id}`).to(`user_${id}`).emit(event, data);
  },
  emitToZone: (zoneId, event, data) => {
    if (!io || !zoneId) return;
    const id = String(zoneId);
    io.to(`zone:${id}`).to(`zone_${id}`).emit(event, data);
  },
  emitToOrder: (orderId, event, data) => {
    if (!io || !orderId) return;
    const id = String(orderId);
    io.to(`order:${id}`).to(`order_${id}`).emit(event, data);
  },
  emitToAll: (event, data) => {
    if (!io) return;
    io.emit(event, data);
  },
  getConnectionCount: () => {
    if (!io) return 0;
    return io.engine.clientsCount;
  }
};
