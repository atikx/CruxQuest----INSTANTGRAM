import jwt from "jsonwebtoken";


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
    (err, userId) => {
      if (err) return res.sendStatus(403).send("Invalid Token");
      req.userId = userId;
      next();
    }
  );
};
