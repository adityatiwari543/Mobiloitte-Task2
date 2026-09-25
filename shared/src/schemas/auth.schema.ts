import { z } from 'zod';
import { ROLES, GENDER_OPTIONS } from '../constants/roles.js';
import { HIGHEST_QUALIFICATIONS } from '../constants/qualifications.js';
import {
  BLOCKED_USERNAMES,
  DISPOSABLE_EMAIL_DOMAINS,
  RESERVED_DOMAINS,
  RESERVED_TLDS,
} from '../constants/blockedEmailPatterns.js';
import { COUNTRIES, DEFAULT_COUNTRY, type CountryMetadata } from '../constants/countries.js';
import {
  FIRST_NAME_REGEX,
  LAST_NAME_REGEX,
  PASSWORD_REGEX,
  OTP_REGEX,
  VALIDATION_LIMITS,
} from '../constants/validation.js';

// Helper function to accurately calculate age from YYYY-MM-DD
export function calculateAge(dobString: string): number {
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Section 6A Email validation refine logic
export function validateEmailSecurity(email: string): { valid: boolean; reason?: string } {
  const normalized = email.trim().toLowerCase();
  if (normalized.length < VALIDATION_LIMITS.EMAIL_MIN || normalized.length > VALIDATION_LIMITS.EMAIL_MAX) {
    return { valid: false, reason: 'Email length must be between 6 and 254 characters.' };
  }
  if (/\s/.test(normalized)) {
    return { valid: false, reason: 'Space is not allowed in an email address.' };
  }

  const atParts = normalized.split('@');
  if (atParts.length !== 2) {
    return { valid: false, reason: 'Email must contain exactly one @ symbol.' };
  }

  const [localPart, domainPart] = atParts as [string, string];

  // Local part restrictions (Section 6A.8)
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, reason: 'Email local-part cannot begin or end with a dot.' };
  }
  if (localPart.includes('..')) {
    return { valid: false, reason: 'Email local-part cannot contain consecutive dots.' };
  }
  if (/^[._-]/.test(localPart) || /[._-]$/.test(localPart)) {
    return { valid: false, reason: 'Email local-part cannot start or end with ., -, or _.' };
  }
  if (/^[0-9]+$/.test(localPart)) {
    return { valid: false, reason: 'Purely numeric email addresses are not permitted under anti-abuse policy.' };
  }

  // Blocked dummy usernames (Section 6A.9)
  if (BLOCKED_USERNAMES.has(localPart)) {
    return { valid: false, reason: `Username "${localPart}" is a reserved placeholder and cannot be used.` };
  }

  // Domain checks (Section 6A.10, 6A.11)
  if (DISPOSABLE_EMAIL_DOMAINS.has(domainPart)) {
    return { valid: false, reason: 'Temporary or disposable email domains are not allowed.' };
  }
  if (RESERVED_DOMAINS.has(domainPart)) {
    return { valid: false, reason: 'Reserved or testing email domains are not allowed.' };
  }

  // Domain TLD validation (Section 6A.12)
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) {
    return { valid: false, reason: 'Email domain must contain a valid TLD.' };
  }
  const tld = domainParts[domainParts.length - 1] as string;
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return { valid: false, reason: 'Domain suffix (TLD) must be at least 2 alphabetic characters without digits.' };
  }
  if (RESERVED_TLDS.has(tld)) {
    return { valid: false, reason: `TLD .${tld} is reserved and cannot receive internet mail.` };
  }

  return { valid: true };
}

// Known dummy / test numbers blocklist (Section 6A.14)
export const BLOCKED_DUMMY_PHONES = new Set([
  '9876543210',
  '9123456780',
  '9000000000',
  '9111111111',
  '9999900000',
  '9800000000',
  '9988776655',
  '9191919191',
  '9292929292',
  '9393939393',
  '9494949494',
  '9595959595',
]);

// Country-specific starting digits helper
export function checkCountryStartingDigits(
  country: CountryMetadata,
  digitsOnly: string
): { valid: boolean; reason?: string } {
  if (!digitsOnly || digitsOnly.length === 0) {
    return { valid: true };
  }

  // India (+91)
  if (country.iso2 === 'IN' || country.dialCode === '+91') {
    if (digitsOnly.startsWith('0')) {
      return { valid: false, reason: 'Indian mobile numbers must not begin with 0.' };
    }
    if (!/^[6-9]/.test(digitsOnly)) {
      return { valid: false, reason: 'Indian mobile numbers must begin with 6, 7, 8, or 9.' };
    }
  }

  // US & Canada (+1)
  if (country.iso2 === 'US' || country.iso2 === 'CA' || country.dialCode === '+1') {
    if (digitsOnly.startsWith('0') || digitsOnly.startsWith('1')) {
      return { valid: false, reason: 'US/Canada area code must not start with 0 or 1.' };
    }
  }

  // UK (+44)
  if (country.iso2 === 'GB' || country.dialCode === '+44') {
    if (!digitsOnly.startsWith('7')) {
      return { valid: false, reason: 'UK mobile numbers must begin with 7.' };
    }
  }

  // UAE (+971)
  if (country.iso2 === 'AE' || country.dialCode === '+971') {
    if (!digitsOnly.startsWith('5')) {
      return { valid: false, reason: 'UAE mobile numbers must begin with 5.' };
    }
  }

  // Saudi Arabia (+966)
  if (country.iso2 === 'SA' || country.dialCode === '+966') {
    if (!digitsOnly.startsWith('5')) {
      return { valid: false, reason: 'Saudi mobile numbers must begin with 5.' };
    }
  }

  // Singapore (+65)
  if (country.iso2 === 'SG' || country.dialCode === '+65') {
    if (!/^[89]/.test(digitsOnly)) {
      return { valid: false, reason: 'Singapore mobile numbers must begin with 8 or 9.' };
    }
  }

  // Australia (+61)
  if (country.iso2 === 'AU' || country.dialCode === '+61') {
    if (!digitsOnly.startsWith('4')) {
      return { valid: false, reason: 'Australian mobile numbers must begin with 4.' };
    }
  }

  // China (+86)
  if (country.iso2 === 'CN' || country.dialCode === '+86') {
    if (!digitsOnly.startsWith('1')) {
      return { valid: false, reason: 'China mobile numbers must begin with 1.' };
    }
  }

  // Germany (+49)
  if (country.iso2 === 'DE' || country.dialCode === '+49') {
    if (!digitsOnly.startsWith('1')) {
      return { valid: false, reason: 'German mobile numbers must begin with 15, 16, or 17.' };
    }
    if (digitsOnly.length >= 2 && !/^(15|16|17)/.test(digitsOnly)) {
      return { valid: false, reason: 'German mobile numbers must begin with 15, 16, or 17.' };
    }
  }

  // France (+33)
  if (country.iso2 === 'FR' || country.dialCode === '+33') {
    if (!/^[67]/.test(digitsOnly)) {
      return { valid: false, reason: 'French mobile numbers must begin with 6 or 7.' };
    }
  }

  // Japan (+81)
  if (country.iso2 === 'JP' || country.dialCode === '+81') {
    if (!/^[789]/.test(digitsOnly)) {
      return { valid: false, reason: 'Japanese mobile numbers must begin with 70, 80, or 90.' };
    }
    if (digitsOnly.length >= 2 && !/^[789]0/.test(digitsOnly)) {
      return { valid: false, reason: 'Japanese mobile numbers must begin with 70, 80, or 90.' };
    }
  }

  // South Africa (+27)
  if (country.iso2 === 'ZA' || country.dialCode === '+27') {
    if (!/^[678]/.test(digitsOnly)) {
      return { valid: false, reason: 'South African mobile numbers must begin with 6, 7, or 8.' };
    }
  }

  // Netherlands (+31)
  if (country.iso2 === 'NL' || country.dialCode === '+31') {
    if (!digitsOnly.startsWith('6')) {
      return { valid: false, reason: 'Netherlands mobile numbers must begin with 6.' };
    }
  }

  // Switzerland (+41)
  if (country.iso2 === 'CH' || country.dialCode === '+41') {
    if (!digitsOnly.startsWith('7')) {
      return { valid: false, reason: 'Swiss mobile numbers must begin with 75-79.' };
    }
    if (digitsOnly.length >= 2 && !/^7[5-9]/.test(digitsOnly)) {
      return { valid: false, reason: 'Swiss mobile numbers must begin with 75-79.' };
    }
  }

  // Sweden (+46)
  if (country.iso2 === 'SE' || country.dialCode === '+46') {
    if (!digitsOnly.startsWith('7')) {
      return { valid: false, reason: 'Swedish mobile numbers must begin with 7.' };
    }
  }

  // Spain (+34)
  if (country.iso2 === 'ES' || country.dialCode === '+34') {
    if (!/^[67]/.test(digitsOnly)) {
      return { valid: false, reason: 'Spanish mobile numbers must begin with 6 or 7.' };
    }
  }

  // Italy (+39)
  if (country.iso2 === 'IT' || country.dialCode === '+39') {
    if (!digitsOnly.startsWith('3')) {
      return { valid: false, reason: 'Italian mobile numbers must begin with 3.' };
    }
  }

  // New Zealand (+64)
  if (country.iso2 === 'NZ' || country.dialCode === '+64') {
    if (!digitsOnly.startsWith('2')) {
      return { valid: false, reason: 'New Zealand mobile numbers must begin with 2.' };
    }
  }

  // Malaysia (+60)
  if (country.iso2 === 'MY' || country.dialCode === '+60') {
    if (!digitsOnly.startsWith('1')) {
      return { valid: false, reason: 'Malaysian mobile numbers must begin with 1.' };
    }
  }

  // Indonesia (+62)
  if (country.iso2 === 'ID' || country.dialCode === '+62') {
    if (!digitsOnly.startsWith('8')) {
      return { valid: false, reason: 'Indonesian mobile numbers must begin with 8.' };
    }
  }

  // Ireland (+353)
  if (country.iso2 === 'IE' || country.dialCode === '+353') {
    if (!digitsOnly.startsWith('8')) {
      return { valid: false, reason: 'Irish mobile numbers must begin with 83-89.' };
    }
    if (digitsOnly.length >= 2 && !/^8[3-9]/.test(digitsOnly)) {
      return { valid: false, reason: 'Irish mobile numbers must begin with 83-89.' };
    }
  }

  // Norway (+47)
  if (country.iso2 === 'NO' || country.dialCode === '+47') {
    if (!/^[49]/.test(digitsOnly)) {
      return { valid: false, reason: 'Norwegian mobile numbers must begin with 4 or 9.' };
    }
  }

  // Denmark (+45)
  if (country.iso2 === 'DK' || country.dialCode === '+45') {
    if (!/^[2-9]/.test(digitsOnly)) {
      return { valid: false, reason: 'Danish mobile numbers must begin with 2-9.' };
    }
  }

  // Finland (+358)
  if (country.iso2 === 'FI' || country.dialCode === '+358') {
    if (!/^[45]/.test(digitsOnly)) {
      return { valid: false, reason: 'Finnish mobile numbers must begin with 4 or 5.' };
    }
  }

  // Poland (+48)
  if (country.iso2 === 'PL' || country.dialCode === '+48') {
    if (!/^[4-8]/.test(digitsOnly)) {
      return { valid: false, reason: 'Polish mobile numbers must begin with 4, 5, 6, 7, or 8.' };
    }
  }

  // Belgium (+32)
  if (country.iso2 === 'BE' || country.dialCode === '+32') {
    if (!digitsOnly.startsWith('4')) {
      return { valid: false, reason: 'Belgian mobile numbers must begin with 45-49.' };
    }
    if (digitsOnly.length >= 2 && !/^4[5-9]/.test(digitsOnly)) {
      return { valid: false, reason: 'Belgian mobile numbers must begin with 45-49.' };
    }
  }

  // Austria (+43)
  if (country.iso2 === 'AT' || country.dialCode === '+43') {
    if (!digitsOnly.startsWith('6')) {
      return { valid: false, reason: 'Austrian mobile numbers must begin with 6.' };
    }
  }

  // Portugal (+351)
  if (country.iso2 === 'PT' || country.dialCode === '+351') {
    if (!digitsOnly.startsWith('9')) {
      return { valid: false, reason: 'Portuguese mobile numbers must begin with 91, 92, 93, or 96.' };
    }
    if (digitsOnly.length >= 2 && !/^9[1236]/.test(digitsOnly)) {
      return { valid: false, reason: 'Portuguese mobile numbers must begin with 91, 92, 93, or 96.' };
    }
  }

  // Mexico (+52)
  if (country.iso2 === 'MX' || country.dialCode === '+52') {
    if (digitsOnly.startsWith('0')) {
      return { valid: false, reason: 'Mexican mobile numbers must not begin with 0.' };
    }
  }

  // Argentina (+54)
  if (country.iso2 === 'AR' || country.dialCode === '+54') {
    if (!digitsOnly.startsWith('9')) {
      return { valid: false, reason: 'Argentine mobile numbers must begin with 9.' };
    }
  }

  // Chile (+56)
  if (country.iso2 === 'CL' || country.dialCode === '+56') {
    if (!digitsOnly.startsWith('9')) {
      return { valid: false, reason: 'Chilean mobile numbers must begin with 9.' };
    }
  }

  // Colombia (+57)
  if (country.iso2 === 'CO' || country.dialCode === '+57') {
    if (!digitsOnly.startsWith('3')) {
      return { valid: false, reason: 'Colombian mobile numbers must begin with 3.' };
    }
  }

  // South Korea (+82)
  if (country.iso2 === 'KR' || country.dialCode === '+82') {
    if (!digitsOnly.startsWith('1')) {
      return { valid: false, reason: 'South Korea mobile numbers must begin with 10.' };
    }
    if (digitsOnly.length >= 2 && !digitsOnly.startsWith('10')) {
      return { valid: false, reason: 'South Korea mobile numbers must begin with 10.' };
    }
  }

  // Turkey (+90)
  if (country.iso2 === 'TR' || country.dialCode === '+90') {
    if (!digitsOnly.startsWith('5')) {
      return { valid: false, reason: 'Turkish mobile numbers must begin with 5.' };
    }
  }

  // Egypt (+20)
  if (country.iso2 === 'EG' || country.dialCode === '+20') {
    if (!digitsOnly.startsWith('1')) {
      return { valid: false, reason: 'Egyptian mobile numbers must begin with 10, 11, 12, or 15.' };
    }
    if (digitsOnly.length >= 2 && !/^1[0125]/.test(digitsOnly)) {
      return { valid: false, reason: 'Egyptian mobile numbers must begin with 10, 11, 12, or 15.' };
    }
  }

  // Nigeria (+234)
  if (country.iso2 === 'NG' || country.dialCode === '+234') {
    if (!/^[789]/.test(digitsOnly)) {
      return { valid: false, reason: 'Nigerian mobile numbers must begin with 70, 71, 80, 81, 90, or 91.' };
    }
    if (digitsOnly.length >= 2 && !/^[789][01]/.test(digitsOnly)) {
      return { valid: false, reason: 'Nigerian mobile numbers must begin with 70, 71, 80, 81, 90, or 91.' };
    }
  }

  // Kenya (+254)
  if (country.iso2 === 'KE' || country.dialCode === '+254') {
    if (!/^[17]/.test(digitsOnly)) {
      return { valid: false, reason: 'Kenyan mobile numbers must begin with 1 or 7.' };
    }
  }

  // Philippines (+63)
  if (country.iso2 === 'PH' || country.dialCode === '+63') {
    if (!digitsOnly.startsWith('9')) {
      return { valid: false, reason: 'Philippine mobile numbers must begin with 9.' };
    }
  }

  // Vietnam (+84)
  if (country.iso2 === 'VN' || country.dialCode === '+84') {
    if (!/^[35789]/.test(digitsOnly)) {
      return { valid: false, reason: 'Vietnamese mobile numbers must begin with 3, 5, 7, 8, or 9.' };
    }
  }

  // Thailand (+66)
  if (country.iso2 === 'TH' || country.dialCode === '+66') {
    if (!/^[689]/.test(digitsOnly)) {
      return { valid: false, reason: 'Thai mobile numbers must begin with 6, 8, or 9.' };
    }
  }

  // Bangladesh (+880)
  if (country.iso2 === 'BD' || country.dialCode === '+880') {
    if (!digitsOnly.startsWith('1')) {
      return { valid: false, reason: 'Bangladesh mobile numbers must begin with 13-19.' };
    }
    if (digitsOnly.length >= 2 && !/^1[3-9]/.test(digitsOnly)) {
      return { valid: false, reason: 'Bangladesh mobile numbers must begin with 13-19.' };
    }
  }

  // Pakistan (+92)
  if (country.iso2 === 'PK' || country.dialCode === '+92') {
    if (!digitsOnly.startsWith('3')) {
      return { valid: false, reason: 'Pakistan mobile numbers must begin with 3.' };
    }
  }

  // Israel (+972)
  if (country.iso2 === 'IL' || country.dialCode === '+972') {
    if (!digitsOnly.startsWith('5')) {
      return { valid: false, reason: 'Israeli mobile numbers must begin with 5.' };
    }
  }

  // Greece (+30)
  if (country.iso2 === 'GR' || country.dialCode === '+30') {
    if (!digitsOnly.startsWith('6')) {
      return { valid: false, reason: 'Greek mobile numbers must begin with 69.' };
    }
    if (digitsOnly.length >= 2 && !digitsOnly.startsWith('69')) {
      return { valid: false, reason: 'Greek mobile numbers must begin with 69.' };
    }
  }

  // Czech Republic (+420)
  if (country.iso2 === 'CZ' || country.dialCode === '+420') {
    if (!/^[67]/.test(digitsOnly)) {
      return { valid: false, reason: 'Czech mobile numbers must begin with 6 or 7.' };
    }
  }

  // Hungary (+36)
  if (country.iso2 === 'HU' || country.dialCode === '+36') {
    if (!/^[237]/.test(digitsOnly)) {
      return { valid: false, reason: 'Hungarian mobile numbers must begin with 20, 30, or 70.' };
    }
    if (digitsOnly.length >= 2 && !/^[237]0/.test(digitsOnly)) {
      return { valid: false, reason: 'Hungarian mobile numbers must begin with 20, 30, or 70.' };
    }
  }

  // Romania (+40)
  if (country.iso2 === 'RO' || country.dialCode === '+40') {
    if (!digitsOnly.startsWith('7')) {
      return { valid: false, reason: 'Romanian mobile numbers must begin with 7.' };
    }
  }

  // Qatar (+974)
  if (country.iso2 === 'QA' || country.dialCode === '+974') {
    if (!/^[3567]/.test(digitsOnly)) {
      return { valid: false, reason: 'Qatar mobile numbers must begin with 3, 5, 6, or 7.' };
    }
  }

  // Kuwait & Hong Kong
  if (country.iso2 === 'KW' || country.dialCode === '+965' || country.iso2 === 'HK' || country.dialCode === '+852') {
    if (!/^[569]/.test(digitsOnly)) {
      return { valid: false, reason: `${country.name} mobile numbers must begin with 5, 6, or 9.` };
    }
  }

  return { valid: true };
}

export interface PhoneValidationResult {
  valid: boolean;
  reason?: string;
  e164?: string;
  minDigits: number;
  maxDigits: number;
  enteredDigits: number;
  isComplete: boolean;
}

// Real-time phone validation state calculation
export function getPhoneValidationState(
  country: CountryMetadata,
  nationalNumber: string
): PhoneValidationResult {
  const digitsOnly = (nationalNumber || '').replace(/\D/g, '');
  const minDigits = Math.min(...country.digits);
  const maxDigits = Math.max(...country.digits);

  if (!digitsOnly || digitsOnly.length === 0) {
    return {
      valid: false,
      reason: 'Phone number is required.',
      minDigits,
      maxDigits,
      enteredDigits: 0,
      isComplete: false,
    };
  }

  // 1. Starting digit rules check (checked first so user immediately knows what starting mistake they made)
  const prefixCheck = checkCountryStartingDigits(country, digitsOnly);
  if (!prefixCheck.valid) {
    return {
      valid: false,
      reason: prefixCheck.reason,
      minDigits,
      maxDigits,
      enteredDigits: digitsOnly.length,
      isComplete: false,
    };
  }

  // 2. Length checks
  if (digitsOnly.length < minDigits) {
    const digitText = minDigits === maxDigits ? `Exactly ${minDigits}` : `${minDigits} to ${maxDigits}`;
    return {
      valid: false,
      reason: `Phone number is too short. ${digitText} digits required (${digitsOnly.length} of ${minDigits} entered).`,
      minDigits,
      maxDigits,
      enteredDigits: digitsOnly.length,
      isComplete: false,
    };
  }

  if (digitsOnly.length > maxDigits) {
    return {
      valid: false,
      reason: `Phone number cannot exceed ${maxDigits} digits (${digitsOnly.length} entered).`,
      minDigits,
      maxDigits,
      enteredDigits: digitsOnly.length,
      isComplete: false,
    };
  }

  // 3. Repeated identical digits (e.g. 0000000000, 1111111111, 9999999999)
  if (/^(\d)\1+$/.test(digitsOnly)) {
    return {
      valid: false,
      reason: 'Phone number cannot consist of repeated identical digits (e.g., 9999999999).',
      minDigits,
      maxDigits,
      enteredDigits: digitsOnly.length,
      isComplete: false,
    };
  }

  // 4. Sequential numbers (e.g. 1234567890, 0123456789, 9876543210)
  const isSequentialAsc = '0123456789012345'.includes(digitsOnly);
  const isSequentialDesc = '9876543210987654'.includes(digitsOnly);
  if (isSequentialAsc || isSequentialDesc) {
    return {
      valid: false,
      reason: 'Sequential or dummy numbers (e.g., 1234567890, 9876543210) are not permitted.',
      minDigits,
      maxDigits,
      enteredDigits: digitsOnly.length,
      isComplete: false,
    };
  }

  // 5. Repetitive 2-digit pairs (e.g. 9898989898, 1212121212)
  if (digitsOnly.length >= 8 && /^(\d{2})\1+$/.test(digitsOnly)) {
    return {
      valid: false,
      reason: 'Repetitive pattern phone numbers (e.g., 9898989898) are not permitted.',
      minDigits,
      maxDigits,
      enteredDigits: digitsOnly.length,
      isComplete: false,
    };
  }

  // 6. Known test dummy numbers blocklist
  if (BLOCKED_DUMMY_PHONES.has(digitsOnly)) {
    return {
      valid: false,
      reason: 'This dummy placeholder number is blocked. Please enter a valid active mobile number.',
      minDigits,
      maxDigits,
      enteredDigits: digitsOnly.length,
      isComplete: false,
    };
  }

  // 7. National pattern check
  if (!country.nationalPattern.test(digitsOnly)) {
    return {
      valid: false,
      reason: `Invalid phone format for ${country.name}. Expected format: ${country.placeholder} (${country.digits.join(' or ')} digits).`,
      minDigits,
      maxDigits,
      enteredDigits: digitsOnly.length,
      isComplete: false,
    };
  }

  const e164 = `${country.dialCode}${digitsOnly}`;
  return {
    valid: true,
    e164,
    minDigits,
    maxDigits,
    enteredDigits: digitsOnly.length,
    isComplete: true,
  };
}

// Section 6A Country phone validation
export function validatePhoneForCountry(
  countryDialCode: string,
  nationalNumber: string,
  countryIso?: string
): { valid: boolean; reason?: string; e164?: string } {
  let country = DEFAULT_COUNTRY;
  if (countryIso) {
    country = COUNTRIES.find((c) => c.iso2.toUpperCase() === countryIso.toUpperCase()) || DEFAULT_COUNTRY;
  } else {
    country = COUNTRIES.find((c) => c.dialCode === countryDialCode) || DEFAULT_COUNTRY;
  }

  const result = getPhoneValidationState(country, nationalNumber);
  return {
    valid: result.valid,
    reason: result.reason,
    e164: result.e164,
  };
}

// Registration Schema
export const RegisterSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First Name is required.' })
      .min(VALIDATION_LIMITS.FIRST_NAME_MIN, `First Name must be at least ${VALIDATION_LIMITS.FIRST_NAME_MIN} characters.`)
      .max(VALIDATION_LIMITS.FIRST_NAME_MAX, `First Name cannot exceed ${VALIDATION_LIMITS.FIRST_NAME_MAX} characters.`)
      .regex(FIRST_NAME_REGEX, 'First Name must begin with an uppercase letter and contain English letters only without spaces or numbers.'),
    lastName: z
      .string({ required_error: 'Last Name is required.' })
      .min(VALIDATION_LIMITS.LAST_NAME_MIN, `Last Name must be at least ${VALIDATION_LIMITS.LAST_NAME_MIN} characters.`)
      .max(VALIDATION_LIMITS.LAST_NAME_MAX, `Last Name cannot exceed ${VALIDATION_LIMITS.LAST_NAME_MAX} characters.`)
      .transform((val) => val.trim().replace(/\s+/g, ' '))
      .refine((val) => LAST_NAME_REGEX.test(val), {
        message: 'Last Name must contain alphabetic words only with single spaces between words.',
      }),
    email: z
      .string({ required_error: 'Email is required.' })
      .email('Please enter a valid email address.')
      .transform((val) => val.trim().toLowerCase())
      .superRefine((val, ctx) => {
        const check = validateEmailSecurity(val);
        if (!check.valid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: check.reason || 'Invalid email format.',
          });
        }
      }),
    countryCode: z.string({ required_error: 'Country code is required.' }).default('+91'),
    nationalNumber: z
      .string({ required_error: 'Mobile number is required.' })
      .transform((val) => val.replace(/\D/g, '')),
    role: z.enum([ROLES.CANDIDATE, ROLES.RECRUITER], {
      errorMap: () => ({ message: 'Please select whether you are a Candidate or Recruiter.' }),
    }),
    dateOfBirth: z
      .string({ required_error: 'Date of Birth is required.' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format.')
      .superRefine((val, ctx) => {
        const inputDate = new Date(val);
        const today = new Date();
        if (inputDate > today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Date of Birth cannot be a future date.',
          });
          return;
        }
        const age = calculateAge(val);
        if (age < VALIDATION_LIMITS.MIN_AGE_YEARS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `You must be at least ${VALIDATION_LIMITS.MIN_AGE_YEARS} years old to register.`,
          });
        } else if (age > VALIDATION_LIMITS.MAX_AGE_YEARS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Please enter a valid birth date (maximum age ${VALIDATION_LIMITS.MAX_AGE_YEARS} years).`,
          });
        }
      }),
    gender: z.enum(GENDER_OPTIONS, {
      errorMap: () => ({ message: 'Please select your gender.' }),
    }),
    highestQualification: z.enum(HIGHEST_QUALIFICATIONS, {
      errorMap: () => ({ message: 'Please select your highest qualification.' }),
    }),
    shortIntro: z.string().max(500, 'Short intro cannot exceed 500 characters.').optional(),
    skills: z.array(z.string()).optional(),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(VALIDATION_LIMITS.PASSWORD_MIN, `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters.`)
      .max(VALIDATION_LIMITS.PASSWORD_MAX, `Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX} characters.`)
      .regex(
        PASSWORD_REGEX,
        'Password must contain at least one letter, one number, and one special character (!@#$%^&*...).'
      ),
    confirmPassword: z.string({ required_error: 'Confirm Password is required.' }),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms and Conditions to register.' }),
    }),
    agreePrivacy: z.boolean().default(true).optional(),
  })
  .superRefine((data, ctx) => {
    // Confirm password match
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      });
    }

    // Phone number validation by country
    const phoneCheck = validatePhoneForCountry(data.countryCode, data.nationalNumber);
    if (!phoneCheck.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nationalNumber'],
        message: phoneCheck.reason || 'Invalid phone number for selected country.',
      });
    }
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

// Login Schema
export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.')
    .transform((val) => val.trim().toLowerCase()),
  password: z.string({ required_error: 'Password is required.' }).min(1, 'Password cannot be empty.'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// OTP Verification Schema
export const VerifyOtpSchema = z.object({
  identifier: z.string({ required_error: 'User identifier is required.' }),
  otp: z
    .string({ required_error: 'OTP is required.' })
    .length(VALIDATION_LIMITS.OTP_LENGTH, 'OTP must be exactly 6 digits.')
    .regex(OTP_REGEX, 'OTP must contain numeric digits only.'),
  purpose: z.enum(['email_verification', 'mobile_verification', 'password_reset', 'login_verification']),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

// Resend OTP Schema
export const ResendOtpSchema = z.object({
  identifier: z.string({ required_error: 'User identifier is required.' }),
  purpose: z.enum(['email_verification', 'mobile_verification', 'password_reset', 'login_verification']),
});

export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;

// Forgot Password Schema
export const ForgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.')
    .transform((val) => val.trim().toLowerCase()),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// Verify Reset OTP Schema (Step 2 of password reset)
export const VerifyResetOtpSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.')
    .transform((val) => val.trim().toLowerCase()),
  otp: z
    .string({ required_error: 'OTP is required.' })
    .length(VALIDATION_LIMITS.OTP_LENGTH, 'OTP must be exactly 6 digits.')
    .regex(OTP_REGEX, 'OTP must contain numeric digits only.'),
});

export type VerifyResetOtpInput = z.infer<typeof VerifyResetOtpSchema>;

// Reset Password Schema
export const ResetPasswordSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required.' })
      .email('Please enter a valid email address.')
      .transform((val) => val.trim().toLowerCase()),
    resetToken: z.string().optional(),
    otp: z
      .string()
      .length(VALIDATION_LIMITS.OTP_LENGTH, 'OTP must be exactly 6 digits.')
      .regex(OTP_REGEX, 'OTP must contain numeric digits only.')
      .optional(),
    password: z
      .string({ required_error: 'New password is required.' })
      .min(VALIDATION_LIMITS.PASSWORD_MIN, `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters.`)
      .max(VALIDATION_LIMITS.PASSWORD_MAX, `Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX} characters.`)
      .regex(
        PASSWORD_REGEX,
        'Password must contain at least one letter, one number, and one special character.'
      ),
    confirmPassword: z.string({ required_error: 'Confirm Password is required.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
  .refine((data) => Boolean(data.otp || data.resetToken), {
    path: ['otp'],
    message: 'Either OTP or reset token is required.',
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// Change Password Schema
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'Current password is required.' }),
    newPassword: z
      .string({ required_error: 'New password is required.' })
      .min(VALIDATION_LIMITS.PASSWORD_MIN, `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters.`)
      .max(VALIDATION_LIMITS.PASSWORD_MAX, `Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX} characters.`)
      .regex(
        PASSWORD_REGEX,
        'Password must contain at least one letter, one number, and one special character.'
      ),
    confirmPassword: z.string({ required_error: 'Confirm password is required.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from your current password.',
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
