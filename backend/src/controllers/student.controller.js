const Student = require("../models/student.model");
const generateQR = require("../services/qr.service");
const { sendServerError } = require("../utils/error");


/*
GET dropdown list of academic years
Route:
GET /student/:id/years
Public route
*/

exports.getAcademicYears = async (req, res) => {

    try {

        const student = await Student.findById(
            req.params.id,
            { academicYears: 1 }
        );

        if (!student)
            return res.status(404).json({
                message: "Student not found"
            });

        const years = student.academicYears.map(
            y => y.year
        );

        res.json(years);

    } catch (error) {

        return sendServerError(
            res,
            "STUDENT_GET_YEARS",
            error
        );
    }

};



/*
GET selected academic year data
Route:
GET /student/:id/year/:year
Public route
*/

exports.getStudentByYear = async (req, res) => {

    try {

        const { id, year } = req.params;

        const student = await Student.findById(id)
            .populate("assignedTeacher", "name");

        if (!student)
            return res.status(404).json({
                message: "Student not found"
            });

        const academicYearData =
            student.academicYears.find(
                y => y.year === year
            );

        if (!academicYearData)
            return res.status(404).json({
                message: "Academic year not found"
            });

        res.json({
            name: student.name,
            enrollmentNumber: student.enrollmentNumber,
            rollNumber: student.rollNumber,
            phoneNumber: student.phoneNumber,
            profileImage: student.profileImage,
            className: student.className,
            section: student.section,
            assignedTeacherName:
                student.assignedTeacher?.name || "-",
            qrCode:
                student.qrCode ||
                await generateQR(student._id),
            academicYear: academicYearData
        });

    } catch (error) {

        return sendServerError(
            res,
            "STUDENT_GET_BY_YEAR",
            error
        );
    }

};



/*
GET latest academic year (default fallback)
Route:
GET /student/:id/latest
Public route
*/

exports.getLatestAcademicYear = async (req, res) => {

    try {

        const student = await Student.findById(
            req.params.id
        ).populate("assignedTeacher", "name");

        if (!student)
            return res.status(404).json({
                message: "Student not found"
            });

        if (student.academicYears.length === 0)
            return res.status(404).json({
                message: "No academic records found"
            });

        const latestYear =
            student.academicYears[
                student.academicYears.length - 1
            ];

        res.json({
            name: student.name,
            enrollmentNumber: student.enrollmentNumber,
            rollNumber: student.rollNumber,
            phoneNumber: student.phoneNumber,
            profileImage: student.profileImage,
            className: student.className,
            section: student.section,
            assignedTeacherName:
                student.assignedTeacher?.name || "-",
            qrCode:
                student.qrCode ||
                await generateQR(student._id),
            academicYear: latestYear
        });

    } catch (error) {

        return sendServerError(
            res,
            "STUDENT_GET_LATEST",
            error
        );
    }

};
