import React, { forwardRef } from 'react';
import MuiSelect from '@mui/material/Select';
import type { SelectProps as MuiSelectProps } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<MuiSelectProps, 'variant' | 'size'> {
  options: SelectOption[];
  size?: 'small' | 'medium';
  label?: string;
  helperText?: string;
  errorMessage?: string;
  placeholder?: string;
  ariaLabel?: string;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      size = 'medium',
      label,
      helperText,
      error,
      errorMessage,
      required,
      disabled,
      placeholder,
      ariaLabel,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const labelId = `${id}-label`;
    const computedHelperText = error && errorMessage ? errorMessage : helperText;

    return (
      <FormControl
        ref={ref}
        variant="outlined"
        size={size}
        fullWidth={props.fullWidth}
        error={error}
        disabled={disabled}
        required={required}
      >
        {label && (
          <InputLabel id={labelId} shrink={!!value || !!placeholder}>
            {label}
          </InputLabel>
        )}
        <MuiSelect
          labelId={labelId}
          label={label}
          value={value || ''}
          displayEmpty={!!placeholder}
          renderValue={(selected) => {
            if (!selected || selected === '') {
              return <span style={{ color: theme.palette.text.secondary }}>{placeholder}</span>;
            }
            const selectedOption = options.find((opt) => opt.value === selected);
            return selectedOption?.label || selected;
          }}
          inputProps={{
            'aria-label': ariaLabel || label,
            'aria-required': required,
            'aria-invalid': error,
            'aria-describedby': error && errorMessage ? `${id}-error` : undefined,
          }}
          {...props}
          sx={{
            '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
            ...props.sx,
          }}
        >
          {placeholder && (
            <MenuItem value="" disabled>
              <span style={{ color: theme.palette.text.secondary }}>{placeholder}</span>
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              aria-label={option.label}
            >
              {option.label}
            </MenuItem>
          ))}
        </MuiSelect>
        {computedHelperText && (
          <FormHelperText
            id={error && errorMessage ? `${id}-error` : undefined}
            role={error ? 'alert' : undefined}
            aria-live={error ? 'polite' : undefined}
          >
            {computedHelperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }
);

Select.displayName = 'Select';