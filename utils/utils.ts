import { redirect } from 'next/navigation';

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: 'error' | 'success',
  path: string,
  message: string
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

/**
 * Formats a file name by replacing spaces and line breaks with dashes, and removing all characters except letters, numbers, dashes, dots, and underscores.
 * @param {string} fileName - The original file name.
 * @returns {string} The formatted file name.
 */
export function formatFileName(fileName: string): string {
  return fileName
    .replace(/[\s\n\r]+/g, '-') // Replace spaces and line breaks with dashes
    .replace(/[^a-zA-Z0-9-_.]/g, '') // Remove all characters except letters, numbers, dashes, dots, and underscores
    .toLowerCase(); // Convert to lowercase for consistency
}
