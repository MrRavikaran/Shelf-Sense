/**
 * Utility functions for Indian Rupee (INR ₹) formatting
 */

export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 2,
  };

  try {
    const formatted = new Intl.NumberFormat('en-IN', options).format(absAmount);
    return isNegative ? `-${formatted}` : formatted;
  } catch {
    // Fallback if Intl fails
    const fixed = showDecimals ? absAmount.toFixed(2) : Math.round(absAmount).toString();
    return `${isNegative ? '-' : ''}₹${fixed}`;
  }
}

export function formatCompactINR(amount: number): string {
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? '-₹' : '₹';

  if (abs >= 10000000) {
    return `${prefix}${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${prefix}${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${prefix}${(abs / 1000).toFixed(1)} k`;
  }
  return formatINR(amount, false);
}
