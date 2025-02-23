'use client';

import { AVAILABLE_FONTS } from '@/config/fonts';

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

export const FontSelector = ({ value, onChange }: FontSelectorProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-200 p-2"
    >
      {AVAILABLE_FONTS.map((font) => (
        <option
          key={font.name}
          value={font.name}
          style={{ fontFamily: font.value }}
        >
          {font.name}
        </option>
      ))}
    </select>
  );
};
