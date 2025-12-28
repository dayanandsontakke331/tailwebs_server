
const express = require("express");
const UserController = require("../controllers/UserController");
const AssignmentController = require("../controllers/AssignmentsController");
const SubmissionsController = require("../controllers/SubmissionsController");
const DashboardController = require('../controllers/DashboardController');
const { auth, roles } = require("../middlewares/Auth");
const { RouteGroup } = require('../utils/RoleGroup');
const SaveUploadFiles = require("../middlewares/SaveUploadFiles");

const endpoints = express.Router(); // router as endpoints

// Auth endpoints
endpoints.get("/ping", /*auth.verify,*/ roles.open, UserController.pong);
endpoints.post("/register", roles.open, UserController.register);
endpoints.post("/login", roles.open, UserController.login);
endpoints.post("/refreshToken", roles.open, UserController.refreshToken);

// Assignments endpoints
endpoints.post(
    "/create/assignment",
    auth.verify,
    roles.teacher,
    SaveUploadFiles({ where: "assignments", fileSize: 10 * 1024 * 1024 }),
    AssignmentController.newAssignment
);
endpoints.put("/update/assignment/:id", auth.verify, roles.teacher,SaveUploadFiles({ where: "assignments", fileSize: 10 * 1024 * 1024 }), AssignmentController.updateAssignment);
endpoints.post("/update/assignment/status/:id", auth.verify, roles.teacher, AssignmentController.updateStatus);
endpoints.get("/assignments/all", auth.verify, roles.teacherOrStudent, AssignmentController.assignments);
endpoints.get("/assignments/delete/:id", auth.verify, roles.teacher, AssignmentController.deleteAssignment);

// Submissions endpoints
endpoints.post("/assignments/submit/:id",
    auth.verify,
    roles.student,
    SaveUploadFiles({ where: "submissions", fileSize: 10 * 1024 * 1024 }),
    SubmissionsController.submitAssignment
);

endpoints.get("/submissions/all", auth.verify, roles.teacherOrStudent, SubmissionsController.submissions);
endpoints.get("/submissions/:id", auth.verify, roles.teacher, SubmissionsController.deleteSubmission);
endpoints.put("/submissions/status/:id", auth.verify, roles.teacher, SubmissionsController.updateSubmissionStatus);
endpoints.post("/submissions/delete/:id", auth.verify, roles.teacher, SubmissionsController.deleteSubmission);

// Dashboard endpoints
endpoints.get("/dashboard/stats", auth.verify, roles.teacherOrStudent, DashboardController.getDashboardStats);

module.exports = endpoints;

// let teacherRoutes = RouteGroup(endpoints, [auth.verify, roles.teacher]);
// teacherRoutes.post("/create/assignment", AssignmentController.newAssignment);
// teacherRoutes.post("/update/assignment", AssignmentController.updateAssignment);