const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    "http://localhost:5000,http://localhost:5173"
)
    .split(",")
    .map(origin => origin.trim());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Please try again later."
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many requests. Please slow down and try again shortly."
    }
});

app.set("trust proxy", 1);

app.use(cors({
    origin(origin, callback) {

        if (!origin || allowedOrigins.includes(origin))
            return callback(null, true);

        return callback(
            new Error("Not allowed by CORS")
        );
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(helmet({
    crossOriginResourcePolicy: false
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({
    extended: false,
    limit: "2mb"
}));
app.use(apiLimiter);


app.use("/auth", authLimiter, require("./routes/auth.routes"));
app.use("/admin", require("./routes/admin.routes"));
app.use("/teacher", require("./routes/teacher.routes"));
app.use("/student", require("./routes/student.routes"));

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found."
    });
});

app.use((error, req, res, next) => {

    if (error?.type === "entity.parse.failed")
        return res.status(400).json({
            message: "Invalid JSON payload."
        });

    if (error?.message === "Not allowed by CORS")
        return res.status(403).json({
            message: "Request origin is not allowed."
        });

    return next(error);
});


module.exports = app;
