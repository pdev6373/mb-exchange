import parsePhoneNumberFromString, {
  CountryCode,
  getCountries,
} from 'libphonenumber-js';
import i18nCountries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { GenerateTokens, Token } from '../types';
import jwt from 'jsonwebtoken';

i18nCountries.registerLocale(enLocale);

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
export const SALT_ROUNDS = 10;

export const isAdult = (dob: string) => {
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  return (
    age > 18 ||
    (age === 18 &&
      today >= new Date(birthDate.setFullYear(today.getFullYear())))
  );
};

export const isValidCountryCode = (countryCode: string) =>
  new Set(getCountries()).has(countryCode as CountryCode);

export const isValidPhoneNumber = (phoneNumber: string, countryCode: string) =>
  parsePhoneNumberFromString(
    phoneNumber,
    countryCode as CountryCode,
  )?.isValid() ?? false;

export const getFlagEmojiFromCode = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');

export const generateTokens = ({
  email,
  accessExpiry = '7d',
  refreshExpiry = '30d',
  role,
  type = 'both',
  id,
}: GenerateTokens) => {
  const tokens: Partial<Token> = {};

  if (type === 'access' || type === 'both')
    tokens.accessToken = jwt.sign(
      { _id: id, email, role },
      ACCESS_TOKEN_SECRET,
      {
        expiresIn: accessExpiry,
      },
    );

  if (type === 'refresh' || type === 'both')
    tokens.refreshToken = jwt.sign(
      { _id: id, email, role },
      REFRESH_TOKEN_SECRET,
      {
        expiresIn: refreshExpiry,
      },
    );

  return tokens;
};

export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const getCurrentMonth = (date?: Date) =>
  date ? new Date(date).getMonth() : new Date().getMonth();
export const getCurrentYear = (date?: Date) =>
  date ? new Date(date).getFullYear() : new Date().getFullYear();
