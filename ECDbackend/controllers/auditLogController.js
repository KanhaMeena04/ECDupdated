const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const { entity, userRole, action, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (entity) query.entity = entity;
    if (userRole) query.userRole = userRole;
    if (action) query.action = action;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name firstName lastName email role mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    const formattedLogs = logs.map(log => {
      const userObj = log.userId || {};
      const userName = userObj.name || (userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : 'Admin User');
      return {
        _id: log._id,
        entity: log.entity,
        entityId: log.entityId,
        action: log.action,
        userId: userObj._id || log.userId,
        userName: userName,
        userRole: log.userRole,
        changes: log.changes,
        reason: log.reason,
        metadata: log.metadata,
        ipAddress: log.ipAddress || '127.0.0.1',
        createdAt: log.createdAt,
        timestamp: log.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      logs: formattedLogs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
