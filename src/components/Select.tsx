import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  wrapperClassName?: string;
}

export default function Select({ className = '', wrapperClassName = '', children, ...props }: SelectProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        {...props}
        className={`appearance-none pr-10 ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        strokeWidth={2}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}
