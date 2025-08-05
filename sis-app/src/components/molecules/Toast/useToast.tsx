import { useSnackbar } from 'notistack';
import type { VariantType, OptionsObject } from 'notistack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { useTheme } from '@mui/material/styles';

export interface ToastOptions extends Omit<OptionsObject, 'variant'> {
  severity?: 'success' | 'error' | 'warning' | 'info';
}

export const useToast = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const theme = useTheme();

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircleIcon sx={{ mr: 1 }} />;
      case 'error':
        return <ErrorIcon sx={{ mr: 1 }} />;
      case 'warning':
        return <WarningIcon sx={{ mr: 1 }} />;
      case 'info':
        return <InfoIcon sx={{ mr: 1 }} />;
      default:
        return null;
    }
  };

  const getStyles = (severity: string) => {
    const baseStyles = {
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[3],
      display: 'flex',
      alignItems: 'center',
      fontWeight: theme.typography.fontWeightMedium,
    };

    switch (severity) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.success.main,
          color: theme.palette.success.contrastText,
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.error.main,
          color: theme.palette.error.contrastText,
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.warning.main,
          color: theme.palette.warning.contrastText,
        };
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.info.main,
          color: theme.palette.info.contrastText,
        };
      default:
        return baseStyles;
    }
  };

  const showToast = (message: string, options?: ToastOptions) => {
    const { severity = 'info', ...restOptions } = options || {};
    
    return enqueueSnackbar(message, {
      variant: severity as VariantType,
      style: getStyles(severity),
      iconVariant: {
        success: getIcon('success'),
        error: getIcon('error'),
        warning: getIcon('warning'),
        info: getIcon('info'),
      },
      ...restOptions,
    });
  };

  const toast = {
    success: (message: string, options?: Omit<ToastOptions, 'severity'>) =>
      showToast(message, { ...options, severity: 'success' }),
    error: (message: string, options?: Omit<ToastOptions, 'severity'>) =>
      showToast(message, { ...options, severity: 'error' }),
    warning: (message: string, options?: Omit<ToastOptions, 'severity'>) =>
      showToast(message, { ...options, severity: 'warning' }),
    info: (message: string, options?: Omit<ToastOptions, 'severity'>) =>
      showToast(message, { ...options, severity: 'info' }),
    close: closeSnackbar,
  };

  return toast;
};