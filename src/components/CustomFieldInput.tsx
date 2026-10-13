import { Input } from '@fluentui/react-components';
import type { FormField, FormFieldType } from '../utils/types';

const INPUT_TYPES: Record<FormFieldType, 'text' | 'email' | 'date' | 'datetime-local'> = {
  text: 'text',
  email: 'email',
  date: 'date',
  datetime: 'datetime-local',
};

interface CustomFieldInputProps {
  field: FormField;
  value: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function CustomFieldInput({ field, value, className, disabled, onChange }: CustomFieldInputProps) {
  return (
    <Input
      className={className}
      type={INPUT_TYPES[field.type]}
      value={value}
      disabled={disabled || field.disabled}
      onChange={(_, data) => onChange(data.value)}
    />
  );
}
