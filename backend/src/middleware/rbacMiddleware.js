const { Op } = require('sequelize');
const RolePermission = require('../models/RolePermission');
const Permission = require('../models/Permission');

const checkPermission = (requiredSlug) => {
    const requiredSlugs = Array.isArray(requiredSlug) ? requiredSlug : [requiredSlug];

    return async (req, res, next) => {
        try {
            if (!req.user?.role_id) {
                return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
            }

            const assignment = await RolePermission.findOne({
                where: { role_id: req.user.role_id },
                include: [{
                    model: Permission,
                    as: 'permission',
                    where: { slug: { [Op.in]: requiredSlugs }, status: 'active' },
                    attributes: ['id'],
                }],
            });

            if (!assignment) {
                return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
            }

            return next();
        } catch (error) {
            console.error(`Permission check failed for "${requiredSlugs.join(', ')}":`, error);
            return res.status(500).json({ message: 'Server error checking permissions.' });
        }
    };
};

module.exports = { checkPermission };