const express = require("express");

const cors = require("cors");

const helmet = require("helmet");

require("dotenv").config();

const app = express();

app.use(cors());

app.use(helmet());

app.use(express.json());


app.use("/auth", require("./routes/auth.routes"));

app.use("/admin", require("./routes/admin.routes"));

app.use("/teacher", require("./routes/teacher.routes"));

app.use("/student", require("./routes/student.routes"));


module.exports = app;