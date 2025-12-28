function VerifyRole(roles) {
    return function (req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            if (!req.user.role) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. No role assigned"
                });
            }

            let allowedRoles = Array.isArray(roles) ? roles : [roles];
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Insufficient permissions"
                });
            }

            next();
        } catch (error) {
            console.error("Role validation error:", error);
            return res.status(500).json({
                success: false,
                message: "Authorization failed"
            });
        }
    };
}

module.exports = VerifyRole;