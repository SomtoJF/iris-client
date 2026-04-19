import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/page-title";
import { Loader2, X } from "lucide-react";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";
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
import { Separator } from "@/components/ui/separator";
import {
  getJobApplicationProfile,
  patchJobApplicationProfile,
  jobApplicationProfileSchema,
  LANGUAGE_PROFICIENCY_OPTIONS,
  WORKING_ARRANGEMENT_OPTIONS,
  type JobApplicationProfileFormValues,
} from "@/services/jobApplicationProfile";

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const ETHNICITY_OPTIONS = [
  { value: "hispanic", label: "Hispanic" },
  { value: "latino", label: "Latino" },
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
  { value: "asian", label: "Asian" },
  {
    value: "native_hawaiian_pacific_islander",
    label: "Native Hawaiian or Other Pacific Islander",
  },
  {
    value: "american_indian_alaska_native",
    label: "American Indian or Alaska Native",
  },
  { value: "two_or_more_races", label: "Two or More Races" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "CAD", label: "CAD" },
  { value: "AUD", label: "AUD" },
  { value: "NGN", label: "NGN" },
  { value: "GHS", label: "GHS" },
  { value: "KES", label: "KES" },
  { value: "ZAR", label: "ZAR" },
  { value: "INR", label: "INR" },
  { value: "JPY", label: "JPY" },
  { value: "CNY", label: "CNY" },
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
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: "USD",
  ethnicity: "",
  isOpenToRelocating: null,
  noticePeriodDays: null,
  preferredWorkingArrangement: [],
  languageProficiencies: [],
  portfolioLink: null,
};

const countryList = countries.all.filter(
  (c: Country) => c.emoji && c.status !== "deleted" && c.ioc !== "PRK",
);

function getCountryByAlpha3(alpha3: string): Country | undefined {
  return countryList.find((c: Country) => c.alpha3 === alpha3);
}

function isFormDirty(
  current: JobApplicationProfileFormValues,
  initial: JobApplicationProfileFormValues,
): boolean {
  const a = [...(current.countriesOfCitizenship ?? [])].sort();
  const b = [...(initial.countriesOfCitizenship ?? [])].sort();
  if (a.length !== b.length || a.some((v, i) => v !== b[i])) return true;
  const keys: (keyof JobApplicationProfileFormValues)[] = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "city",
    "state",
    "zip",
    "countryOfResidence",
    "isVeteran",
    "gender",
    "dateOfBirth",
    "salaryMin",
    "salaryMax",
    "salaryCurrency",
    "ethnicity",
    "isOpenToRelocating",
    "noticePeriodDays",
    "portfolioLink",
  ];
  if (
    String(current.preferredWorkingArrangement ?? "") !==
    String(initial.preferredWorkingArrangement ?? "")
  )
    return true;

  if (
    JSON.stringify(current.languageProficiencies ?? []) !==
    JSON.stringify(initial.languageProficiencies ?? [])
  )
    return true;

  return keys.some((k) => String(current[k] ?? "") !== String(initial[k] ?? ""));
}

function toFieldErrors(err: unknown): Array<{ message?: string } | undefined> {
  if (!Array.isArray(err)) return [];
  return err.map((e) =>
    typeof e === "string" ? { message: e } : (e as { message?: string }),
  );
}

export default function ApplicationProfile() {
  usePageTitle("Application Profile");
  const [initialData, setInitialData] =
    useState<JobApplicationProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getJobApplicationProfile();
        if (cancelled) return;
        const { id: _id, ...rest } = profile;
        setInitialData({
          ...rest,
          dateOfBirth: profile.dateOfBirth?.slice(0, 10) ?? "",
          countriesOfCitizenship: profile.countriesOfCitizenship ?? [],
          salaryMin: profile.salaryMin ?? null,
          salaryMax: profile.salaryMax ?? null,
          salaryCurrency: profile.salaryCurrency ?? "USD",
          ethnicity: profile.ethnicity ?? "",
          isOpenToRelocating: profile.isOpenToRelocating ?? null,
          noticePeriodDays: profile.noticePeriodDays ?? null,
          preferredWorkingArrangement: profile.preferredWorkingArrangement ?? [],
          languageProficiencies: profile.languageProficiencies ?? [],
          portfolioLink: profile.portfolioLink ?? null,
        });
      } catch {
        if (!cancelled) {
          toast.error("Failed to load profile.");
          setInitialData(defaultFormValues);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || !initialData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProfileForm initialData={initialData} />;
    </div>
  );
}

function ProfileForm({
  initialData,
}: {
  initialData: JobApplicationProfileFormValues;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: initialData,
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
        await patchJobApplicationProfile(parsed.data);
        toast.success("Profile updated successfully");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update profile",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="max-w-2xl h-fit">
      <header className="mb-6 space-y-2">
        <h1 className="text-xl font-semibold">Application Profile</h1>
        <p className="text-sm text-muted-foreground">
          We use this information to automatically complete job applications on
          your behalf.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic personal details.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="firstName">
                  {(field) => (
                    <Field data-invalid={!!field.state.meta.errors?.length}>
                      <FieldTitle>First name</FieldTitle>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Jane"
                        disabled
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
                        disabled
                      />
                      <FieldError
                        errors={toFieldErrors(field.state.meta.errors)}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>

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
                    />
                    <FieldError
                      errors={toFieldErrors(field.state.meta.errors)}
                    />
                  </Field>
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="dateOfBirth">
                  {(field) => (
                    <Field data-invalid={!!field.state.meta.errors?.length}>
                      <FieldTitle>Date of birth</FieldTitle>
                      <Input
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
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
                        disabled
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
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Separator />

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Your current residential address.</CardDescription>
          </CardHeader>
          <CardContent>
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
                    />
                    <FieldError
                      errors={toFieldErrors(field.state.meta.errors)}
                    />
                  </Field>
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="city">
                  {(field) => (
                    <Field data-invalid={!!field.state.meta.errors?.length}>
                      <FieldTitle>City</FieldTitle>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="New York"
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
                      />
                      <FieldError
                        errors={toFieldErrors(field.state.meta.errors)}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="zip">
                  {(field) => (
                    <Field data-invalid={!!field.state.meta.errors?.length}>
                      <FieldTitle>ZIP / Postal code</FieldTitle>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="10001"
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
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Separator />

        {/* Additional */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <FieldTitle>Veteran status</FieldTitle>
                    <RadioGroup
                      value={String(field.state.value)}
                      onValueChange={(v) => field.handleChange(v === "true")}
                      onBlur={field.handleBlur}
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
                      errors={toFieldErrors(field.state.meta.errors)}
                    />
                  </Field>
                )}
              </form.Field>

              <Field>
                <FieldTitle>Expected annual salary</FieldTitle>
                <div className="flex gap-4 items-center">
                  <form.Field name="salaryCurrency">
                    {(field) => (
                      <Field className="w-20">
                        <FieldTitle>Currency</FieldTitle>
                        <Select
                          value={field.state.value ?? "USD"}
                          onValueChange={(v) => field.handleChange(v)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...CURRENCY_OPTIONS]
                              .sort((a, b) => a.label.localeCompare(b.label))
                              .map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>
                  <div className="grid grid-cols-2 gap-4">
                    <form.Field name="salaryMin">
                      {(field) => (
                        <Field data-invalid={!!field.state.meta.errors?.length}>
                          <FieldTitle>Min</FieldTitle>
                          <Input
                            type="number"
                            min={0}
                            value={field.state.value ?? ""}
                            onChange={(e) =>
                              field.handleChange(
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                              )
                            }
                            onBlur={field.handleBlur}
                            placeholder="e.g. 50000"
                          />
                          <FieldError
                            errors={toFieldErrors(field.state.meta.errors)}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="salaryMax">
                      {(field) => (
                        <Field data-invalid={!!field.state.meta.errors?.length}>
                          <FieldTitle>Max</FieldTitle>
                          <Input
                            type="number"
                            min={0}
                            value={field.state.value ?? ""}
                            onChange={(e) =>
                              field.handleChange(
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                              )
                            }
                            onBlur={field.handleBlur}
                            placeholder="e.g. 80000"
                          />
                          <FieldError
                            errors={toFieldErrors(field.state.meta.errors)}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </div>
                </div>
              </Field>

              <form.Field name="ethnicity">
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors?.length}>
                    <FieldTitle>Ethnicity</FieldTitle>
                    <Select
                      value={field.state.value ?? ""}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        {ETHNICITY_OPTIONS.map((opt) => (
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

              <form.Field name="isOpenToRelocating">
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors?.length}>
                    <FieldTitle>Open to relocating?</FieldTitle>
                    <RadioGroup
                      value={
                        field.state.value === null ? "" : String(field.state.value)
                      }
                      onValueChange={(v) => {
                        if (v === "true") field.handleChange(true);
                        else if (v === "false") field.handleChange(false);
                        else field.handleChange(null);
                      }}
                      onBlur={field.handleBlur}
                      className="flex flex-row gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="true"
                          id="settings-isOpenToRelocating-yes"
                        />
                        <label
                          htmlFor="settings-isOpenToRelocating-yes"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="false"
                          id="settings-isOpenToRelocating-no"
                        />
                        <label
                          htmlFor="settings-isOpenToRelocating-no"
                          className="text-sm font-medium cursor-pointer"
                        >
                          No
                        </label>
                      </div>
                    </RadioGroup>
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="noticePeriodDays">
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors?.length}>
                    <FieldTitle>Notice period (days)</FieldTitle>
                    <Input
                      type="number"
                      min={0}
                      value={field.state.value ?? ""}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      onBlur={field.handleBlur}
                      placeholder="e.g. 14"
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="preferredWorkingArrangement">
                {(field) => {
                  const selected = field.state.value ?? [];
                  return (
                    <Field data-invalid={!!field.state.meta.errors?.length}>
                      <FieldTitle>Preferred working arrangement</FieldTitle>
                      <div className="space-y-2">
                        {WORKING_ARRANGEMENT_OPTIONS.map((opt) => {
                          const checked = selected.includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className="flex items-start gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...selected, opt.value]
                                    : selected.filter((v) => v !== opt.value);
                                  field.handleChange(next);
                                }}
                              />
                              <span>{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="languageProficiencies">
                {(field) => {
                  const list = field.state.value ?? [];
                  return (
                    <Field data-invalid={!!field.state.meta.errors?.length}>
                      <FieldTitle>Languages</FieldTitle>
                      <div className="space-y-3">
                        {list.map((lp, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-end"
                          >
                            <div className="sm:col-span-2">
                              <FieldTitle>Language</FieldTitle>
                              <Input
                                value={lp.language}
                                onChange={(e) => {
                                  const next = [...list];
                                  next[idx] = { ...next[idx], language: e.target.value };
                                  field.handleChange(next);
                                }}
                                placeholder="e.g. English"
                              />
                            </div>
                            <div>
                              <FieldTitle>Proficiency</FieldTitle>
                              <Select
                                value={lp.proficiency}
                                onValueChange={(v) => {
                                  const next = [...list];
                                  next[idx] = { ...next[idx], proficiency: v };
                                  field.handleChange(next);
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {LANGUAGE_PROFICIENCY_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="sm:col-span-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const next = list.filter((_v, i) => i !== idx);
                                  field.handleChange(next);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            field.handleChange([
                              ...list,
                              { language: "", proficiency: "" },
                            ])
                          }
                        >
                          Add language
                        </Button>
                      </div>
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="portfolioLink">
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors?.length}>
                    <FieldTitle>Portfolio link (optional)</FieldTitle>
                    <Input
                      value={field.state.value ?? ""}
                      onChange={(e) =>
                        field.handleChange(e.target.value === "" ? null : e.target.value)
                      }
                      onBlur={field.handleBlur}
                      placeholder="https://..."
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-8">
          <form.Subscribe selector={(state) => state.values}>
            {(values) => {
              const isDirty = isFormDirty(
                values as JobApplicationProfileFormValues,
                initialData,
              );
              return (
                <Button type="submit" disabled={!isDirty || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              );
            }}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
