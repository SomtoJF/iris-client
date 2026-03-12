import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword, resetPasswordSchema } from "@/services/auth";
import type { z } from "zod";

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function Account() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    setIsSubmitting(true);
    try {
      await resetPassword({
        password: data.password,
        newPassword: data.newPassword,
      });
      toast.success("Password updated. Please log in again.");
      navigate("/login");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset password",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password. You'll be logged out after changing it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field data-invalid={!!errors.password}>
              <FieldTitle>Current Password</FieldTitle>
              <Input
                type="password"
                {...register("password")}
                placeholder="Enter current password"
                aria-invalid={!!errors.password}
              />
              <FieldError
                errors={
                  errors.password ? [{ message: errors.password.message }] : []
                }
              />
            </Field>

            <Field data-invalid={!!errors.newPassword}>
              <FieldTitle>New Password</FieldTitle>
              <Input
                type="password"
                {...register("newPassword")}
                placeholder="Enter new password"
                aria-invalid={!!errors.newPassword}
              />
              <FieldError
                errors={
                  errors.newPassword
                    ? [{ message: errors.newPassword.message }]
                    : []
                }
              />
            </Field>

            <Field data-invalid={!!errors.confirmNewPassword}>
              <FieldTitle>Confirm New Password</FieldTitle>
              <Input
                type="password"
                {...register("confirmNewPassword")}
                placeholder="Confirm new password"
                aria-invalid={!!errors.confirmNewPassword}
              />
              <FieldError
                errors={
                  errors.confirmNewPassword
                    ? [{ message: errors.confirmNewPassword.message }]
                    : []
                }
              />
            </Field>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
