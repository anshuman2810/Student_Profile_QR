const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    name: String,
    marks: Number,
    grade: String
}, { _id: false });


const coCurricularSchema = new mongoose.Schema({
    title: String,
    level: String,
    position: String
}, { _id: false });


const academicYearSchema = new mongoose.Schema({

    year: {
        type: String,
        required: true
    },

    className: String,

    section: String,

    attendance: Number,

    subjects: [subjectSchema],

    coCurricular: [coCurricularSchema],

    teacherRemarks: String

}, { _id: false });


const studentSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    enrollmentNumber: {
        type: String,
        unique: true,
        required: true
    },

    dateOfBirth: Date,

    gender: String,

    profileImage: String,

    qrCode: String,

    academicYears: [academicYearSchema],

    assignedTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true });

studentSchema.index({
    enrollmentNumber: 1
});

studentSchema.index({
    "academicYears.year": 1
});


module.exports = mongoose.model("Student", studentSchema);