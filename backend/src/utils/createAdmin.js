require("dotenv").config();

const connectDB = require("../config/db");
const ensureAdmin = require("./ensureAdmin");


const createAdmin = async () => {

    await connectDB();
    await ensureAdmin();

    process.exit();
};

createAdmin();
