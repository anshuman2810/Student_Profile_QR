const User = require("../models/user.model");
const Student = require("../models/student.model");
const generateQR = require("../services/qr.service");
const bcrypt = require("bcryptjs");


exports.createTeacher = async (req, res) => {

    const hashedPassword =
        await bcrypt.hash(req.body.password, 10);

    const teacher = await User.create({
        ...req.body,
        password: hashedPassword,
        role: "teacher"
    });

    res.json(teacher);
};


exports.createStudent = async (req, res) => {

    const student = await Student.create(req.body);

    const qr = await generateQR(student._id);

    student.qrCode = qr;

    await student.save();

    res.json(student);
};