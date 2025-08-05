import React, { forwardRef } from 'react';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';

export interface InputProps extends Omit<TextFieldProps, 'variant' | 'size'> {
  size?: 'small' | 'medium';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  ariaLabel?: string;
  errorMessage?: string;
}

export const Input = forwardRef<HTMLDivElement, InputProps>(
  (
    {
      size = 'medium',
      startIcon,
      endIcon,
      ariaLabel,
      error,
      errorMessage,
      helperText,
      label,
      required,
      disabled,
      InputProps,
      inputProps,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    const computedHelperText = error && errorMessage ? errorMessage : helperText;

    const inputAdornments = {
      ...(InputProps || {}),
      startAdornment: startIcon ? (
        <InputAdornment position="start">{startIcon}</InputAdornment>
      ) : (
        InputProps?.startAdornment
      ),
      endAdornment: endIcon ? (
        <InputAdornment position="end">{endIcon}</InputAdornment>
      ) : (
        InputProps?.endAdornment
      ),
    };

    return (
      <TextField
        ref={ref}
        variant="outlined"
        size={size}
        error={error}
        helperText={computedHelperText}
        label={label}
        required={required}
        disabled={disabled}
        InputProps={inputAdornments}
        inputProps={{
          'aria-label': ariaLabel || (typeof label === 'string' ? label : undefined),
          'aria-required': required,
          'aria-invalid': error,
          'aria-describedby': error && errorMessage ? `${props.id}-error` : undefined,
          ...inputProps,
        }}
        {...props}
        sx={{
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
          ...props.sx,
        }}
        FormHelperTextProps={{
          id: error && errorMessage ? `${props.id}-error` : undefined,
          role: error ? 'alert' : undefined,
          'aria-live': error ? 'polite' : undefined,
        }}
      />
    );
  }
);

Input.displayName = 'Input';