const ESCAPE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

/**
 * Escapes HTML-special characters in a string.
 *
 * @param str - The string whose HTML-special characters should be escaped
 * @returns The string with HTML-special characters replaced by their HTML entities
 */
export function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, ch => ESCAPE_MAP[ch]);
}

/**
 * Determines whether a string contains characters or a length associated with header injection.
 *
 * @param value - The string to inspect
 * @returns `true` if the string contains a carriage return, newline, or more than 254 characters, `false` otherwise.
 */
export function containsHeaderInjection(value: string): boolean {
    return /[\r\n]/.test(value) || value.length > 254;
}
