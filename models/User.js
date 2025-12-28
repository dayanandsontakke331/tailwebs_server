const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { roles } = require('../config/custom');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: roles, required: true },
    createdAt: { type: Number },
    updatedAt: { type: Number }
});

userSchema.pre('save', async function () {
    const now = Date.now();

    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }

    if (!this.createdAt) {
        this.createdAt = now;
    }
    this.updatedAt = now;
});

userSchema.pre(['updateOne', 'findOneAndUpdate'], async function () {
    const update = this.getUpdate();

    if (update?.password) {
        update.password = await bcrypt.hash(update.password, SALT_ROUNDS);
    }

    update.updatedAt = Date.now();
    this.setUpdate(update);
});

userSchema.methods.comparePassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
