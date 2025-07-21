import { randomUUID } from "crypto";
import { Router, type Request, type Response } from "express";
import catchAsync from "../lib/utils";
import { sendMail, sendMailToAdmin } from "../lib/utils";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import { authCheck } from "../middleware/AuthMiddleware";
import jwt from "jsonwebtoken";
import env from "../env";
import { access } from "../middleware/AccessControl";

const router: Router = Router();
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 10);
router.post(
  "/signup",
  catchAsync(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      status: "pending",
    });

    await newUser.save();

    sendMail(username, email);
    sendMailToAdmin(email, username);

    return res.status(201).json({
      success: true,
      message:
        "Access request sent to admin. You'll be notified when approved.",
    });
  })
);
router.post(
  "/signin",
  catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    let isValid = false;

    if (user) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      await bcrypt.compare(password, DUMMY_HASH);
    }

    if (!user || !isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.status) {
      return res.status(403).json({
        success: false,
        message: "Account not approved yet. Please contact admin.",
      });
    }

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    const { password: _, ...userData } = user.toObject();
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userData,
    });
  })
);
router.get(
  "/me",
  authCheck,
  catchAsync(async (req: Request, res: Response) => {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { password, __v, ...userData } = user.toObject();
    return res.status(200).json({
      success: true,
      user: userData,
    });
  })
);
router.post(
  "/verify",
  authCheck,
  access(["ADMIN", "MANAGER"]),
  catchAsync(async (req: Request, res: Response) => {
    const { username, email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.status = true;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "user successfully permitted to use network monitor",
    });
  })
);

export default router;
