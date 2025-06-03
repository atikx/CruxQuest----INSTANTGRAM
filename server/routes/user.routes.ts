import { Router } from "express";
import { zodValidater } from "../middlewares/zodValidator";
import * as userSchemas from "../schemaValidator/user.validator";
import { Mydb } from "../drizzle/db";
import { users } from "../drizzle/schema";
import { eq, or } from "drizzle-orm";
import { generateToken } from "../functions/tokenGenerator";
import bcrypt from "bcryptjs";
const router = Router();

router.post(
  "/auth/signup",
  zodValidater(userSchemas.signupSchema),
  async (req, res) => {
    try {
      const alreadyExists = await Mydb.select()
        .from(users)
        .where(
          or(
            eq(users.email, req.body.email),
            eq(users.username, req.body.username)
          )
        );
      if (alreadyExists.length > 0) {
        return res
          .status(400)
          .send("User already exists with this email or username");
      }
      const hashedPassword = await bcrypt.hash(req.body.password.trim(), 10);
      const newUser = await Mydb.insert(users)
        .values({
          username: req.body.username.trim(),
          email: req.body.email.trim(),
          passwordHash: hashedPassword,
        })
        .returning();
      if (newUser.length === 0) {
        return res.status(500).send("Failed to create user");
      }
      res.cookie("token", generateToken(newUser[0].id), {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ message: "Registration successful" });
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
      const user = await Mydb.select()
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
      res.status(200).json({ message: "Login successful", user: user[0] });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
export default router;
