import { Router } from "express";
import { zodValidater } from "../middlewares/zodValidator";
import * as userSchemas from "../schemaValidator/user.validator";
import { Mydb } from "../drizzle/db";
import { users } from "../drizzle/schema";
import { eq, or } from "drizzle-orm";
import { generateToken } from "../functions/tokenGenerator";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../middlewares/jwtauth";
import { sendOtpMail } from "../functions/mailer";
const router = Router();

router.post(
  "/auth/signup",
  zodValidater(userSchemas.signupSchema),
  async (req, res) => {
    try {
      // Check if the username or email already exists
      const EmailAlreadyExists = await Mydb.select()
        .from(users)
        .where(eq(users.email, req.body.email));
      if (EmailAlreadyExists.length > 0) {
        return res.status(400).send("User already exists with this email ");
      }
      // check if username already exists
      const UserNameAlreadyExists = await Mydb.select()
        .from(users)
        .where(eq(users.username, req.body.username));
      if (UserNameAlreadyExists.length > 0) {
        return res.status(400).send("User already exists with this username");
      }
      const hashedPassword = await bcrypt.hash(req.body.password.trim(), 10);
      const otp = Math.floor(100000 + Math.random() * 900000);
      const newUser = await Mydb.insert(users)
        .values({
          username: req.body.username.trim(),
          email: req.body.email.trim(),
          passwordHash: hashedPassword,
          otp: otp,
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          isEmailVerified: users.isEmailVerified,
        });
      if (newUser.length === 0) {
        return res.status(500).send("Failed to create user");
      }
      res.cookie("token", generateToken(newUser[0].id), {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res
        .status(200)
        .json({ message: "Registration successful", user: newUser[0] });

      await sendOtpMail(newUser[0].email, otp);
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/auth/login",
  zodValidater(userSchemas.loginSchema),
  async (req, res) => {
    try {
      const user = await Mydb.select({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
        isEmailVerified: users.isEmailVerified,
        passwordHash: users.passwordHash,
      })
        .from(users)
        .where(eq(users.username, req.body.username));

      if (user.length === 0) {
        return res.status(400).send("Invalid Username");
      }
      const isMatch = await bcrypt.compare(
        req.body.password,
        user[0].passwordHash as string
      );
      if (!isMatch) {
        return res.status(400).send("Invalid Password");
      }
      res.cookie("token", generateToken(user[0].id));
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user[0].id,
          email: user[0].email,
          username: user[0].username,
          name: user[0].name,
          avatar: user[0].avatar,
          isEmailVerified: user[0].isEmailVerified,
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/auth/getuser", authenticateToken, async (req, res) => {
  try {
    const user = await Mydb.select({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      avatar: users.avatar,
      isEmailVerified: users.isEmailVerified,
    })
      .from(users)
      .where(eq(users.id, req.userId));
    if (user.length !== 0) {
      return res.status(200).json({
        message: "User is logged in",
        user: user[0],
      });
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    console.error("Error in /checkUser route:", error);
    res.status(500).send("Internal server error");
  }
});

router.post("/auth/verifyOtp", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || typeof otp !== "number") {
      return res.status(400).send("Invalid OTP");
    }

    const user = await Mydb.select()
      .from(users)
      .where(eq(users.id, req.userId));

    if (user.length === 0) {
      return res.status(400).send("Invalid OTP or user not found");
    }

    // Update user's email verification status
    const verifiedUser = await Mydb.update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.id, user[0].id))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
        isEmailVerified: users.isEmailVerified,
      });

    res
      .status(200)
      .json({ message: "OTP verified successfully", user: verifiedUser[0] });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/sendOtp", authenticateToken, async (req: any, res: any) => {
  try {
    const { userId } = req;
    // const otp = Math.floor(100000 + Math.random() * 900000);
    const user = await Mydb.update(users)
      .set({
        otp: Math.floor(100000 + Math.random() * 900000),
      })
      .where(eq(users.id, userId))
      .returning({
        otp: users.otp,
        email: users.email,
      });

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = user[0].otp;

    res.status(200).json({
      message: "OTP sent successfully",
    });
    otp && (await sendOtpMail(user[0].email, otp));
  } catch (error) {
    console.error("❌ Error in /sendOtp:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
