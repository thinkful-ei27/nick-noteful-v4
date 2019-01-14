'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullname: {type: String},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true}
});

userSchema.set('toJSON', {
    virtuals: true, 
    transform: (doc, result) => {
        delete result._id;
        delete result.__v;
        delete result.password;
    }
});

userSchema.methods.validatePassword = function (incomingPassword) {
    return bcrypt.compare(incomingPassword, this.password);
  };

userSchema.statics.hashPassword = function (incomingPassword) {
    const digest = bcrypt.hash(incomingPassword, 12);
    return digest;
}

module.exports = mongoose.model('User', userSchema);