import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const generateToken = ({
  payload,
  time,
}: {
  payload: JwtPayload;
  time: number;
}) => {
  const options: SignOptions = { expiresIn: time };
  return jwt.sign(payload, process.env.JWT_SECRET! as string, options);
};
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  } catch (error) {
    console.log(error);
    return null;
  }
};
