const Student = require("../models/student.model");


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

        res.status(500).json({
            message: "Server error"
        });

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

        const student = await Student.findById(id);

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
            profileImage: student.profileImage,
            academicYear: academicYearData
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error"
        });

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
        );

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
            profileImage: student.profileImage,
            academicYear: latestYear
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error"
        });

    }

};