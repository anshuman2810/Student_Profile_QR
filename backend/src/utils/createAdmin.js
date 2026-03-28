require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/user.model");

const connectDB = require("../config/db");


const createAdmin = async () => {

    await connectDB();

    const existingAdmin = await User.findOne({
        role: "admin"
    });

    if (existingAdmin) {
        console.log("Admin already exists");
        process.exit();
    }

    const hashedPassword =
        await bcrypt.hash("admin123", 10);

    await User.create({
        name: "Super Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin"
    });

    console.log("Admin created successfully");

    process.exit();
};

createAdmin();