import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  id = 'toggle',
}) => {
  return (
    <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
      <input
        type="checkbox"
        name={id}
        id={id}
        className="sr-only"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
      />
      <div
        className={`block w-10 h-6 rounded-full ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
        onClick={() => {
          onChange(!checked);
        }}
      >
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform ${checked ? 'translate-x-4' : ''}`}
        />
      </div>
    </div>
  );
};

export default Toggle;
