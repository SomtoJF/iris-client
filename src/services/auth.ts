import { apiFetch } from "./api";
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
  return apiFetch("/login", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    fallbackError: "Failed to login",
    ignore401: true,
  });
}

export async function signup(data: z.infer<typeof signupSchema>) {
  return apiFetch("/signup", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    fallbackError: "Failed to signup",
    ignore401: true,
  });
}

export interface User {
  id: string;
  isAdmin: boolean;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isOnboardingComplete: boolean;
  isResumeOnboardingComplete: boolean;
}

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(20, "Password must be at most 20 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(20, "Password must be at most 20 characters"),
  confirmNewPassword: z.string().min(8, "Password must be at least 8 characters").max(20, "Password must be at most 20 characters"),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export async function resetPassword(data: { password: string; newPassword: string }) {
  return apiFetch("/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    fallbackError: "Failed to reset password",
  });
}

export async function getCurrentUser(): Promise<User> {
  const res = await apiFetch("/me", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    fallbackError: "Failed to fetch current user",
  });
  return res.data;
}
