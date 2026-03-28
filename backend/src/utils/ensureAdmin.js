const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { logError } = require("./error");


async function ensureAdmin() {

    try {

        const hashedPassword =
            await bcrypt.hash("admin123", 10);

        await User.findOneAndUpdate(
            { email: "admin@gmail.com" },
            {
                $set: {
                    name: "Super Admin",
                    email: "admin@gmail.com",
                    password: hashedPassword,
                    role: "admin"
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        console.log(
            "Admin credentials ensured for admin@gmail.com"
        );

    } catch (error) {

        logError("ENSURE_ADMIN", error);
    }
}


module.exports = ensureAdmin;
