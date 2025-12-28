const { SUBMISSION_STATUS } = require('../config/custom'); 

const SUBMISSION_STATUS_TRANSITIONS = {
    [SUBMISSION_STATUS.SUBMITTED]: {
        Reviewed: SUBMISSION_STATUS.REVIEWED
    },
    [SUBMISSION_STATUS.REVIEWED]: {}
};

module.exports = function nextSubmissionStatus(submission, action) {
    if (!action) {
        return { error: 'Action is mandatory' };
    }

    if (!submission || !submission.status) {
        return { error: 'Submission is invalid' };
    }

    const currentStatus = submission.status;
    const nextStatus = SUBMISSION_STATUS_TRANSITIONS[currentStatus]?.[action];

    if (!nextStatus) {
        return { error: `Invalid transition from ${currentStatus} using action ${action}` };
    }

    return { status: nextStatus };
};
