const User = require("../models/user.model");
const Student = require("../models/student.model");
const generateQR = require("../services/qr.service");
const bcrypt = require("bcryptjs");
const {
    validatePassword,
    validateProfileImage
} = require("../utils/validation");
const { sendServerError } = require("../utils/error");

const DEFAULT_ACADEMIC_YEAR = "2025-26";

function sanitizeStudentPayload(payload) {

    return {
        ...payload,
        name: String(payload.name || "").trim(),
        rollNumber: String(payload.rollNumber || "").trim(),
        academicYear: String(payload.academicYear || "").trim(),
        className: String(payload.className || "").trim(),
        section: String(payload.section || "").trim().toUpperCase(),
        gender: String(payload.gender || "").trim(),
        phoneNumber: String(payload.phoneNumber || "").trim()
    };
}

function findAcademicYear(student, year) {

    if (!year) return null;

    return (student.academicYears || []).find(
        item => item.year === year
    ) || null;
}


function getPlacement(student, year) {

    const matchedYear =
        findAcademicYear(student, year);
    const useCurrentPlacement =
        year === DEFAULT_ACADEMIC_YEAR &&
        !matchedYear;

    return {
        academicYear:
            matchedYear ||
            (useCurrentPlacement
                ? { year }
                : null),
        className:
            matchedYear?.className ||
            student.className ||
            "",
        section:
            matchedYear?.section ||
            student.section ||
            ""
    };
}


function matchesStudentFilters(student, filters) {

    const placement = getPlacement(
        student,
        filters.academicYear
    );

    if (filters.academicYear &&
        !placement.academicYear)
        return false;

    if (filters.className &&
        placement.className !== filters.className)
        return false;

    if (filters.section &&
        placement.section !== filters.section)
        return false;

    return true;
}


function mapStudentForResponse(student, academicYear) {

    const placement =
        getPlacement(student, academicYear);

    return {
        ...student,
        className: placement.className,
        section: placement.section,
        rollNumber:
            student.rollNumber || "",
        selectedAcademicYear:
            placement.academicYear?.year || ""
    };
}

async function attachQrCode(student) {

    return {
        ...student,
        qrCode:
            student.qrCode ||
            await generateQR(student._id)
    };
}

function sanitizeSegment(value, length = 4) {

    return String(value || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, length);
}


function normalizeClassCode(className) {

    const matchedValue =
        String(className || "").match(/\d+/)?.[0] ||
        sanitizeSegment(className, 2);

    return matchedValue.padStart(2, "0");
}


function normalizeRollNumber(value) {

    const normalized =
        String(value || "").trim();

    if (!normalized)
        throw new Error("Roll number is required.");

    return normalized;
}


function buildEnrollmentNumber({
    teacherName,
    academicYear,
    className,
    section,
    rollNumber
}) {

    const teacherCode =
        sanitizeSegment(teacherName, 4);
    const yearCode =
        sanitizeSegment(academicYear, 6);
    const classCode =
        normalizeClassCode(className);
    const sectionCode =
        sanitizeSegment(section, 1);
    const rollCode =
        sanitizeSegment(rollNumber, 6);

    return `${teacherCode}${yearCode}${classCode}${sectionCode}${rollCode}`;
}


function buildStudentPayload(payload, teacherName) {

    const academicYear =
        payload.academicYear ||
        DEFAULT_ACADEMIC_YEAR;
    const className =
        payload.className || "";
    const section =
        payload.section || "";
    const rollNumber =
        normalizeRollNumber(
            payload.rollNumber
        );
    const enrollmentNumber =
        buildEnrollmentNumber({
            teacherName,
            academicYear,
            className,
            section,
            rollNumber
        });

    return {
        ...payload,
        academicYear: undefined,
        rollNumber,
        enrollmentNumber,
        className,
        section,
        academicYears: [
            {
                year: academicYear,
                className,
                section,
                attendance: 0,
                totalDays: 0,
                presentDays: 0,
                attendancePercentage: 0,
                attendanceRecords: [],
                subjects: [],
                testReports: [],
                coCurricular: [],
                teacherRemarks: ""
            }
        ]
    };
}

function validateStudentCreation(payload) {

    const requiredFields = [
        ["name", "Name is required."],
        ["rollNumber", "Roll number is required."],
        ["dateOfBirth", "Date of birth is required."],
        ["gender", "Gender is required."],
        ["academicYear", "Academic year is required."],
        ["className", "Class is required."],
        ["section", "Section is required."]
    ];

    const missingField = requiredFields.find(
        ([field]) => !String(payload[field] || "").trim()
    );

    return missingField?.[1] || "";
}


exports.createTeacher = async (req, res) => {

    try {

        const teacherPayload = {
            name: String(req.body.name || "").trim(),
            email: String(req.body.email || "")
                .trim()
                .toLowerCase(),
            password: req.body.password
        };

        const passwordError =
            validatePassword(teacherPayload.password);

        if (passwordError)
            return res.status(400).json({
                message: passwordError
            });

        if (!teacherPayload.name || !teacherPayload.email)
            return res.status(400).json({
                message: "Name and email are required."
            });

        const hashedPassword =
            await bcrypt.hash(teacherPayload.password, 10);

        const teacher = await User.create({
            ...teacherPayload,
            password: hashedPassword,
            role: "teacher"
        });

        const teacherResponse =
            await User.findById(
                teacher._id,
                { password: 0 }
            ).lean();

        res.json(teacherResponse);

    } catch (error) {

        return sendServerError(
            res,
            "ADMIN_CREATE_TEACHER",
            error
        );
    }
};


exports.createStudent = async (req, res) => {

    try {

        const studentPayload =
            sanitizeStudentPayload(req.body);
        const validationError =
            validateStudentCreation(studentPayload);

        if (validationError)
            return res.status(400).json({
                message: validationError
            });

        const imageError = validateProfileImage(
            req.body.profileImage
        );

        if (imageError)
            return res.status(400).json({
                message: imageError
            });

        if (!req.body.assignedTeacher)
            return res.status(400).json({
                message: "Assigned teacher is required."
            });

        const assignedTeacher =
            await User.findById(
                studentPayload.assignedTeacher
            ).lean();

        if (!assignedTeacher)
            return res.status(404).json({
                message: "Assigned teacher not found."
            });

        const student = await Student.create(
            buildStudentPayload(
                studentPayload,
                assignedTeacher.name
            )
        );

        const qr = await generateQR(student._id);

        student.qrCode = qr;

        await student.save();

        res.json(student);

    } catch (error) {

        return sendServerError(
            res,
            "ADMIN_CREATE_STUDENT",
            error
        );
    }
};


exports.getTeachers = async (req, res) => {

    try {

        const teachers = await User.find(
            { role: "teacher" },
            { password: 0 }
        )
            .sort({ createdAt: -1 })
            .lean();

        res.json(teachers);

    } catch (error) {

        return sendServerError(
            res,
            "ADMIN_GET_TEACHERS",
            error
        );
    }
};


exports.getStudents = async (req, res) => {

    try {

        const filters = {
            academicYear: req.query.academicYear || "",
            className: req.query.className || "",
            section: req.query.section || ""
        };

        const students = await Student.find({})
            .populate(
                "assignedTeacher",
                "name email"
            )
            .sort({ createdAt: -1 })
            .lean();

        const filteredStudents = students
            .filter(student =>
                matchesStudentFilters(
                    student,
                    filters
                )
            )
            .map(student =>
                mapStudentForResponse(
                    student,
                    filters.academicYear
                )
            );

        res.json(
            await Promise.all(
                filteredStudents.map(attachQrCode)
            )
        );

    } catch (error) {

        return sendServerError(
            res,
            "ADMIN_GET_STUDENTS",
            error
        );
    }
};


exports.getOverview = async (req, res) => {

    try {

        const [
            teacherCount,
            studentCount,
            classroomSummary
        ] = await Promise.all([
            User.countDocuments({ role: "teacher" }),
            Student.countDocuments(),
            Student.aggregate([
                {
                    $group: {
                        _id: {
                            className: {
                                $ifNull: [
                                    "$className",
                                    "Unassigned"
                                ]
                            },
                            section: {
                                $ifNull: [
                                    "$section",
                                    "No Section"
                                ]
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        className: "$_id.className",
                        section: "$_id.section",
                        count: 1
                    }
                },
                {
                    $sort: {
                        className: 1,
                        section: 1
                    }
                }
            ])
        ]);

        res.json({
            teacherCount,
            studentCount,
            classroomSummary
        });

    } catch (error) {

        return sendServerError(
            res,
            "ADMIN_GET_OVERVIEW",
            error
        );
    }
};
