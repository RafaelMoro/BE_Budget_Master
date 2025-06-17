import { CardProvider } from '../accounts.interface';

/**
 * Checks if the given string is a valid CardProvider.
 * @param provider - The string to check.
 * @returns true if valid CardProvider, false otherwise.
 */
export function isCardProvider(provider: string): provider is CardProvider {
  return ['visa', 'mastercard', 'american-express'].includes(provider);
}

// Example usage:
// isCardProvider('mastercard') // true
// isCardProvider('some-string') // false
