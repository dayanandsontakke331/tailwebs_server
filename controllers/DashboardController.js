const custom = require('../config/custom');
const Assignment = require('../models/Assignments');
const Submission = require('../models/Submissions');

const normalizeStats = (statuses, statsArray) => {
    const map = {};
    statuses.forEach(s => (map[s] = 0));

    statsArray.forEach(item => {
        map[item._id] = item.count;
    });

    return map;
};


exports.getDashboardStats = async (req, res) => {
    try {
        const { _id: userId, role } = req.user;

        if (role === custom.roles[1]) {
            return getTeacherStats(userId, res);
        }

        if (role === custom.roles[0]) {
            return getStudentStats(userId, res);
        }

        return res.status(403).json({ success: false, message: 'Invalid role' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

const getTeacherStats = async (teacherId, res) => {

    const assignmentAgg = await Assignment.aggregate([
        { $match: { teacher: teacherId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const assignmentStats = normalizeStats(
        Object.values(custom.ASSIGNMENT_STATUS),
        assignmentAgg
    );

    const totalAssignments = Object.values(assignmentStats).reduce((a, b) => a + b, 0);

    const submissionAgg = await Submission.aggregate([
        {
            $lookup: {
                from: 'assignments',
                localField: 'assignment',
                foreignField: '_id',
                as: 'assignment'
            }
        },
        { $unwind: '$assignment' },
        { $match: { 'assignment.teacher': teacherId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const submissionStats = normalizeStats(
        Object.values(custom.SUBMISSION_STATUS),
        submissionAgg
    );

    const totalSubmissions = Object.values(submissionStats).reduce((a, b) => a + b, 0);

    return res.json({
        success: true,
        role: 'teacher',
        data: {
            assignments: {
                ...assignmentStats,
                total: totalAssignments
            },
            submissions: {
                ...submissionStats,
                total: totalSubmissions
            }
        }
    });
};

const getStudentStats = async (studentId, res) => {
    const published = await Assignment.countDocuments({
        status: custom.ASSIGNMENT_STATUS.PUBLISHED
    });

    const submittedAssignmentIds = await Submission.distinct('assignment', {
        student: studentId
    });

    const pending = await Assignment.countDocuments({
        status: custom.ASSIGNMENT_STATUS.PUBLISHED,
        _id: { $nin: submittedAssignmentIds }
    });

    const submissionAgg = await Submission.aggregate([
        { $match: { student: studentId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const submissionStats = normalizeStats(
        Object.values(custom.SUBMISSION_STATUS),
        submissionAgg
    );

    const totalSubmissions = Object.values(submissionStats).reduce((a, b) => a + b, 0);

    return res.json({
        success: true,
        role: 'student',
        data: {
            assignments: {
                Published: published,
                Pending: pending
            },
            submissions: {
                ...submissionStats,
                total: totalSubmissions
            }
        }
    });
};