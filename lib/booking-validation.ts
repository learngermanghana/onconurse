export type BookingContactField = "name" | "phone" | "email" | "country";

export type BookingContact = Record<BookingContactField, string>;

export type BookingContactErrors = Partial<Record<BookingContactField, string>>;

const nameCharacters = /^[\p{L}\p{M}.'’ -]+$/u;
const countryCharacters = /^[\p{L}\p{M}.'’ -]+$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeEmail(value: unknown) {
  const email = cleanText(value);
  const separator = email.lastIndexOf("@");
  return separator < 0
    ? email
    : `${email.slice(0, separator)}@${email.slice(separator + 1).toLowerCase()}`;
}

function hasLongSequentialRun(digits: string) {
  let ascending = 1;
  let descending = 1;

  for (let index = 1; index < digits.length; index += 1) {
    const previous = Number(digits[index - 1]);
    const current = Number(digits[index]);
    ascending = current === previous + 1 ? ascending + 1 : 1;
    descending = current === previous - 1 ? descending + 1 : 1;

    if (ascending >= 6 || descending >= 6) return true;
  }

  return false;
}

function looksLikePlaceholderPhone(digits: string) {
  if (/(\d)\1{6,}/.test(digits) || hasLongSequentialRun(digits)) return true;

  for (let size = 1; size <= 4; size += 1) {
    if (
      digits.length >= size * 3 &&
      digits.length % size === 0 &&
      digits === digits.slice(0, size).repeat(digits.length / size)
    ) {
      return true;
    }
  }

  return false;
}

function validateName(name: string) {
  if (!name) return "Enter your full name.";
  if (name.length < 4 || name.length > 80) return "Enter a full name between 4 and 80 characters.";
  if (!nameCharacters.test(name)) return "Use letters only, with spaces, hyphens or apostrophes where needed.";

  const words = name.split(" ").filter(Boolean);
  if (words.length < 2) return "Enter your first and last name.";
  if (words.length > 6) return "Enter your name only, without an extra message.";
  if (/(.)\1{3,}/iu.test(name)) return "Check your name for repeated characters.";

  const hasUnlikelyWord = words.some(
    (word) => /^[a-z]{7,}$/i.test(word) && !/[aeiouy]/i.test(word)
  );
  if (hasUnlikelyWord) return "Check the spelling of your full name.";

  return undefined;
}

function validatePhone(phone: string) {
  if (!phone) return "Enter a phone or WhatsApp number.";
  if (!/^\+?[\d ()-]+$/.test(phone)) return "Use a valid phone number with digits only.";

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "Enter a phone number with 8 to 15 digits, including country code.";
  if (looksLikePlaceholderPhone(digits)) return "Enter a real phone number, not a sequence or repeated digits.";

  return undefined;
}

function validateEmail(email: string) {
  if (!email) return undefined;
  if (email.length > 254 || !emailPattern.test(email) || email.includes("..")) {
    return "Enter a complete email address, such as name@example.com.";
  }

  const domain = email.split("@")[1];
  if (domain.split(".").some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) {
    return "Enter a complete email address, such as name@example.com.";
  }

  return undefined;
}

function validateCountry(country: string) {
  if (!country) return "Enter your current country.";
  if (country.length < 2 || country.length > 56 || !countryCharacters.test(country)) {
    return "Enter a valid country name.";
  }
  return undefined;
}

export function validateBookingContact(input: Partial<Record<BookingContactField, unknown>>) {
  const contact: BookingContact = {
    name: cleanText(input.name),
    phone: cleanText(input.phone),
    email: normalizeEmail(input.email),
    country: cleanText(input.country),
  };

  const errors: BookingContactErrors = {
    name: validateName(contact.name),
    phone: validatePhone(contact.phone),
    email: validateEmail(contact.email),
    country: validateCountry(contact.country),
  };

  for (const key of Object.keys(errors) as BookingContactField[]) {
    if (!errors[key]) delete errors[key];
  }

  return { contact, errors, isValid: Object.keys(errors).length === 0 };
}
