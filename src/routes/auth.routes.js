const {Router} = require("express");
const authController = require("../controllers/auth.controller");
const authRouter = Router();
const authMiddleware = require("../middlewares/auth.middleware")


authRouter.post("/register",authController.registerUsercontroller)

authRouter.post("/login", authController.loginUsercontroller)
authRouter.get("/logout", authController.logoutUsercontroller)

authRouter.get("/get-me",authMiddleware.authUser,authController.getMeController)
module.exports = authRouter