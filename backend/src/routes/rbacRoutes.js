const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const User = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');

const router = express.Router();

const validId = (id) => typeof id === 'string' && /^[1-9]\d*$/.test(id);
const validNameAndSlug = (input = {}) => {
    const name = input?.name;
    const slug = input?.slug;
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 255 &&
        typeof slug === 'string' && slug.trim().length > 0 && slug.trim().length <= 255;
};
const handleError = (res, error, context) => {
    if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
        return res.status(409).json({ message: 'A record with that name or slug already exists.' });
    }

    console.error(`${context}:`, error);
    return res.status(500).json({ message: 'Server error.' });
};

router.get('/permissions', authenticate, checkPermission(['permission.read', 'rolepermission.read']), async (_req, res) => {
    try {
        const permissions = await Permission.findAll({ order: [['id', 'DESC']] });
        return res.json(permissions);
    } catch (error) {
        return handleError(res, error, 'Could not list permissions');
    }
});

router.post('/permissions', authenticate, checkPermission('permission.store'), async (req, res) => {
    const { name, slug, status = 'inactive' } = req.body || {};
    if (!validNameAndSlug({ name, slug }) || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Provide a name, slug, and valid permission status.' });
    }

    try {
        const permission = await Permission.create({ name: name.trim(), slug: slug.trim(), status });
        return res.status(201).json(permission);
    } catch (error) {
        return handleError(res, error, 'Could not create permission');
    }
});

router.put('/permissions/:id', authenticate, checkPermission('permission.edit'), async (req, res) => {
    const { name, slug, status } = req.body || {};
    if (!validId(req.params.id) || !validNameAndSlug({ name, slug }) || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Provide a valid permission ID, name, slug, and status.' });
    }

    try {
        const permission = await Permission.findByPk(req.params.id);
        if (!permission) return res.status(404).json({ message: 'Permission not found.' });
        await permission.update({ name: name.trim(), slug: slug.trim(), status });
        return res.json(permission);
    } catch (error) {
        return handleError(res, error, 'Could not update permission');
    }
});

router.delete('/permissions/:id', authenticate, checkPermission('permission.delete'), async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid permission ID.' });

    try {
        const permission = await Permission.findByPk(req.params.id);
        if (!permission) return res.status(404).json({ message: 'Permission not found.' });

        await sequelize.transaction(async (transaction) => {
            await RolePermission.destroy({
                where: { permission_id: permission.id },
                transaction,
            });
            await permission.destroy({ transaction });
        });
        return res.json({ message: 'Permission deleted successfully.' });
    } catch (error) {
        return handleError(res, error, 'Could not delete permission');
    }
});

router.get('/roles', authenticate, checkPermission(['role.read', 'rolepermission.read', 'user.role.assign']), async (_req, res) => {
    try {
        const roles = await Role.findAll({
            include: [{
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
                attributes: ['id', 'name', 'slug', 'status'],
            }],
            order: [['id', 'DESC']],
        });
        return res.json(roles.map((role) => {
            const formattedRole = role.get({ plain: true });
            formattedRole.permissions = role.permissions.map((permission) => ({
                ...permission.get({ plain: true }),
                permission_id: permission.id,
            }));
            return formattedRole;
        }));
    } catch (error) {
        return handleError(res, error, 'Could not list roles');
    }
});

router.post('/roles', authenticate, checkPermission('role.store'), async (req, res) => {
    if (!validNameAndSlug(req.body)) {
        return res.status(400).json({ message: 'Provide a role name and slug.' });
    }

    try {
        const role = await Role.create({
            name: req.body.name.trim(),
            slug: req.body.slug.trim(),
        });
        return res.status(201).json({ ...role.get({ plain: true }), permissions: [] });
    } catch (error) {
        return handleError(res, error, 'Could not create role');
    }
});

router.put('/roles/:id', authenticate, checkPermission('role.edit'), async (req, res) => {
    if (!validId(req.params.id) || !validNameAndSlug(req.body)) {
        return res.status(400).json({ message: 'Provide a valid role ID, name, and slug.' });
    }

    try {
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found.' });
        await role.update({ name: req.body.name.trim(), slug: req.body.slug.trim() });
        return res.json(role);
    } catch (error) {
        return handleError(res, error, 'Could not update role');
    }
});

router.delete('/roles/:id', authenticate, checkPermission('role.delete'), async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid role ID.' });

    try {
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found.' });

        await sequelize.transaction(async (transaction) => {
            await User.update({ role_id: null }, { where: { role_id: role.id }, transaction });
            await RolePermission.destroy({ where: { role_id: role.id }, transaction });
            await role.destroy({ transaction });
        });
        return res.json({ message: 'Role deleted successfully.' });
    } catch (error) {
        return handleError(res, error, 'Could not delete role');
    }
});

const updateRolePermissions = async (req, res) => {
    const { role_id: roleId, permission_ids: permissionIds } = req.body || {};
    if (!validId(String(roleId ?? '')) || !Array.isArray(permissionIds) ||
        permissionIds.some((id) => !validId(String(id)))) {
        return res.status(400).json({ message: 'Provide a role ID and an array of valid permission IDs.' });
    }

    try {
        await sequelize.transaction(async (transaction) => {
            const role = await Role.findByPk(roleId, { transaction });
            if (!role) {
                const error = new Error('Role not found.');
                error.status = 404;
                throw error;
            }

            const uniquePermissionIds = [...new Set(permissionIds.map(String))];
            const permissions = uniquePermissionIds.length
                ? await Permission.findAll({
                    where: { id: { [Op.in]: uniquePermissionIds } },
                    attributes: ['id'],
                    transaction,
                })
                : [];
            if (permissions.length !== uniquePermissionIds.length) {
                const error = new Error('One or more permissions were not found.');
                error.status = 400;
                throw error;
            }

            await RolePermission.destroy({ where: { role_id: role.id }, transaction });
            if (uniquePermissionIds.length) {
                await RolePermission.bulkCreate(
                    uniquePermissionIds.map((permissionId) => ({
                        role_id: role.id,
                        permission_id: permissionId,
                    })),
                    { transaction },
                );
            }
        });
        return res.json({ message: 'Role permissions updated successfully.' });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        return handleError(res, error, 'Could not update role permissions');
    }
};

router.post('/role-permissions', authenticate, checkPermission('rolepermission.store'), updateRolePermissions);
router.put('/role-permissions', authenticate, checkPermission('rolepermission.edit'), updateRolePermissions);

router.get('/users', authenticate, checkPermission('user.read'), async (_req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role_id'],
            include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'slug'], required: false }],
            order: [['id', 'DESC']],
        });
        return res.json(users);
    } catch (error) {
        return handleError(res, error, 'Could not list users');
    }
});

router.patch('/users/:id/role', authenticate, checkPermission('user.role.assign'), async (req, res) => {
    const { role_id: roleId } = req.body || {};
    if (!validId(req.params.id) || (roleId !== null && !validId(String(roleId)))) {
        return res.status(400).json({ message: 'Provide a valid user ID and role ID (or null to unassign).' });
    }

    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (roleId !== null && !(await Role.findByPk(roleId))) {
            return res.status(404).json({ message: 'Role not found.' });
        }

        await user.update({ role_id: roleId });
        return res.json({ message: 'User role updated successfully.', user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
        } });
    } catch (error) {
        return handleError(res, error, 'Could not update user role');
    }
});

module.exports = router;
