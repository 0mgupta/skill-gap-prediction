const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "Username already taken"],
        required: true
    },
    email: {
        type: String,
        unique : [true, "email already taken"],
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
})
const usermodel = mongoose.model("User", userSchema)

module.exports = usermodel