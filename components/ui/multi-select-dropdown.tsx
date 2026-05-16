'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  className?: string;
};

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-48 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="border border-border p-2 rounded w-full text-left"
      >
        {label}: {selected.length ? selected.join(', ') : 'All'}
      </button>

      {open && (
        <div className="absolute z-10 bg-card border border-border mt-1 w-full rounded shadow max-h-48 overflow-auto">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 p-2 cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
