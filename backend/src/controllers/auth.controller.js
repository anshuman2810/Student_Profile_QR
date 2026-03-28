const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { logError, sendServerError } = require("../utils/error");


exports.login = async (req, res) => {

    try {

        const normalizedEmail =
            String(req.body.email || "")
                .trim()
                .toLowerCase();
        const password =
            String(req.body.password || "");

        if (!normalizedEmail || !password)
            return res.status(400).json({
                message: "Email and password are required."
            });

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user) {
            logError("AUTH_LOGIN", new Error(
                `User not found for email: ${normalizedEmail}`
            ));
            return res.status(401).json({
                message: "Invalid email/password."
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            logError("AUTH_LOGIN", new Error(
                `Invalid password for email: ${normalizedEmail}`
            ));
            return res.status(401).json({
                message: "Invalid email/password."
            });
        }

        res.json({
            token: generateToken(user)
        });

    } catch (error) {

        return sendServerError(
            res,
            "AUTH_LOGIN",
            error
        );
    }
};
