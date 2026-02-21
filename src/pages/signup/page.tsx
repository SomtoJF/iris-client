import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router";
import { signup, signupSchema } from "@/services/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type z from "zod";

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signup(data);
      toast.success("Account created successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {" "}
            <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance">
              Sign Up
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field data-invalid={!!errors.firstName}>
              <FieldTitle>First Name</FieldTitle>
              <Input
                type="text"
                placeholder="John"
                {...register("firstName")}
                aria-invalid={!!errors.firstName}
              />
              <FieldError errors={errors.firstName ? [errors.firstName] : []} />
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldTitle>Last Name</FieldTitle>
              <Input
                type="text"
                placeholder="Doe"
                {...register("lastName")}
                aria-invalid={!!errors.lastName}
              />
              <FieldError errors={errors.lastName ? [errors.lastName] : []} />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldTitle>Email</FieldTitle>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              <FieldError errors={errors.email ? [errors.email] : []} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldTitle>Password</FieldTitle>
              <Input
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              <FieldError errors={errors.password ? [errors.password] : []} />
            </Field>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
