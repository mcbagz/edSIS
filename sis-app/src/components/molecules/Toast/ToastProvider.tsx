import React from 'react';
import { SnackbarProvider } from 'notistack';
import type { SnackbarProviderProps } from 'notistack';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export interface ToastProviderProps extends Omit<SnackbarProviderProps, 'children'> {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children,
  maxSnack = 3,
  autoHideDuration = 3000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
  preventDuplicate = true,
  ...props 
}) => {
  const theme = useTheme();
  const notistackRef = React.useRef<any>();

  const onClickDismiss = (key: string | number) => () => {
    notistackRef.current?.closeSnackbar(key);
  };

  return (
    <SnackbarProvider
      ref={notistackRef}
      maxSnack={maxSnack}
      autoHideDuration={autoHideDuration}
      anchorOrigin={anchorOrigin}
      preventDuplicate={preventDuplicate}
      action={(key) => (
        <IconButton
          size="small"
          aria-label="Close notification"
          color="inherit"
          onClick={onClickDismiss(key)}
          sx={{
            '&:focus-visible': {
              outline: '2px solid currentColor',
              outlineOffset: 2,
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      style={{
        fontFamily: theme.typography.fontFamily,
      }}
      {...props}
    >
      {children}
    </SnackbarProvider>
  );
};