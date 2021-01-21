const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: 3,
        max: 20
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024
    },

    avatar: {
        type: String,
        default: "http://avatars.atelier801.com/0/0.jpg",
        required: false,
    },

    colorName: {
        type: String,
        default: "",
        required: false,
    },

    privLevel: {
        type: Number,
        default: 1,
        required: false
    },

    ipAddress: {
        type: String,
        default: 0,
        required: false,
    },

    createdAt: {
        type: Object,
        default: new Date(),
        required: false
    }
})

module.exports = mongoose.model('User', userSchema);