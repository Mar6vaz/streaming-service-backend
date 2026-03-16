import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const token = jwt.sign(
  {
    id: "123456",
    email: "poblanafranco@gmail.com",
    role: "user"
  },
  process.env.JWT_SECRET as string
);

console.log("TOKEN:", token);