import { getLocale } from './common';
import CurrencyMap from './CurrencyMap';

const isValidValue = value => {
  return value !== null && value !== undefined && value !== '';
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function NumberFormatter(value, { locale = 'en-US', decPlaces = 2, style = '', currency = 'USD' } = {}): string {
  const currentLocale: string | undefined = getLocale(locale);
  if (isValidValue(value)) {
    return Number(value).toLocaleString(currentLocale, { minimumFractionDigits: decPlaces, maximumFractionDigits: decPlaces });
  }
  return value;
}

function CurrencyFormatter(
  value: string,
  { symbol = true, position = 'before', locale = 'en-US', decPlaces = 2, style = 'currency', currency = 'USD' } = {}
): string {
  const currentLocale: string | undefined = getLocale(locale);
  let formattedValue: string = value;
  if (isValidValue(value)) {
    formattedValue = NumberFormatter(value, { locale: currentLocale, decPlaces, style, currency });

    // For currency other than EUR, we need to determine the country code from currency code
    // If currency is EUR, we use the locale to determine the country code
    let countryCode: string | undefined;
    if (currency !== 'EUR') {
      countryCode = currency.substring(0, 2);
    } else {
      countryCode = currentLocale?.split('-')[1].toUpperCase();
    }

    // If countryCode is still undefined, setting it as US
    if (!countryCode) {
      countryCode = 'US';
    }

    let code: string;
    if (symbol) {
      code = CurrencyMap[countryCode]?.symbolFormat;
    } else {
      code = CurrencyMap[countryCode]?.currencyCode;
    }

    // if position is provided, change placeholder accordingly.
    if (position && code) {
      if (position.toLowerCase() === 'before' && code.startsWith('{#}')) {
        code = code.slice(3) + code.slice(0, 3);
      } else if (position.toLowerCase() === 'after' && code.indexOf('{#}') === code.length - 3) {
        code = code.slice(-3) + code.slice(0, -3);
      }
    }
    return code?.replace('{#}', formattedValue) || formattedValue;
  }
  return formattedValue;
}

function SymbolFormatter(value, { symbol = '$', suffix = true, locale = 'en-US' } = {}): string {
  let formattedValue: string = value;
  if (isValidValue(value)) {
    formattedValue = NumberFormatter(value, { locale });
    return suffix ? `${formattedValue}${symbol}` : `${symbol}${formattedValue}`;
  }
  return formattedValue;
}

export default {
  Currency: (value, options) => CurrencyFormatter(value, options),
  'Currency-Code': (value, options) => CurrencyFormatter(value, { ...options, symbol: false }),
  Decimal: (value, options) => NumberFormatter(value, options),
  'Decimal-Auto': (value, options) => NumberFormatter(value, { ...options, decPlaces: Number.isInteger(value) ? 0 : 2 }),
  Integer: (value, options) => NumberFormatter(value, { ...options, decPlaces: 0 }),
  Percentage: (value, options) => SymbolFormatter(value, { ...options, symbol: '%' }),
  isValidValue
};
