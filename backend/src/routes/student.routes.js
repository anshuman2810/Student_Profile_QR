const router = require("express").Router();

const studentController =
require("../controllers/student.controller");


router.get(
    "/:id/years",
    studentController.getAcademicYears
);


router.get(
    "/:id/year/:year",
    studentController.getStudentByYear
);


router.get(
    "/:id/latest",
    studentController.getLatestAcademicYear
);


module.exports = router;