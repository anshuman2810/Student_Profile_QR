const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer "))
        return res.status(401).json({
            message: "Unauthorized"
        });

    const token = authHeader.slice(7).trim();

    if (!token)
        return res.status(401).json({
            message: "Unauthorized"
        });

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        req.user = decoded;

        next();

    } catch {

        res.status(401).json({
            message: "Invalid token"
        });

    }
};
