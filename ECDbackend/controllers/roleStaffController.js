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
    const { 
      name, 
      accountType, 
      description, 
      permissions,
      createAdminUser,
      adminName,
      adminEmail,
      adminMobile,
      adminPassword,
      adminPin 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A role with this name already exists' });
    }

    // Validate admin credentials if requested
    const shouldCreateAdmin = createAdminUser || (adminEmail || adminMobile || adminPassword || adminPin);
    const emailClean = (adminEmail || '').toLowerCase().trim();
    const mobileClean = (adminMobile || '').trim();
    const passClean = (adminPassword || adminPin || '').trim();
    const pinClean = (adminPin || adminPassword || '').trim();

    if (shouldCreateAdmin) {
      if (!emailClean && !mobileClean) {
        return res.status(400).json({ 
          success: false, 
          message: 'Either Admin Email or Mobile Number is required to create a login account' 
        });
      }
      if (!passClean && !pinClean) {
        return res.status(400).json({ 
          success: false, 
          message: 'Admin Password or Security PIN is required to create a login account' 
        });
      }

      const dupChecks = [];
      if (emailClean) dupChecks.push({ email: emailClean });
      if (mobileClean) {
        dupChecks.push({ mobile: mobileClean });
        dupChecks.push({ phone: mobileClean });
      }
      if (dupChecks.length > 0) {
        const dupUser = await User.findOne({ $or: dupChecks });
        if (dupUser) {
          return res.status(400).json({
            success: false,
            message: `A user with this ${dupUser.email === emailClean ? 'email address' : 'mobile number'} already exists`
          });
        }
      }
    }

    const role = await Role.create({
      name: name.trim(),
      accountType: accountType || 'Admin',
      description: (description || '').trim(),
      permissions: Array.isArray(permissions) ? permissions : [],
      isSystemDefault: false
    });

    let createdAdmin = null;
    if (shouldCreateAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passClean || pinClean, salt);

      createdAdmin = await User.create({
        name: (adminName || name || 'Admin').trim(),
        email: emailClean || undefined,
        mobile: mobileClean || undefined,
        phone: mobileClean || undefined,
        password: hashedPassword,
        pin: pinClean || undefined,
        role: 'admin',
        roleRef: role._id,
        roleName: role.name,
        permissions: role.permissions,
        isVerified: true,
        isDeleted: false,
        isBlocked: false
      });

      await Staff.create({
        name: createdAdmin.name,
        email: emailClean || `${mobileClean}@ecdkart.local`,
        phone: mobileClean || '',
        pin: pinClean || '',
        password: hashedPassword,
        role: role._id,
        roleName: role.name,
        user: createdAdmin._id,
        status: 'active'
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: shouldCreateAdmin 
        ? 'Role and Admin login account created successfully!' 
        : 'Role created successfully', 
      role,
      adminUser: createdAdmin ? {
        _id: createdAdmin._id,
        name: createdAdmin.name,
        email: createdAdmin.email,
        mobile: createdAdmin.mobile,
        roleName: role.name,
        permissions: role.permissions
      } : null
    });
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

    // Keep assigned Users and Staff synced with updated role name and permissions
    await User.updateMany(
      { roleRef: role._id },
      { roleName: role.name, permissions: role.permissions }
    );
    await Staff.updateMany(
      { role: role._id },
      { roleName: role.name }
    );

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
    const { name, email, phone, password, roleId, pin } = req.body;
    if (!name || (!email && !phone) || (!password && !pin) || !roleId) {
      return res.status(400).json({ success: false, message: 'Name, Email/Phone, Password/PIN, and roleId are required' });
    }

    const emailClean = (email || '').toLowerCase().trim();
    const phoneClean = (phone || '').trim();
    const passClean = (password || pin || '').trim();
    const pinClean = (pin || password || '').trim();

    if (emailClean) {
      const existing = await Staff.findOne({ email: emailClean });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Staff with this email already exists' });
      }
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passClean || pinClean, salt);

    // Create User record so staff can log in through the admin panel
    let user = null;
    const existingConditions = [];
    if (emailClean) existingConditions.push({ email: emailClean });
    if (phoneClean) {
      existingConditions.push({ mobile: phoneClean });
      existingConditions.push({ phone: phoneClean });
    }

    if (existingConditions.length > 0) {
      user = await User.findOne({ $or: existingConditions });
    }

    if (!user) {
      user = await User.create({
        name,
        email: emailClean || undefined,
        mobile: phoneClean || undefined,
        phone: phoneClean || undefined,
        password: hashedPassword,
        pin: pinClean || undefined,
        role: 'admin',
        roleRef: role._id,
        roleName: role.name,
        permissions: role.permissions,
        isVerified: true
      });
    } else {
      user.role = 'admin';
      user.roleRef = role._id;
      user.roleName = role.name;
      user.permissions = role.permissions;
      user.password = hashedPassword;
      if (pinClean) user.pin = pinClean;
      await user.save();
    }

    const staff = await Staff.create({
      name,
      email: emailClean || `${phoneClean}@ecdkart.local`,
      phone: phoneClean,
      pin: pinClean,
      password: hashedPassword,
      role: role._id,
      roleName: role.name,
      user: user._id
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
    if (staff.user) {
      await User.findByIdAndDelete(staff.user);
    }
    return res.status(200).json({ success: true, message: 'Staff member deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
