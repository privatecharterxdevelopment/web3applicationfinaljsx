export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Helper function to extract text between parentheses
export function extractTextBetweenParentheses(text: string): string | null {
  const match = text.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

// Format currency
export function formatCurrency(amount: number, currency: string = '€'): string {
  return `${currency}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

// Format date
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}