const app = require("./src/app");
const connectDB = require("./src/config/db");
const ensureAdmin = require("./src/utils/ensureAdmin");
const { logError } = require("./src/utils/error");

const startServer = async () => {

    await connectDB();
    await ensureAdmin();

    const port = process.env.PORT || 5001;
    app.listen(port, () =>
        console.log(`Server running on port ${port}`)
    );
};

process.on("unhandledRejection", error => {
    logError("UNHANDLED_REJECTION", error);
});

process.on("uncaughtException", error => {
    logError("UNCAUGHT_EXCEPTION", error);
    process.exit(1);
});

startServer().catch(error => {
    logError("SERVER_START", error);
    process.exit(1);
});
