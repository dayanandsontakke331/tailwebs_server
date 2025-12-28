const { roles: role } = require("../config/custom.js");
const verifyToken = require("./VerifyToken.js");
const VerifyRole = require("../utils/VerifyRole.js");

const auth = { verify: verifyToken, role: VerifyRole };

const roles = {
    all: auth.role(role),
    open: (req, res, next) => next(),
    student: auth.role(role[0]),
    teacher: auth.role(role[1]),
    teacherOrStudent: auth.role([role[0], role[1]]),
};

module.exports = { auth, roles };