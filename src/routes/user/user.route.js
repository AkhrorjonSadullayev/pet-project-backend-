import { Router } from "express";
import { getAll, getByIdUser, getChartUser, UserController } from "../../controllers/user/user.controller.js";
import { auth } from "../../middleware/auth.middleware.js";
import { addVuser } from "../../validator/user/user.validator.js";
import { validationResult } from "express-validator";
import { checkRoles } from "../../middleware/role.middleware.js";

export const router = Router();


// Middleware для обработки ошибок валидации
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Маршруты
router.post("/sign-up", addVuser(), handleValidation, UserController.signUp);
router.post("/send", UserController.sendOTP);
router.post("/verify", UserController.VerifyOTP);
router.post("/login",UserController.login);
// router.get("/activation/:id", UserController.activation);

router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password",UserController.resetPassword);
// router.delete("/logout", auth, UserController.logout);

router.get("/me", auth, UserController.getProfile);
router.post("/login-admin",UserController.loginAdmin)
router.get("/get", getAll);
router.get("/get/:id", getByIdUser);

router.get("/user-chart",auth,getChartUser)

export default router;
