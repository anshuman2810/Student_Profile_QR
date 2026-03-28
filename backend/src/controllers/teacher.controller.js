const Student = require("../models/student.model");
const generateQR = require("../services/qr.service");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const {
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

function buildStudentPayload(payload, assignedTeacher) {

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
            teacherName: assignedTeacher.name,
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
        assignedTeacher: assignedTeacher._id,
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

function buildAttendanceSummary(payload) {

    const records = (payload.attendanceRecords || [])
        .filter(record => record?.date && record?.status)
        .sort((left, right) =>
            left.date.localeCompare(right.date)
        );

    const totalDays = records.filter(
        record => record.status !== "holiday"
    ).length;

    const presentDays = records.filter(
        record => record.status === "present"
    ).length;

    const attendancePercentage =
        totalDays > 0
            ? Number(
                ((presentDays / totalDays) * 100)
                    .toFixed(2)
            )
            : 0;

    return {
        ...payload,
        attendanceRecords: records,
        totalDays,
        presentDays,
        attendancePercentage,
        attendance: attendancePercentage
    };
}


function ensureAcademicYear(student, year) {

    let academicYear =
        student.academicYears.find(
            item => item.year === year
        );

    if (!academicYear) {

        academicYear = {
            year,
            className: student.className || "",
            section: student.section || "",
            attendanceRecords: [],
            subjects: [],
            testReports: [],
            coCurricular: [],
            teacherRemarks: ""
        };

        student.academicYears.push(academicYear);
        academicYear =
            student.academicYears[
                student.academicYears.length - 1
            ];
    }

    return academicYear;
}


exports.addAcademicYear = async (req, res) => {

    try {

        const student = await Student.findById(req.params.id);

        if (!student)
            return res.status(404).json({
                message: "Student not found"
            });

        if (
            student.assignedTeacher?.toString() !== req.user.id
        )
            return res.status(403).json({
                message: "Access denied"
            });

        const academicYearPayload =
            buildAttendanceSummary(req.body);

        if (!academicYearPayload.year)
            return res.status(400).json({
                message: "Academic year is required."
            });

        if (
            student.academicYears.some(
                item => item.year === academicYearPayload.year
            )
        )
            return res.status(400).json({
                message: "This academic year already exists for the student."
            });

        student.academicYears.push(
            academicYearPayload
        );
        student.className =
            academicYearPayload.className ||
            student.className;
        student.section =
            academicYearPayload.section ||
            student.section;

        await student.save();

        res.json(student);

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_ADD_YEAR",
            error
        );
    }
};


exports.updateAcademicYear = async (req, res) => {

    try {

        const student = await Student.findById(req.params.id);

        if (!student)
            return res.status(404).json({
                message: "Student not found"
            });

        if (
            student.assignedTeacher?.toString() !== req.user.id
        )
            return res.status(403).json({
                message: "Access denied"
            });

        const yearIndex =
            student.academicYears.findIndex(
                y => y.year === req.body.year
            );

        if (yearIndex === -1)
            return res.status(404).json({
                message: "Academic year not found"
            });

        const academicYearPayload =
            buildAttendanceSummary(req.body);

        student.academicYears[yearIndex] =
            academicYearPayload;
        student.className =
            academicYearPayload.className ||
            student.className;
        student.section =
            academicYearPayload.section ||
            student.section;

        await student.save();

        res.json(student);

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_UPDATE_YEAR",
            error
        );
    }
};


exports.getAssignedStudents = async (req, res) => {

    try {

        const filters = {
            academicYear: req.query.academicYear || "",
            className: req.query.className || "",
            section: req.query.section || ""
        };

        const students = await Student.find({
            assignedTeacher: req.user.id
        })
            .sort({ name: 1 })
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
            "TEACHER_GET_STUDENTS",
            error
        );
    }
};


exports.getClassroomSummary = async (req, res) => {

    try {

        const academicYear =
            req.query.academicYear || "";

        const students = await Student.find({
            assignedTeacher:
                new mongoose.Types.ObjectId(
                    req.user.id
                )
        }).lean();

        const classroomMap = new Map();

        students
            .filter(student =>
                matchesStudentFilters(
                    student,
                    {
                        academicYear,
                        className: "",
                        section: ""
                    }
                )
            )
            .forEach(student => {

                const placement =
                    getPlacement(
                        student,
                        academicYear
                    );

                const className =
                    placement.className ||
                    "Unassigned";
                const section =
                    placement.section ||
                    "No Section";
                const key =
                    `${className}||${section}`;

                classroomMap.set(
                    key,
                    (classroomMap.get(key) || 0) + 1
                );
            });

        const groupedStudents =
            Array.from(classroomMap.entries())
                .map(([key, count]) => {

                    const [className, section] =
                        key.split("||");

                    return {
                        className,
                        section,
                        count
                    };
                })
                .sort((left, right) =>
                    left.className.localeCompare(
                        right.className
                    ) ||
                    left.section.localeCompare(
                        right.section
                    )
                );

        res.json(groupedStudents);

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_CLASSROOM_SUMMARY",
            error
        );
    }
};


exports.bulkUpdateAttendance = async (req, res) => {

    try {

        const {
            date,
            academicYear,
            targetStudentIds = [],
            presentStudentIds = [],
            isHoliday = false
        } = req.body;

        if (!date || !academicYear)
            return res.status(400).json({
                message: "Date and academic year are required."
            });

        if (!Array.isArray(targetStudentIds) ||
            targetStudentIds.length === 0)
            return res.status(400).json({
                message: "At least one student must be selected."
            });

        const presentSet = new Set(presentStudentIds);

        const students = await Student.find({
            _id: { $in: targetStudentIds },
            assignedTeacher: req.user.id
        });

        for (const student of students) {

            const yearRecord =
                ensureAcademicYear(
                    student,
                    academicYear
                );

            const status = isHoliday
                ? "holiday"
                : presentSet.has(
                    student._id.toString()
                )
                    ? "present"
                    : "absent";

            const existingIndex =
                yearRecord.attendanceRecords.findIndex(
                    record => record.date === date
                );

            if (existingIndex >= 0) {
                yearRecord.attendanceRecords[existingIndex] = {
                    date,
                    status
                };
            } else {
                yearRecord.attendanceRecords.push({
                    date,
                    status
                });
            }

            const normalizedYear =
                buildAttendanceSummary(
                    yearRecord.toObject
                        ? yearRecord.toObject()
                        : yearRecord
                );

            const yearIndex =
                student.academicYears.findIndex(
                    item => item.year === academicYear
                );

            student.academicYears[yearIndex] =
                normalizedYear;

            await student.save();
        }

        res.json({
            message: isHoliday
                ? "Holiday marked successfully."
                : "Attendance saved successfully."
        });

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_BULK_ATTENDANCE",
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

        const teacher = await User.findById(
            req.user.id
        ).lean();

        if (!teacher)
            return res.status(404).json({
                message: "Teacher not found."
            });

        const student = await Student.create(
            buildStudentPayload(
                studentPayload,
                teacher
            )
        );

        const qr = await generateQR(student._id);

        student.qrCode = qr;

        await student.save();

        res.json(
            await attachQrCode(student)
        );

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_CREATE_STUDENT",
            error
        );
    }
};


exports.getStudent = async (req, res) => {

    try {

        const student = await Student.findById(
            req.params.id
        ).lean();

        if (!student)
            return res.status(404).json({
                message: "Student not found"
            });

        if (
            student.assignedTeacher?.toString() !== req.user.id
        )
            return res.status(403).json({
                message: "Access denied"
            });

        res.json(student);

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_GET_STUDENT",
            error
        );
    }
};


exports.getProfile = async (req, res) => {

    try {

        const User = require("../models/user.model");

        const teacher = await User.findById(
            req.user.id,
            { password: 0 }
        ).lean();

        if (!teacher)
            return res.status(404).json({
                message: "Teacher not found"
            });

        res.json(teacher);

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_GET_PROFILE",
            error
        );
    }
};


exports.updateProfileImage = async (req, res) => {

    try {

        const User = require("../models/user.model");
        const imageError = validateProfileImage(
            req.body.profileImage
        );

        if (imageError)
            return res.status(400).json({
                message: imageError
            });

        const teacher = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    profileImage: req.body.profileImage
                }
            },
            {
                new: true,
                projection: { password: 0 }
            }
        ).lean();

        if (!teacher)
            return res.status(404).json({
                message: "Teacher not found"
            });

        res.json(teacher);

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_UPDATE_PROFILE_IMAGE",
            error
        );
    }
};


exports.updateStudentProfileImage = async (req, res) => {

    try {

        const imageError = validateProfileImage(
            req.body.profileImage
        );

        if (imageError)
            return res.status(400).json({
                message: imageError
            });

        const student = await Student.findById(
            req.params.id
        );

        if (!student)
            return res.status(404).json({
                message: "Student not found"
            });

        if (
            student.assignedTeacher?.toString() !== req.user.id
        )
            return res.status(403).json({
                message: "Access denied"
            });

        student.profileImage = req.body.profileImage;

        await student.save();

        res.json(student);

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_UPDATE_STUDENT_IMAGE",
            error
        );
    }
};


exports.deleteStudent = async (req, res) => {

    try {

        const student = await Student.findById(req.params.id);

        if (!student)
            return res.status(404).json({
                message: "Student not found"
            });

        if (
            student.assignedTeacher?.toString() !== req.user.id
        )
            return res.status(403).json({
                message: "Access denied"
            });

        await student.deleteOne();

        res.json({
            message: "Student removed successfully"
        });

    } catch (error) {

        return sendServerError(
            res,
            "TEACHER_DELETE_STUDENT",
            error
        );
    }
};
