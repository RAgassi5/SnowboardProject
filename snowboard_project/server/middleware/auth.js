/**
 * Role-Based Access Control Middleware (Factory Function)
 *
 * Usage: auth(['admin', 'manager'])
 *
 * Reads the x-user-role header and checks against the allowedRoles array.
 * Returns 403 if the role is missing or not in the allowed list.
 */
const auth = (allowedRoles) => {
  return (req, res, next) => {
    const role = req.headers["x-user-role"];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
          details: {}
        }
      });
    }

    next();
  };
};

module.exports = auth;
