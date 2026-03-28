const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    role: {
        type: String,
        enum: ["admin", "teacher"],
        required: true
    },

    profileImage: String,

    assignedStudents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        }
    ]
},
{ timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
