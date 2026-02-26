"use client";
import { useState, forwardRef, useEffect } from "react";
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { CircleFlag } from "react-circle-flags";
import { lookup, countries } from "country-data-list";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ChevronDown, GlobeIcon } from "lucide-react";

export const phoneSchema = z.string().refine((value) => {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}, "Invalid phone number");

export type CountryData = {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
};

const countryList = countries.all.filter(
  (c: CountryData) => c.emoji && c.status !== "deleted" && c.ioc !== "PRK",
) as CountryData[];

interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  onCountryChange?: (data: CountryData | undefined) => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  defaultCountry?: string;
  className?: string;
  inline?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      onCountryChange,
      onChange,
      value,
      placeholder,
      defaultCountry,
      inline = false,
      ...props
    },
    ref,
  ) => {
    const [, setCountryData] = useState<CountryData | undefined>();
    const [displayFlag, setDisplayFlag] = useState<string>("");
    const [hasInitialized, setHasInitialized] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
      if (defaultCountry) {
        const newCountryData = lookup.countries({
          alpha2: defaultCountry.toLowerCase(),
        })[0];
        setCountryData(newCountryData);
        setDisplayFlag(defaultCountry.toLowerCase());

        if (
          !hasInitialized &&
          newCountryData?.countryCallingCodes?.[0] &&
          !value
        ) {
          const syntheticEvent = {
            target: {
              value: newCountryData.countryCallingCodes[0],
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange?.(syntheticEvent);
          setHasInitialized(true);
        }
      }
    }, [defaultCountry, onChange, value, hasInitialized]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Ensure the value starts with "+"
      if (!newValue.startsWith("+")) {
        // Replace "00" at the start with "+" if present
        if (newValue.startsWith("00")) {
          newValue = "+" + newValue.slice(2);
        } else {
          // Otherwise just add "+" at the start
          newValue = "+" + newValue;
        }
      }

      try {
        const parsed = parsePhoneNumber(newValue);

        if (parsed && parsed.country) {
          const countryCode = parsed.country;

          // Force immediate update
          setDisplayFlag(""); // Clear first
          setTimeout(() => {
            setDisplayFlag(countryCode.toLowerCase()); // Then set new value
          }, 0);

          // Update other state
          const countryInfo = lookup.countries({ alpha2: countryCode })[0];
          setCountryData(countryInfo);
          onCountryChange?.(countryInfo);

          // Update input value
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              value: parsed.number,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange?.(syntheticEvent);
        } else {
          onChange?.(e);
          setDisplayFlag("");
          setCountryData(undefined);
          onCountryChange?.(undefined);
        }
      } catch {
        onChange?.(e);
        setDisplayFlag("");
        setCountryData(undefined);
        onCountryChange?.(undefined);
      }
    };

    const inputClasses = cn(
      "flex items-center gap-2 relative bg-transparent transition-colors text-base rounded-md border border-input pl-3 h-9 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed md:text-sm has-[input:focus]:outline-none has-[input:focus]:ring-1 has-[input:focus]:ring-ring [interpolate-size:allow-keywords]",
      inline && "rounded-l-none w-full",
      className,
    );

    const handleSelectCountry = (country: CountryData) => {
      const code = country.countryCallingCodes?.[0] ?? "";
      const callingValue = code.startsWith("+") ? code : `+${code}`;
      setDisplayFlag(country.alpha2.toLowerCase());
      setCountryData(country);
      onCountryChange?.(country);
      onChange?.({
        target: { value: callingValue },
      } as React.ChangeEvent<HTMLInputElement>);
      setPopoverOpen(false);
    };

    return (
      <div className={inputClasses}>
        {!inline && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Select country"
              >
                {displayFlag ? (
                  <CircleFlag countryCode={displayFlag} height={16} />
                ) : (
                  <GlobeIcon size={16} />
                )}
                <ChevronDown className="ml-0.5 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              collisionPadding={10}
              side="bottom"
              align="start"
              className="min-w-[--radix-popper-anchor-width] p-0"
            >
              <Command className="w-full max-h-[200px] sm:max-h-[270px]">
                <CommandList>
                  <div className="sticky top-0 z-10 bg-popover">
                    <CommandInput placeholder="Search country..." />
                  </div>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {countryList
                      .filter((x) => x.name)
                      .map((option, key) => (
                        <CommandItem
                          className="flex items-center w-full gap-2"
                          key={key}
                          onSelect={() => handleSelectCountry(option)}
                        >
                          <div className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                            <CircleFlag
                              countryCode={option.alpha2.toLowerCase()}
                              height={20}
                            />
                          </div>
                          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {option.name}
                          </span>
                          {option.countryCallingCodes?.[0] && (
                            <span className="text-muted-foreground text-sm">
                              +
                              {option.countryCallingCodes[0].replace(/^\+/, "")}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        <input
          ref={ref}
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder || "Enter number"}
          type="tel"
          autoComplete="tel"
          name="phone"
          className={cn(
            "flex w-full border-none bg-transparent text-base transition-colors placeholder:text-muted-foreground outline-none h-9 py-1 p-0 leading-none md:text-sm [interpolate-size:allow-keywords]",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
