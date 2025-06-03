import jwt from "jsonwebtoken";
import "dotenv/config";
export const generateToken = (userId: string) => {
  return jwt.sign({ dbId: userId }, process.env.ACCESS_TOKEN_SECRET as string);
};
