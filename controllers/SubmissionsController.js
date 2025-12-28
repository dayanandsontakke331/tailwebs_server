const custom = require('../config/custom');
const Assignment = require('../models/Assignments');
const Submission = require('../models/Submissions');
const nextSubmissionStatus = require('../helpers/SubmissionTransitions');

exports.submitAssignment = async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment)
        return res.status(404).json({ message: 'Assignment not found' });

    if (assignment.status !== 'Published')
        return res.status(400).json({ message: "Assignment not open" });

    if (assignment.dueDate < Date.now())
        return res.status(400).json({ message: "Submission due date closed" });

    const exists = await Submission.findOne({
        assignment: assignment._id,
        student: req.user._id
    });

    if (exists) {
        return res.status(400).json({
            success: false,
            message: "Submission allowed only one time"
        });
    }

    const submission = await Submission.create({
        assignment: assignment._id,
        student: req.user._id,
        answer: req.body.answer,
        file: req.file_path
    });

    return res.status(201).json({ success: true, submission });
};

exports.submissions = async (req, res) => {
    try {
        let match = {};

        if (req.user.role === "student") {
            match.student = req.user._id;
        }

        if (req.query.status) {
            match.status = req.query.status;
        }

        const search = req.query.search?.trim();
        if (search) {
            match.$or = [
                { answer: { $regex: search, $options: "i" } }
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
                    from: "assignments",
                    localField: "assignment",
                    foreignField: "_id",
                    as: "assignment"
                }
            },
            { $unwind: { path: "$assignment", preserveNullAndEmptyArrays: true } },
            ...(req.user.role === "teacher"
                ? [
                    {
                        $match: {
                            "assignment.teacher": req.user._id
                        }
                    }
                ]
                : []),
            {
                $lookup: {
                    from: "users",
                    localField: "student",
                    foreignField: "_id",
                    as: "student"
                }
            },
            { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
            ...(search
                ? [
                    {
                        $match: {
                            "assignment.title": { $regex: search, $options: "i" }
                        }
                    }
                ]
                : []),

            { $sort: sort },

            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: pageSize }],
                    totalCount: [{ $count: "count" }]
                }
            }
        ];

        const result = await Submission.aggregate(pipeline);
        const submissions = result[0].data || [];
        const total = result[0].totalCount?.[0]?.count || 0;

        return res.status(200).json({
            success: true,
            count: total,
            data: submissions
        });

    } catch (error) {
        console.error("Error fetching submissions:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching submissions"
        });
    }
};

exports.updateSubmissionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (req.user.role !== "teacher") {
            return res.status(403).json({
                success: false,
                message: "Only teachers can update submission status",
            });
        }

        const allowedStatus = ["Submitted", "Reviewed"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed: ${allowedStatus.join(", ")}`,
            });
        }

        const submission = await Submission.findById(id);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        const result = nextSubmissionStatus(submission, status);
        console.log(result);

        if (result.error) {
            return res.status(400).json({
                success: false,
                message: "Invalid status transition"
            });
        }

        submission.status = status;
        await submission.save();

        return res.status(200).json({
            success: true,
            message: "Submission status updated successfully",
            data: submission,
        });

    } catch (error) {
        console.error("Update Submission Status Error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating submission status",
        });
    }
};

exports.deleteSubmission = async (req, res) => {
    try {
        const submissionId = req.params.id;

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        if (submission.status !== "Submitted") {
            return res.status(400).json({
                success: false,
                message: "Only submitted submissions can be deleted."
            });
        }

        const assignment = await Assignment.findById(submission.assignment);
        if (assignment.status === "Completed") {
            return res.status(400).json({
                success: false,
                message: "Submissions cannot be deleted after assignment completion"
            });
        }
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        if (assignment.status === "Completed") {
            return res.status(400).json({
                success: false,
                message: "Submissions cannot be deleted after assignment completion"
            });
        }

        await submission.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Submission deleted successfully"
        });

    } catch (error) {
        console.log("Delete Submission Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};