import jwt from "jsonwebtoken";
import { Mydb } from "../drizzle/db";
import { users } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { NextFunction } from "express";

export const authenticateToken = (req, res, next) => {
  const token = req.cookies["token"];
  if (token == null)
    return res.status(401).json({
      message: "Unauthorized",
      user: null,
    });

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    (err, decoded) => {
      if (err) return res.sendStatus(403).send("Invalid Token");
      req.userId = decoded.dbId;
      next();
    }
  );
};
export const authenticateVerifiedUserToken = async (req, res, next) => {
  const token = req.cookies["token"];

  if (!token) {
    console.log("Token not found in cookies");
    return res.status(401).json({
      message: "Unauthorized: No token",
      user: null,
    });
  }

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    async (err, decoded: any) => {
      if (err) {
        console.error("JWT verification error:", err);
        return res.status(403).json({ message: "Invalid token" });
      }

      try {
        const verifiedUser = await Mydb.select()
          .from(users)
          .where(
            and(eq(users.id, decoded.dbId), eq(users.isEmailVerified, true))
          );


        if (!verifiedUser || verifiedUser.length === 0) {
          console.log("User not found or email not verified");
          return res.status(401).json({ message: "Unauthorized" });
        }

        req.verifiedUser = verifiedUser[0]; // attach user to request
        next();
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );
};
