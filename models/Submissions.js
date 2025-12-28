const mongoose = require('mongoose');
const custom = require('../config/custom');

const SUBMISSION_STATUS = Object.values(custom.SUBMISSION_STATUS);

const submissionSchema = new mongoose.Schema({
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'assignment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    answer: { type: String, required: true, trim: true },
    file: { type: String },
    status: { type: String, enum: SUBMISSION_STATUS, default: SUBMISSION_STATUS[0] },
    createdAt: { type: Number },
    updatedAt: { type: Number }
});

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

submissionSchema.pre('save', async function () {
    const now = Date.now();

    if (!this.createdAt) {
        this.createdAt = now;
    }
    this.updatedAt = now;
});


submissionSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], async function () {
    this.set({ updatedAt: Date.now() });
});


module.exports = mongoose.model('submission', submissionSchema);
