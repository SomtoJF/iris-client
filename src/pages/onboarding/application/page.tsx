import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import type { Country } from "@/components/ui/country-dropdown";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";
import {
  getJobApplicationProfile,
  upsertJobApplicationProfile,
  jobApplicationProfileSchema,
  type JobApplicationProfileFormValues,
} from "@/services/jobApplicationProfile";

const TOTAL_STEPS = 3;

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const defaultFormValues: JobApplicationProfileFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  countryOfResidence: "",
  isVeteran: false,
  countriesOfCitizenship: [],
  gender: "",
  dateOfBirth: "",
};

const countryList = countries.all.filter(
  (c: Country) => c.emoji && c.status !== "deleted" && c.ioc !== "PRK",
);

function getCountryByAlpha3(alpha3: string): Country | undefined {
  return countryList.find((c: Country) => c.alpha3 === alpha3);
}

function toFieldErrors(err: unknown): Array<{ message?: string } | undefined> {
  if (!Array.isArray(err)) return [];
  return err.map((e) =>
    typeof e === "string" ? { message: e } : (e as { message?: string }),
  );
}

export default function ApplicationOnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: defaultFormValues,
    onSubmit: async ({ value }) => {
      const parsed = jobApplicationProfileSchema.safeParse(value);
      if (!parsed.success) {
        const first = parsed.error.flatten().fieldErrors;
        const msg = Object.values(first).flat().find(Boolean) as
          | string
          | undefined;
        toast.error(msg ?? "Please fix the form errors.");
        return;
      }
      setIsSubmitting(true);
      try {
        await upsertJobApplicationProfile(parsed.data);
        toast.success("Profile saved successfully");
        navigate("/");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save profile",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getJobApplicationProfile();
        if (cancelled) return;
        const { id: _id, ...rest } = profile;
        form.reset({
          ...rest,
          dateOfBirth: profile.dateOfBirth?.slice(0, 10) ?? "",
          countriesOfCitizenship: profile.countriesOfCitizenship ?? [],
        });
      } catch {
        if (!cancelled) {
          toast.error("Failed to load profile. You may need to sign in.");
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validateCurrentStep = (): boolean => {
    const value = form.state.values;
    if (currentStep === 1) {
      const stepSchema = jobApplicationProfileSchema.pick({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
      });
      const r = stepSchema.safeParse(value);
      if (!r.success) {
        const err = r.error.flatten().fieldErrors;
        Object.entries(err).forEach(([k, v]) => {
          form.setFieldMeta(
            k as keyof JobApplicationProfileFormValues,
            (prev) => ({
              ...prev,
              error: v?.[0],
            }),
          );
        });
        return false;
      }
    }
    if (currentStep === 2) {
      const stepSchema = jobApplicationProfileSchema.pick({
        address: true,
        city: true,
        state: true,
        zip: true,
        countryOfResidence: true,
      });
      const r = stepSchema.safeParse(value);
      if (!r.success) {
        const err = r.error.flatten().fieldErrors;
        Object.entries(err).forEach(([k, v]) => {
          form.setFieldMeta(
            k as keyof JobApplicationProfileFormValues,
            (prev) => ({
              ...prev,
              error: v?.[0],
            }),
          );
        });
        return false;
      }
    }
    if (currentStep === 3) {
      const stepSchema = jobApplicationProfileSchema.pick({
        countriesOfCitizenship: true,
        isVeteran: true,
      });
      const r = stepSchema.safeParse(value);
      if (!r.success) {
        const err = r.error.flatten().fieldErrors;
        Object.entries(err).forEach(([k, v]) => {
          form.setFieldMeta(
            k as keyof JobApplicationProfileFormValues,
            (prev) => ({
              ...prev,
              error: v?.[0],
            }),
          );
        });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep())
      setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Job application profile</CardTitle>
            <p className="text-muted-foreground text-sm">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentStep < TOTAL_STEPS) {
                  handleNext();
                } else {
                  form.handleSubmit();
                }
              }}
              className="space-y-6"
            >
              {currentStep === 1 && (
                <FieldGroup className="space-y-4">
                  <form.Field name="firstName">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>First name</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Jane"
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="lastName">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>Last name</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Doe"
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="email">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>Email</FieldTitle>
                        <Input
                          type="email"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="jane@example.com"
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="phone">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>Phone</FieldTitle>
                        <PhoneInput
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="+1 234 567 8900"
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="dateOfBirth">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>Date of birth</FieldTitle>
                        <Input
                          type="date"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="gender">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>Gender</FieldTitle>
                        <Select
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDER_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                </FieldGroup>
              )}

              {currentStep === 2 && (
                <FieldGroup className="space-y-4">
                  <form.Field name="address">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>Address</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="123 Main St"
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="city">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>City</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="New York"
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="state">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>State / Province</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="NY"
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="zip">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>ZIP / Postal code</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="10001"
                          aria-invalid={!!field.state.meta.errors?.length}
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="countryOfResidence">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <FieldTitle>Country of residence</FieldTitle>
                        <CountryDropdown
                          key={field.state.value || "residence"}
                          defaultValue={field.state.value || undefined}
                          placeholder="Select country"
                          onChange={(country: Country) =>
                            field.handleChange(country.alpha3)
                          }
                        />
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                </FieldGroup>
              )}

              {currentStep === 3 && (
                <FieldGroup className="space-y-4">
                  <form.Field name="countriesOfCitizenship">
                    {(field) => {
                      const list = field.state.value ?? [];
                      return (
                        <Field data-invalid={!!field.state.meta.errors?.length}>
                          <FieldTitle>Countries of citizenship</FieldTitle>
                          <div className="space-y-2">
                            {list.map((code: string, idx: number) => {
                              const country = getCountryByAlpha3(code);
                              return (
                                <div
                                  key={`${code}-${idx}`}
                                  className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                >
                                  {country ? (
                                    <>
                                      <div className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                                        <CircleFlag
                                          countryCode={country.alpha2.toLowerCase()}
                                          height={20}
                                        />
                                      </div>
                                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {country.name}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="flex-1 text-muted-foreground">
                                      {code}
                                    </span>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Remove"
                                    onClick={() => {
                                      const next = list.filter(
                                        (_: string, i: number) => i !== idx,
                                      );
                                      field.handleChange(next);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                            <CountryDropdown
                              placeholder="Add country of citizenship"
                              onChange={(country: Country) => {
                                const code = country.alpha3;
                                if (!list.includes(code)) {
                                  field.handleChange([...list, code]);
                                }
                              }}
                            />
                          </div>
                          <FieldError
                            errors={toFieldErrors(field.state.meta.errors)}
                          />
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="isVeteran">
                    {(field) => (
                      <Field data-invalid={!!field.state.meta.errors?.length}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isVeteran"
                            checked={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.checked)
                            }
                            onBlur={field.handleBlur}
                            className="h-4 w-4 rounded border-input"
                          />
                          <label
                            htmlFor="isVeteran"
                            className="text-sm font-medium cursor-pointer"
                          >
                            I am a veteran
                          </label>
                        </div>
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      </Field>
                    )}
                  </form.Field>
                </FieldGroup>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="px-2 py-1"
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                {currentStep < TOTAL_STEPS ? (
                  <Button type="submit" className="px-2 py-1">
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-2 py-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
