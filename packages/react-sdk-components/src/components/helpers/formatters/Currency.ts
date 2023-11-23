import { getLocale } from "./common";
import CurrencyMap from "./CurrencyMap";

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
function NumberFormatter(value, { locale = "en-US", decPlaces = 2, style="", currency="USD" } = {}): string {
  const currentLocale: string | undefined = getLocale(locale);
  if (value !== null && value !== undefined) {
    return Number(value).toLocaleString(currentLocale, {
      minimumFractionDigits: decPlaces,
      maximumFractionDigits: decPlaces
    });
  }
  return value;
}

function CurrencyFormatter(
  value: string,
  { symbol = true, position="before", locale="en-US", decPlaces = 2, style = "currency", currency = "USD" } = {}
): string {
  const currentLocale: string | undefined = getLocale(locale);
  let formattedValue: string = value;
  if (value !== null && value !== undefined && value !== '') {
    formattedValue = NumberFormatter(value, {
      locale: currentLocale,
      decPlaces,
      style,
      currency
    });

    let countryCode: string | undefined =  currentLocale?.split("-")[1].toUpperCase();

    // If countryCode is still undefined, setting it as US
    if( !countryCode ){
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
      if (position.toLowerCase() === "before" && code.startsWith("{#}")) {
        code = code.slice(3) + code.slice(0, 3);
      } else if (
        position.toLowerCase() === "after" &&
        code.indexOf("{#}") === code.length - 3
      ) {
        code = code.slice(-3) + code.slice(0, -3);
      }
    }
    return code?.replace("{#}", formattedValue) || formattedValue;
  }
  return formattedValue;
}

function SymbolFormatter(value, { symbol="$", suffix = true, locale="en-US" } = {}): string {
  let formattedValue: string = value;
  if (value !== null && value !== undefined) {
    formattedValue = NumberFormatter(value, { locale });
    return suffix ? `${formattedValue}${symbol}` : `${symbol}${formattedValue}`;
  }
  return formattedValue;
}

export default {
  Currency: (value, options) => CurrencyFormatter(value, options),
  "Currency-Code": (value, options) =>
    CurrencyFormatter(value, { ...options, symbol: false }),
  Decimal: (value, options) => NumberFormatter(value, options),
  "Decimal-Auto": (value, options) =>
    NumberFormatter(value, {
      ...options,
      decPlaces: Number.isInteger(value) ? 0 : 2
    }),
  Integer: (value, options) =>
    NumberFormatter(value, { ...options, decPlaces: 0 }),
  Percentage: (value, options) =>
    SymbolFormatter(value, { ...options, symbol: "%" })
};
