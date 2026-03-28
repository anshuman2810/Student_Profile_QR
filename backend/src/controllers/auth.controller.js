const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");


exports.login = async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
        return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(
        password,
        user.password
    );

    if (!validPassword)
        return res.status(401).json({
            message: "Invalid credentials"
        });

    res.json({
        token: generateToken(user)
    });
};