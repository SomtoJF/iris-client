import { BaseRoute } from "./routes";
import z from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(20, "Password must be at most 20 characters"),
});

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be at most 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be at most 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(20, "Password must be at most 20 characters"),
});

export async function login(data: z.infer<typeof loginSchema>) {
  const response = await fetch(`${BaseRoute}/login`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to login");
  }
  return res;
}

export async function signup(data: z.infer<typeof signupSchema>) {
  const response = await fetch(`${BaseRoute}/signup`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to signup");
  }
  return res;
}

export interface User {
  id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${BaseRoute}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch current user");
  }
  return res.data;
}
