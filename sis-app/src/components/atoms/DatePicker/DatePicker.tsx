import React, { forwardRef } from 'react';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import type { DatePickerProps as MuiDatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';

export interface DatePickerProps extends Omit<MuiDatePickerProps<Dayjs>, 'renderInput'> {
  size?: 'small' | 'medium';
  error?: boolean;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  ariaLabel?: string;
  fullWidth?: boolean;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      size = 'medium',
      error,
      helperText,
      errorMessage,
      disabled,
      required,
      ariaLabel,
      fullWidth,
      format = 'MM/DD/YYYY',
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const computedHelperText = error && errorMessage ? errorMessage : helperText;

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MuiDatePicker
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          format={format}
          {...props}
          slotProps={{
            textField: {
              ref,
              size,
              error,
              helperText: computedHelperText,
              required,
              fullWidth,
              variant: 'outlined',
              inputProps: {
                'aria-label': ariaLabel || (typeof label === 'string' ? `${label} date picker` : 'date picker'),
                'aria-required': required,
                'aria-invalid': error,
                'aria-describedby': error && errorMessage ? 'date-picker-error' : undefined,
              },
              FormHelperTextProps: {
                id: error && errorMessage ? 'date-picker-error' : undefined,
                role: error ? 'alert' : undefined,
                'aria-live': error ? 'polite' : undefined,
              },
              sx: {
                '& .MuiOutlinedInput-root': {
                  '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                    },
                  },
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: theme.palette.primary.main,
                  },
                },
              },
            },
            openPickerButton: {
              'aria-label': 'Open date picker',
            },
            previousIconButton: {
              'aria-label': 'Previous month',
            },
            nextIconButton: {
              'aria-label': 'Next month',
            },
            switchViewButton: {
              'aria-label': 'Switch calendar view',
            },
            clearButton: {
              'aria-label': 'Clear date',
            },
          }}
        />
      </LocalizationProvider>
    );
  }
);

DatePicker.displayName = 'DatePicker';