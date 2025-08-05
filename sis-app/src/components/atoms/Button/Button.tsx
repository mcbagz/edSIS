import React, { forwardRef } from 'react';
import MuiButton from '@mui/material/Button';
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

export interface ButtonProps extends Omit<MuiButtonProps, 'size'> {
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  ariaLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      size = 'medium',
      variant = 'contained',
      color = 'primary',
      loading = false,
      disabled,
      icon,
      iconPosition = 'start',
      ariaLabel,
      onClick,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading && !disabled && onClick) {
        onClick(event);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((event.key === ' ' || event.key === 'Enter') && !loading && !disabled) {
        event.preventDefault();
        if (onClick) {
          onClick(event as any);
        }
      }
    };

    const startIcon = icon && iconPosition === 'start' && !loading ? icon : undefined;
    const endIcon = icon && iconPosition === 'end' && !loading ? icon : undefined;

    return (
      <MuiButton
        ref={ref}
        size={size}
        variant={variant}
        color={color}
        disabled={disabled || loading}
        startIcon={startIcon}
        endIcon={endIcon}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
        sx={{
          position: 'relative',
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
          '&.Mui-disabled': {
            cursor: 'not-allowed',
            pointerEvents: 'auto',
          },
          ...props.sx,
        }}
      >
        {loading && (
          <CircularProgress
            size={size === 'small' ? 16 : size === 'medium' ? 20 : 24}
            color="inherit"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-10px',
              marginLeft: '-10px',
            }}
          />
        )}
        <span style={{ visibility: loading ? 'hidden' : 'visible' }}>{children}</span>
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';