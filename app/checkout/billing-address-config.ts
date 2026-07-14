/**
 * Billing address: supported countries, regional options, and field hints.
 * Extend `BILLING_COUNTRIES` / per-country `states` as you scale (e.g. India districts).
 */

export type BillingCountryCode = "IN" | "US" | "GB" | "CA" | "AU" | "AE" | "SG";

export type BillingStateOption = {
  value: string;
  label: string;
};

export type BillingCountryConfig = {
  code: BillingCountryCode;
  flag: string;
  label: string;
  /** Label for postal / PIN field */
  postalLabel: string;
  postalPlaceholder: string;
  /** Label for state / province / emirate */
  stateLabel: string;
  statePlaceholder: string;
  /** If non-empty, render a `select`; otherwise a text `input`. */
  states: BillingStateOption[];
  phoneLabel: string;
  phonePlaceholder: string;
  /** Shown as helper text under phone */
  phoneHint: string;
};

const inStates: BillingStateOption[] = [
  { value: "AN", label: "Andaman and Nicobar Islands" },
  { value: "AP", label: "Andhra Pradesh" },
  { value: "AR", label: "Arunachal Pradesh" },
  { value: "AS", label: "Assam" },
  { value: "BR", label: "Bihar" },
  { value: "CH", label: "Chandigarh" },
  { value: "CG", label: "Chhattisgarh" },
  { value: "DN", label: "Dadra and Nagar Haveli and Daman and Diu" },
  { value: "DL", label: "Delhi" },
  { value: "GA", label: "Goa" },
  { value: "GJ", label: "Gujarat" },
  { value: "HR", label: "Haryana" },
  { value: "HP", label: "Himachal Pradesh" },
  { value: "JK", label: "Jammu and Kashmir" },
  { value: "JH", label: "Jharkhand" },
  { value: "KA", label: "Karnataka" },
  { value: "KL", label: "Kerala" },
  { value: "LA", label: "Ladakh" },
  { value: "LD", label: "Lakshadweep" },
  { value: "MP", label: "Madhya Pradesh" },
  { value: "MH", label: "Maharashtra" },
  { value: "MN", label: "Manipur" },
  { value: "ML", label: "Meghalaya" },
  { value: "MZ", label: "Mizoram" },
  { value: "NL", label: "Nagaland" },
  { value: "OR", label: "Odisha" },
  { value: "PY", label: "Puducherry" },
  { value: "PB", label: "Punjab" },
  { value: "RJ", label: "Rajasthan" },
  { value: "SK", label: "Sikkim" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "TS", label: "Telangana" },
  { value: "TR", label: "Tripura" },
  { value: "UP", label: "Uttar Pradesh" },
  { value: "UK", label: "Uttarakhand" },
  { value: "WB", label: "West Bengal" },
];

const usStates: BillingStateOption[] = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const caProvinces: BillingStateOption[] = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

const auStates: BillingStateOption[] = [
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NSW", label: "New South Wales" },
  { value: "NT", label: "Northern Territory" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "VIC", label: "Victoria" },
  { value: "WA", label: "Western Australia" },
];

const aeEmirates: BillingStateOption[] = [
  { value: "AZ", label: "Abu Dhabi" },
  { value: "AJ", label: "Ajman" },
  { value: "DU", label: "Dubai" },
  { value: "FU", label: "Fujairah" },
  { value: "RK", label: "Ras Al Khaimah" },
  { value: "SH", label: "Sharjah" },
  { value: "UQ", label: "Umm Al Quwain" },
];

/** Singapore: regions only for now (scale to planning areas later). */
const sgRegions: BillingStateOption[] = [
  { value: "C", label: "Central Region" },
  { value: "E", label: "East Region" },
  { value: "N", label: "North Region" },
  { value: "NE", label: "North-East Region" },
  { value: "W", label: "West Region" },
];

/** UK: constituent countries (scale to counties later). */
const ukNations: BillingStateOption[] = [
  { value: "ENG", label: "England" },
  { value: "SCT", label: "Scotland" },
  { value: "WLS", label: "Wales" },
  { value: "NIR", label: "Northern Ireland" },
];

export const BILLING_COUNTRIES: Record<BillingCountryCode, BillingCountryConfig> = {
  IN: {
    code: "IN",
    flag: "🇮🇳",
    label: "India",
    postalLabel: "PIN code",
    postalPlaceholder: "e.g. 560001",
    stateLabel: "State / UT",
    statePlaceholder: "Select state",
    states: inStates,
    phoneLabel: "Phone number",
    phonePlaceholder: "98765 43210",
    phoneHint: "10-digit mobile · +91",
  },
  US: {
    code: "US",
    flag: "🇺🇸",
    label: "United States",
    postalLabel: "ZIP code",
    postalPlaceholder: "e.g. 94102",
    stateLabel: "State",
    statePlaceholder: "Select state",
    states: usStates,
    phoneLabel: "Phone number",
    phonePlaceholder: "(555) 123-4567",
    phoneHint: "+1 · digits OK",
  },
  GB: {
    code: "GB",
    flag: "🇬🇧",
    label: "United Kingdom",
    postalLabel: "Postcode",
    postalPlaceholder: "e.g. SW1A 1AA",
    stateLabel: "UK nation / region",
    statePlaceholder: "Select nation",
    states: ukNations,
    phoneLabel: "Phone number",
    phonePlaceholder: "7700 900123",
    phoneHint: "+44 · drop leading 0",
  },
  CA: {
    code: "CA",
    flag: "🇨🇦",
    label: "Canada",
    postalLabel: "Postal code",
    postalPlaceholder: "e.g. K1A 0B1",
    stateLabel: "Province / territory",
    statePlaceholder: "Select province",
    states: caProvinces,
    phoneLabel: "Phone number",
    phonePlaceholder: "416-555-0100",
    phoneHint: "+1 Canada.",
  },
  AU: {
    code: "AU",
    flag: "🇦🇺",
    label: "Australia",
    postalLabel: "Postcode",
    postalPlaceholder: "e.g. 2000",
    stateLabel: "State / territory",
    statePlaceholder: "Select state",
    states: auStates,
    phoneLabel: "Phone number",
    phonePlaceholder: "04XX XXX XXX",
    phoneHint: "+61 Australia.",
  },
  AE: {
    code: "AE",
    flag: "🇦🇪",
    label: "United Arab Emirates",
    postalLabel: "P.O. box / area code",
    postalPlaceholder: "e.g. 00000",
    stateLabel: "Emirate",
    statePlaceholder: "Select emirate",
    states: aeEmirates,
    phoneLabel: "Phone number",
    phonePlaceholder: "50 123 4567",
    phoneHint: "+971 UAE.",
  },
  SG: {
    code: "SG",
    flag: "🇸🇬",
    label: "Singapore",
    postalLabel: "Postal code",
    postalPlaceholder: "e.g. 018956",
    stateLabel: "Region",
    statePlaceholder: "Select region",
    states: sgRegions,
    phoneLabel: "Phone number",
    phonePlaceholder: "8123 4567",
    phoneHint: "+65 Singapore.",
  },
};

/** Ordered list for the country select (India first). */
export const BILLING_COUNTRY_SELECT_OPTIONS: { code: BillingCountryCode }[] = [
  { code: "IN" },
  { code: "US" },
  { code: "GB" },
  { code: "CA" },
  { code: "AU" },
  { code: "AE" },
  { code: "SG" },
];

export function getBillingCountryConfig(
  code: string
): BillingCountryConfig | null {
  if (code in BILLING_COUNTRIES) {
    return BILLING_COUNTRIES[code as BillingCountryCode];
  }
  return null;
}

export function isBillingCountryCode(code: string): code is BillingCountryCode {
  return code in BILLING_COUNTRIES;
}
