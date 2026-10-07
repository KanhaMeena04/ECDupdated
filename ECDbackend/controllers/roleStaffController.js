const Role = require('../models/Role');
const Staff = require('../models/Staff');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Seed default primary role if empty
const seedDefaultRoles = async () => {
  const count = await Role.countDocuments();
  if (count === 0) {
    const defaultRoles = [
      { name: 'Super Admin', accountType: 'Admin', description: 'Full system access', permissions: ['all'], isSystemDefault: true }
    ];
    await Role.insertMany(defaultRoles);
  }
};

// Roles API
exports.getAllRoles = async (req, res) => {
  try {
    // Clean up previous hardcoded demo roles so only user-created roles remain
    await Role.deleteMany({
      isSystemDefault: true,
      name: { $ne: 'Super Admin' }
    });

    await seedDefaultRoles();
    const roles = await Role.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: roles.length, roles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, accountType, description, permissions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A role with this name already exists' });
    }

    const role = await Role.create({
      name: name.trim(),
      accountType: accountType || 'Admin',
      description: (description || '').trim(),
      permissions: Array.isArray(permissions) ? permissions : [],
      isSystemDefault: false
    });

    return res.status(201).json({ success: true, message: 'Role created successfully', role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, accountType, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    if (name && name.trim()) role.name = name.trim();
    if (accountType) role.accountType = accountType;
    if (description !== undefined) role.description = description.trim();
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();
    return res.status(200).json({ success: true, message: 'Role updated successfully', role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    if (role.name === 'Super Admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete primary Super Admin role' });
    }
    await role.deleteOne();
    return res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Staff API
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate('role').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: staff.length, staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, roleId } = req.body;
    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and roleId are required' });
    }

    const existing = await Staff.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Staff with this email already exists' });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const staff = await Staff.create({
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      role: role._id,
      roleName: role.name
    });

    return res.status(201).json({ success: true, message: 'Staff created successfully', staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
    return res.status(200).json({ success: true, message: 'Staff member deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
