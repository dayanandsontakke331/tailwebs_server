const mongoose = require('mongoose');
const custom = require('../config/custom');

const ASSIGNMENT_STATUS = Object.values(custom.ASSIGNMENT_STATUS);

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    attachment: { type: String },
    dueDate: { type: Number, required: true },
    status: { type: String, enum: ASSIGNMENT_STATUS, default: ASSIGNMENT_STATUS[0], required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    createdAt: { type: Number },
    updatedAt: { type: Number }
});

assignmentSchema.pre('save', function () {
    const now = Date.now();
    if (!this.createdAt) this.createdAt = now;
    this.updatedAt = now;
});

assignmentSchema.pre(
    ['updateOne', 'findOneAndUpdate', 'updateMany'],
    function () {
        this.set({ updatedAt: Date.now() });
    }
);

module.exports = mongoose.model('assignment', assignmentSchema);
