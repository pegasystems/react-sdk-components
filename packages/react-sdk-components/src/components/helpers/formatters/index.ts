import Boolean from './Boolean';
import Currency from './Currency';
import DateFormatter from './Date';
import { getCurrentTimezone, getLocale } from './common';

export default {
  ...Boolean,
  ...Currency,
  ...DateFormatter
};

function getDateObject(text: string): Date {
  // TODO - cleanup formatters util functions as DX APIs are returning values per ISO std now.
  const timeStamp = text.replace(/-/g, '');
  const year = timeStamp.substr(0, 4);
  const month = timeStamp.substr(4, 2);
  const day = timeStamp.substr(6, 2);

  if (timeStamp.includes('GMT')) {
    const hours = timeStamp.substr(9, 2);
    const minutes = timeStamp.substr(11, 2);
    const seconds = timeStamp.substr(13, 2);
    const ms = timeStamp.substr(16, 3);

    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`);
  }

  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
  );
}

function isIsoDate(str) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str);
  return d.toISOString() === str;
}

function parseDateInISO(value) {
  const isMilliSeconds = /^[0-9]+$/.exec(value);
  if (isMilliSeconds) {
    const date = new Date(parseInt(value, 10));
    return date.toISOString();
  }

  if (isIsoDate(value)) {
    const date = new Date(value);
    return date.toISOString();
  }

  return value ? getDateObject(value).toISOString() : value;
}

export function format(value, type, options = {}): string {
  let formattedValue: string;

  switch (type?.toLowerCase()) {
    case 'currency': {
      const defaultOptions = {
        locale: getLocale(),
        position: 'before',
        decPlaces: 2
      };
      const params = { ...defaultOptions, ...options };
      formattedValue = Currency.Currency(value, params);
      break;
    }

    case 'decimal': {
      const defaultOptions = { locale: getLocale(), decPlaces: 2 };
      const params = { ...defaultOptions, ...options };
      formattedValue = Currency.Decimal(value, params);
      break;
    }

    case 'percentage': {
      const defaultOptions = { locale: getLocale(), decPlaces: 2 };
      const params = { ...defaultOptions, ...options };
      formattedValue = Currency.Percentage(value, params);
      break;
    }

    case 'integer': {
      const defaultOptions = { locale: getLocale() };
      const params = { ...defaultOptions, ...options };
      formattedValue = Currency.Integer(value, params);
      break;
    }

    case 'date': {
      const defaultOptions = {
        format: 'MMM DD, YYYY',
        timezone: getCurrentTimezone()
      };
      const params = { ...defaultOptions, ...options };
      formattedValue = DateFormatter.Date(parseDateInISO(value), params);
      break;
    }

    case 'datetime': {
      const defaultOptions = {
        format: 'MMM DD, YYYY h:mm A',
        timezone: getCurrentTimezone()
      };
      const params = { ...defaultOptions, ...options };
      formattedValue = DateFormatter.Date(parseDateInISO(value), params);
      break;
    }

    case 'boolean':
    case 'checkbox': {
      formattedValue = Boolean.TrueFalse(value, { allowEmpty: false, ...options });
      break;
    }

    case 'userreference': {
      formattedValue = value.userName;
      break;
    }

    default:
      formattedValue = value;
  }
  return formattedValue;
}
