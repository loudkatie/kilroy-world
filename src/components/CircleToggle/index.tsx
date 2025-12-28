'use client';

import { Circle } from '@/lib/types';
import clsx from 'clsx';

interface CircleToggleProps {
  value: Circle;
  onChange: (value: Circle) => void;
  disabled?: boolean;
}

export function CircleToggle({ value, onChange, disabled }: CircleToggleProps) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1">
      <button
        type="button"
        onClick={() => onChange('world')}
        disabled={disabled}
        className={clsx(
          'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors',
          value === 'world'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        World
      </button>
      <button
        type="button"
        onClick={() => onChange('verified')}
        disabled={disabled}
        className={clsx(
          'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors',
          value === 'verified'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        Verified
      </button>
    </div>
  );
}
