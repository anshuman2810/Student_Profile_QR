const router = require("express").Router();

const teacherController =
require("../controllers/teacher.controller");

const auth =
require("../middleware/auth.middleware");

const role =
require("../middleware/role.middleware");


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