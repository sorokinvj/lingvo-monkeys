export const AVAILABLE_FONTS = [
  {
    name: 'System Native',
    value:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    name: 'Helvetica',
    value: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    name: 'Times New Roman',
    value: '"Times New Roman", Times, serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    name: 'Georgia',
    value: 'Georgia, Cambria, "Times New Roman", Times, serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    name: 'Verdana',
    value: 'Verdana, Geneva, sans-serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    name: 'Courier',
    value: '"Courier New", Courier, monospace',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    name: 'Console',
    value: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    name: 'Trebuchet',
    value:
      '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", sans-serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    name: 'Palatino',
    value: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
] as const;

export type FontOption = (typeof AVAILABLE_FONTS)[number]['name'];
