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


const attendanceRecordSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["present", "absent", "holiday"],
        required: true
    }
}, { _id: false });


const testReportSchema = new mongoose.Schema({
    subjectName: String,
    testName: String,
    totalMarks: Number,
    receivedMarks: Number
}, { _id: false });


const academicYearSchema = new mongoose.Schema({

    year: {
        type: String,
        required: true
    },

    className: String,

    section: String,

    attendance: Number,

    totalDays: {
        type: Number,
        default: 0
    },

    presentDays: {
        type: Number,
        default: 0
    },

    attendancePercentage: {
        type: Number,
        default: 0
    },

    attendanceRecords: [attendanceRecordSchema],

    subjects: [subjectSchema],

    testReports: [testReportSchema],

    coCurricular: [coCurricularSchema],

    teacherRemarks: String

}, { _id: false });


const studentSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    enrollmentNumber: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        index: true
    },

    rollNumber: {
        type: String,
        required: true,
        trim: true
    },

    dateOfBirth: Date,

    gender: {
        type: String,
        enum: ["Male", "Female", "Other", ""]
    },

    phoneNumber: {
        type: String,
        trim: true
    },

    profileImage: String,

    className: String,

    section: String,

    qrCode: String,

    academicYears: [academicYearSchema],

    assignedTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true });

studentSchema.index({
    assignedTeacher: 1,
    className: 1,
    section: 1
});

studentSchema.index({
    "academicYears.year": 1
});

studentSchema.index({
    assignedTeacher: 1,
    createdAt: -1
});

studentSchema.index({
    assignedTeacher: 1,
    "academicYears.year": 1,
    className: 1,
    section: 1
});


module.exports = mongoose.model("Student", studentSchema);
