// src/currency.js

export const formatCurrency = (value, currencyCode) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  }).format(value);
};