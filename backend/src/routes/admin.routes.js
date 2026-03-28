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

module.exports = router;