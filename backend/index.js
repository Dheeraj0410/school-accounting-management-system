const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./src/config/db');

const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');
const RolePermission = require('./src/models/RolePermission');

const authRoutes = require('./src/routes/authRoutes');
const rbacRoutes = require('./src/routes/rbacRoutes');

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role', onDelete: 'SET NULL' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users', onDelete: 'SET NULL' });
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });
Permission.hasMany(RolePermission, { foreignKey: 'permission_id', as: 'roleAssignments' });

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', rbacRoutes);

const PORT = process.env.PORT || 5000;

const adminPermissions = [
  ['Read roles', 'role.read'],
  ['Create roles', 'role.store'],
  ['Edit roles', 'role.edit'],
  ['Delete roles', 'role.delete'],
  ['Read permissions', 'permission.read'],
  ['Create permissions', 'permission.store'],
  ['Edit permissions', 'permission.edit'],
  ['Delete permissions', 'permission.delete'],
  ['Read role permissions', 'rolepermission.read'],
  ['Assign role permissions', 'rolepermission.store'],
  ['Edit role permissions', 'rolepermission.edit'],
  ['Read users', 'user.read'],
  ['Assign user roles', 'user.role.assign'],
];

async function seedRbacDefaults() {
  const [adminRole] = await Role.findOrCreate({
    where: { slug: 'admin' },
    defaults: { name: 'Administrator', slug: 'admin' },
  });
  await Role.findOrCreate({
    where: { slug: 'accountant' },
    defaults: { name: 'Accountant', slug: 'accountant' },
  });

  for (const [name, slug] of adminPermissions) {
    const [permission] = await Permission.findOrCreate({
      where: { slug },
      defaults: { name, slug, status: 'active' },
    });
    if (permission.status !== 'active') {
      await permission.update({ status: 'active' });
    }
    await RolePermission.findOrCreate({
      where: { role_id: adminRole.id, permission_id: permission.id },
      defaults: { role_id: adminRole.id, permission_id: permission.id },
    });
  }

}

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be set before starting the API.');
    }

    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    await seedRbacDefaults();
    console.log('Database models synchronized and RBAC defaults ready.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection or sync error:', error);
    process.exitCode = 1;
  }
}

startServer();