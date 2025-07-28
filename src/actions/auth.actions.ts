"use server";

import { client } from "@/lib/prisma";
import { AUTH } from "@/lib/types";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/config";
import { generateToken, verifyToken } from "@/lib/utils";
import { redirect } from "next/navigation";

export const signin = async ({ email, password }: AUTH) => {
  const user = await client.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Invalid email or password" };
  }

  const sessionToken = generateToken({
    payload: {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    time: 604800,
  });

  (await cookies()).set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "strict",
  });

  return { success: true, role: user.role };
};
export const getSessionUser = async () => {
  try {
    const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) return null;

    const payload = verifyToken(sessionToken);
    if (!payload) return null;

    return await client.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (_) {
    console.log(_);
    return null;
  }
};
export const logout = async () => {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/login");
};
export const requireRole = async (
  requiredRole: "Admin" | "Operator" | "Viewer"
) => {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const roleLevels = {
    Viewer: 1,
    Operator: 2,
    Admin: 3,
  };

  if (roleLevels[user.role] < roleLevels[requiredRole]) {
    redirect("/unauthorized");
  }

  return user;
};
