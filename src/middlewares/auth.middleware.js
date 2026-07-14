const tokenBlacklistModel = require("../models/blacklist.model");
const jwt = require("jsonwebtoken");

async function authUser(req, res, next) {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: "Token not found"
            });
        }

        const blacklistedToken = await tokenBlacklistModel.findOne({
            token
        });

        if (blacklistedToken) {
            return res.status(401).json({
                message: "Token is blacklisted"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (err) {
        console.log("AUTH ERROR:", err);

        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

module.exports = { authUser };