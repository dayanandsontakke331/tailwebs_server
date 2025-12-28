const { ASSIGNMENT_STATUS } = require('../config/custom');

// status transition map
const STATUS_TRANSITIONS = {
    [ASSIGNMENT_STATUS.DRAFT]: {
        Published: ASSIGNMENT_STATUS.PUBLISHED
    },
    [ASSIGNMENT_STATUS.PUBLISHED]: {
        Completed: ASSIGNMENT_STATUS.COMPLETED
    },
    [ASSIGNMENT_STATUS.COMPLETED]: {}
};

module.exports = function nextStatus(assignment, action) {
    if (!action) {
        return { error: 'Action is mandatory' }
    }

    if (!assignment || !assignment.status) {
        return { error: 'Assignment is invalid' }
    }

    const currentStatus = assignment.status;
    const status = STATUS_TRANSITIONS[currentStatus]?.[action];

    if (!status) {
        return { error: `Invalid transition from ${currentStatus} using action ${action}` }
    }

    return { status: status };
};