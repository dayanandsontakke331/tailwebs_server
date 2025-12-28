const Assignment = require('../models/Assignments');
const { ASSIGNMENT_STATUS } = require('../config/custom');
const custom = require('../config/custom');
const nextStatus = require('../helpers/AssignmentTransitions')

exports.newAssignment = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }

        if (!description) {
            return res.status(400).json({
                success: false,
                message: "Description must be less than 2000 characters"
            });
        }

        if (req.user.role != custom.roles[1]) { // teachers only
            return res.status(400).json({
                success: false,
                message: "Access Denied"
            });
        }

        const attachment = req.file_path || "";

        const assignment = await Assignment.create({
            title: title.trim(),
            description: description ? description.trim() : "",
            attachment,
            dueDate: dueDate,
            teacher: req.user._id,
            status: ASSIGNMENT_STATUS.DRAFT
        });

        return res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            data: assignment
        });

    } catch (error) {
        console.log("Error creating assignment", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while creating the assignment"
        });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ 
                success: false, 
                message: "Assignment not found" 
            });
        }

        if (assignment.status !== 'Draft') {
            return res.status(400).json({ 
                success: false, 
                message: "Only Draft assignments can be edited" 
            });
        }

        const updateFields = ["title", 'description', 'dueDate', 'attachment'];
        
        const updates = {};
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (req.file_path) {
            if (assignment.attachment && fs.existsSync(assignment.attachment)) {
                fs.unlinkSync(assignment.attachment);
            }
            updates.attachment = req.file_path;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No valid fields to update" 
            });
        }

        Object.assign(assignment, updates);
        await assignment.save();

        return res.json({ 
            success: true, 
            message: "Assignment updated successfully",
            data: assignment 
        });

    } catch (error) {
        console.log("Error updating assignment", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error updating assignment",
            error: error.message 
        });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: "Assignment ID is required"
            });
        }

        if (!req.body.status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        let assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        let status = nextStatus(assignment, req.body.status);
        console.log("status", status)
        if (!status || status?.error) {
            return res.status(400).json({
                success: false,
                message: "Invalid status transition"
            });
        }

        assignment.status = req.body.status;
        await assignment.save();

        return res.status(200).json({
            success: true,
            message: `Assignment status updated to ${req.body.status}`,
            data: assignment
        });

    } catch (error) {
        console.log("Error updating assignment status:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating assignment status"
        });
    }
};

exports.assignments = async (req, res) => {
    try {
        let match = {};

        const allowedStatuses = Object.values(ASSIGNMENT_STATUS);
        if (req.query.status && !allowedStatuses.includes(req.query.status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status value. Allowed values ${allowedStatuses.join(', ')}`
            });
        }

        if (req.query.status) {
            match.status = req.query.status;
        }

        if (req.user.role === custom.roles[0]) { // student
            match.status = { $in: [ASSIGNMENT_STATUS.PUBLISHED] };
        }

        if (req.user.role === custom.roles[1]) { // teacher
            match.teacher = req.user._id;
        }

        const search = req.query.search?.trim();
        if (search) {
            match.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;

        let sort = { createdAt: -1 };
        if (req.query.sortField && req.query.sortOrder) {
            sort = {
                [req.query.sortField]: req.query.sortOrder === "asc" ? 1 : -1
            };
        }

        const pipeline = [
            { $match: match },

            {
                $lookup: {
                    from: "submissions",
                    localField: "_id",
                    foreignField: "assignment",
                    as: "submissions"
                }
            },
            {
                $addFields: {
                    submissionsCount: { $size: "$submissions" },
                }
            },
            ...(req.user.role === custom.roles[0]
                ? [
                    {
                        $match: {
                            $or: [
                                { submissions: { $eq: [] } },
                                { submissions: { $not: { $elemMatch: { student: req.user._id } } } }
                            ]
                        }
                    }
                ]
                : []
            ),

            { $sort: sort },

            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: pageSize }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await Assignment.aggregate(pipeline);
        const assignments = result[0].data || [];
        const total = result[0].totalCount?.[0]?.count || 0;

        return res.status(200).json({
            success: true,
            count: total,
            data: assignments
        });

    } catch (error) {
        console.log("Error fetching assignments:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching assignments"
        });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;

        const assignment = await Assignment.findOne({
            _id: assignmentId,
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        if (assignment.status !== "Draft") {
            return res.status(400).json({
                success: false,
                message: "Only draft assignments can be deleted"
            });
        }

        await assignment.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Assignment deleted successfully"
        });

    } catch (error) {
        console.log("Delete Assignment Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

