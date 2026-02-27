import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

const STEP_FIELDS: Record<number, (keyof JobApplicationProfileFormValues)[]> = {
  1: ["firstName", "lastName", "email", "phone", "dateOfBirth", "gender"],
  2: ["address", "city", "state", "zip", "countryOfResidence"],
  3: ["countriesOfCitizenship", "isVeteran"],
};

export default function ApplicationOnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<
    Partial<Record<keyof JobApplicationProfileFormValues, string>>
  >({});
  const [firstErrorFieldToFocus, setFirstErrorFieldToFocus] = useState<
    string | null
  >(null);

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

  useEffect(() => {
    if (!firstErrorFieldToFocus) return;
    const wrapper = document.querySelector(
      `[data-field="${firstErrorFieldToFocus}"]`,
    );
    const focusable = wrapper?.querySelector<HTMLElement>(
      "input, button, [role='combobox']",
    );
    focusable?.focus();
    setFirstErrorFieldToFocus(null);
  }, [firstErrorFieldToFocus]);

  const validateCurrentStep = (): {
    valid: boolean;
    firstErrorField?: keyof JobApplicationProfileFormValues;
    errors?: Partial<Record<keyof JobApplicationProfileFormValues, string>>;
  } => {
    const value = form.state.values;
    const stepFieldNames = STEP_FIELDS[currentStep];
    if (!stepFieldNames) return { valid: true };

    const pickShape = stepFieldNames.reduce(
      (acc, name) => ({ ...acc, [name]: true as const }),
      {} as Partial<Record<keyof JobApplicationProfileFormValues, true>>,
    );
    const stepSchema = jobApplicationProfileSchema.pick(
      pickShape as Record<keyof typeof jobApplicationProfileSchema.shape, true>,
    );
    const r = stepSchema.safeParse(value);

    if (r.success) {
      return { valid: true };
    }

    const err = r.error.flatten().fieldErrors as Partial<
      Record<keyof JobApplicationProfileFormValues, string[]>
    >;
    const errors: Partial<
      Record<keyof JobApplicationProfileFormValues, string>
    > = {};
    let firstErrorField: keyof JobApplicationProfileFormValues | undefined;
    for (const name of stepFieldNames) {
      const msg = err[name]?.[0];
      if (msg) {
        errors[name] = msg;
        if (firstErrorField === undefined) firstErrorField = name;
      }
    }
    return { valid: false, firstErrorField, errors };
  };

  const handleNext = () => {
    const result = validateCurrentStep();
    if (result.valid) {
      setStepErrors({});
      setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
      return;
    }
    if (result.errors) setStepErrors(result.errors);
    if (result.firstErrorField)
      setFirstErrorFieldToFocus(result.firstErrorField);
  };

  const handleBack = () => {
    setStepErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

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
            <CardDescription>
              We use this information to automatically complete job applications
              on your behalf. Please answer the following common questions to
              finish your profile.
            </CardDescription>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted mt-2"
              role="progressbar"
              aria-valuenow={currentStep}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-label={`Step ${currentStep} of ${TOTAL_STEPS}`}
            >
              <div
                className="h-full rounded-full bg-purple-500 transition-[width] duration-300 ease-out"
                style={{
                  width: `${(currentStep / TOTAL_STEPS) * 100}%`,
                }}
              />
            </div>
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
                      <Field
                        data-field="firstName"
                        data-invalid={
                          !!(
                            stepErrors.firstName ??
                            field.state.meta.errors?.length
                          )
                        }
                      >
                        <FieldTitle>First name</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Jane"
                          aria-invalid={
                            !!(
                              stepErrors.firstName ??
                              field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.firstName
                              ? [{ message: stepErrors.firstName }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="lastName">
                    {(field) => (
                      <Field
                        data-field="lastName"
                        data-invalid={
                          !!(
                            stepErrors.lastName ??
                            field.state.meta.errors?.length
                          )
                        }
                      >
                        <FieldTitle>Last name</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Doe"
                          aria-invalid={
                            !!(
                              stepErrors.lastName ??
                              field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.lastName
                              ? [{ message: stepErrors.lastName }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="email">
                    {(field) => (
                      <Field
                        data-field="email"
                        data-invalid={
                          !!(
                            stepErrors.email ?? field.state.meta.errors?.length
                          )
                        }
                      >
                        <FieldTitle>Email</FieldTitle>
                        <Input
                          type="email"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="jane@example.com"
                          aria-invalid={
                            !!(
                              stepErrors.email ??
                              field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.email
                              ? [{ message: stepErrors.email }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="phone">
                    {(field) => (
                      <Field
                        data-field="phone"
                        data-invalid={
                          !!(
                            stepErrors.phone ?? field.state.meta.errors?.length
                          )
                        }
                      >
                        <FieldTitle>Phone</FieldTitle>
                        <PhoneInput
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="+1 234 567 8900"
                          aria-invalid={
                            !!(
                              stepErrors.phone ??
                              field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.phone
                              ? [{ message: stepErrors.phone }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="dateOfBirth">
                    {(field) => (
                      <Field
                        data-field="dateOfBirth"
                        data-invalid={
                          !!(
                            stepErrors.dateOfBirth ??
                            field.state.meta.errors?.length
                          )
                        }
                      >
                        <FieldTitle>Date of birth</FieldTitle>
                        <Input
                          type="date"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          aria-invalid={
                            !!(
                              stepErrors.dateOfBirth ??
                              field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.dateOfBirth
                              ? [{ message: stepErrors.dateOfBirth }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="gender">
                    {(field) => (
                      <Field
                        data-field="gender"
                        data-invalid={
                          !!(
                            stepErrors.gender ?? field.state.meta.errors?.length
                          )
                        }
                      >
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
                          errors={
                            stepErrors.gender
                              ? [{ message: stepErrors.gender }]
                              : toFieldErrors(field.state.meta.errors)
                          }
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
                      <Field
                        data-field="address"
                        data-invalid={
                          !!(
                            stepErrors.address ??
                            field.state.meta.errors?.length
                          )
                        }
                      >
                        <FieldTitle>Address</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="123 Main St"
                          aria-invalid={
                            !!(
                              stepErrors.address ??
                              field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.address
                              ? [{ message: stepErrors.address }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="city">
                    {(field) => (
                      <Field
                        data-field="city"
                        data-invalid={
                          !!(stepErrors.city ?? field.state.meta.errors?.length)
                        }
                      >
                        <FieldTitle>City</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="New York"
                          aria-invalid={
                            !!(
                              stepErrors.city ?? field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.city
                              ? [{ message: stepErrors.city }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="state">
                    {(field) => (
                      <Field
                        data-field="state"
                        data-invalid={
                          !!(
                            stepErrors.state ?? field.state.meta.errors?.length
                          )
                        }
                      >
                        <FieldTitle>State / Province</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="NY"
                          aria-invalid={
                            !!(
                              stepErrors.state ??
                              field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.state
                              ? [{ message: stepErrors.state }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="zip">
                    {(field) => (
                      <Field
                        data-field="zip"
                        data-invalid={
                          !!(stepErrors.zip ?? field.state.meta.errors?.length)
                        }
                      >
                        <FieldTitle>ZIP / Postal code</FieldTitle>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="10001"
                          aria-invalid={
                            !!(
                              stepErrors.zip ?? field.state.meta.errors?.length
                            )
                          }
                        />
                        <FieldError
                          errors={
                            stepErrors.zip
                              ? [{ message: stepErrors.zip }]
                              : toFieldErrors(field.state.meta.errors)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="countryOfResidence">
                    {(field) => (
                      <Field
                        data-field="countryOfResidence"
                        data-invalid={
                          !!(
                            stepErrors.countryOfResidence ??
                            field.state.meta.errors?.length
                          )
                        }
                      >
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
                          errors={
                            stepErrors.countryOfResidence
                              ? [{ message: stepErrors.countryOfResidence }]
                              : toFieldErrors(field.state.meta.errors)
                          }
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
                        <Field
                          data-field="countriesOfCitizenship"
                          data-invalid={
                            !!(
                              stepErrors.countriesOfCitizenship ??
                              field.state.meta.errors?.length
                            )
                          }
                        >
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
                            errors={
                              stepErrors.countriesOfCitizenship
                                ? [
                                    {
                                      message:
                                        stepErrors.countriesOfCitizenship,
                                    },
                                  ]
                                : toFieldErrors(field.state.meta.errors)
                            }
                          />
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="isVeteran">
                    {(field) => (
                      <Field
                        data-field="isVeteran"
                        data-invalid={
                          !!(
                            stepErrors.isVeteran ??
                            field.state.meta.errors?.length
                          )
                        }
                      >
                        <FieldTitle>I am a veteran</FieldTitle>
                        <RadioGroup
                          value={String(field.state.value)}
                          onValueChange={(v) =>
                            field.handleChange(v === "true")
                          }
                          onBlur={field.handleBlur}
                          aria-invalid={
                            !!(
                              stepErrors.isVeteran ??
                              field.state.meta.errors?.length
                            )
                          }
                          className="flex flex-row gap-4"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="true" id="isVeteran-yes" />
                            <label
                              htmlFor="isVeteran-yes"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Yes
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="false" id="isVeteran-no" />
                            <label
                              htmlFor="isVeteran-no"
                              className="text-sm font-medium cursor-pointer"
                            >
                              No
                            </label>
                          </div>
                        </RadioGroup>
                        <FieldError
                          errors={
                            stepErrors.isVeteran
                              ? [{ message: stepErrors.isVeteran }]
                              : toFieldErrors(field.state.meta.errors)
                          }
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
