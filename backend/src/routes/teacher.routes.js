const router = require("express").Router();

const teacherController =
require("../controllers/teacher.controller");

const auth =
require("../middleware/auth.middleware");

const role =
require("../middleware/role.middleware");


router.post(
    "/student",
    auth,
    role("teacher"),
    teacherController.createStudent
);


router.get(
    "/profile",
    auth,
    role("teacher"),
    teacherController.getProfile
);


router.put(
    "/profile-image",
    auth,
    role("teacher"),
    teacherController.updateProfileImage
);


router.delete(
    "/student/:id",
    auth,
    role("teacher"),
    teacherController.deleteStudent
);


router.get(
    "/student/:id",
    auth,
    role("teacher"),
    teacherController.getStudent
);


router.put(
    "/student/:id/profile-image",
    auth,
    role("teacher"),
    teacherController.updateStudentProfileImage
);


router.get(
    "/classrooms",
    auth,
    role("teacher"),
    teacherController.getClassroomSummary
);


router.post(
    "/attendance/bulk",
    auth,
    role("teacher"),
    teacherController.bulkUpdateAttendance
);


router.post(
    "/add-year/:id",
    auth,
    role("teacher"),
    teacherController.addAcademicYear
);


router.put(
    "/update-year/:id",
    auth,
    role("teacher"),
    teacherController.updateAcademicYear
);


router.get(
    "/students",
    auth,
    role("teacher"),
    teacherController.getAssignedStudents
);

module.exports = router;
