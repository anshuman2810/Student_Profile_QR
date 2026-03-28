const Student = require("../models/student.model");


exports.addAcademicYear = async (req, res) => {

    const student = await Student.findById(req.params.id);

    student.academicYears.push(req.body);

    await student.save();

    res.json(student);
};


exports.updateAcademicYear = async (req, res) => {

    const student = await Student.findById(req.params.id);

    const yearIndex =
        student.academicYears.findIndex(
            y => y.year === req.body.year
        );

    student.academicYears[yearIndex] = req.body;

    await student.save();

    res.json(student);
};


exports.getAssignedStudents = async (req, res) => {

    const students = await Student.find({
        assignedTeacher: req.user.id
    });

    res.json(students);
};