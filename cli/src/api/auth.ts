import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

export const checkAuth = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${BASE_URL}/auth/me`, {
      withCredentials: true,
    });
    if (!res.data.success) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const res = await axios.post(
    `${BASE_URL}/auth/login`,
    { email, password },
    { withCredentials: true }
  );
  return res;
};
export const register = async ({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}) => {
  const res = await axios.post(
    `${BASE_URL}/auth/register`,
    { username, email, password },
    { withCredentials: true }
  );
  return res;
};
