const router = require("express").Router();

const adminController =
require("../controllers/admin.controller");

const auth =
require("../middleware/auth.middleware");

const role =
require("../middleware/role.middleware");


router.post(
    "/teacher",
    auth,
    role("admin"),
    adminController.createTeacher
);

router.post(
    "/student",
    auth,
    role("admin"),
    adminController.createStudent
);

router.get(
    "/teachers",
    auth,
    role("admin"),
    adminController.getTeachers
);

router.get(
    "/students",
    auth,
    role("admin"),
    adminController.getStudents
);

router.get(
    "/overview",
    auth,
    role("admin"),
    adminController.getOverview
);

module.exports = router;
