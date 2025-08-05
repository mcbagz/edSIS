import { createTheme, alpha } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    layout: {
      sidebarWidth: number;
      sidebarCollapsedWidth: number;
      headerHeight: number;
    };
  }
  interface ThemeOptions {
    status?: {
      success?: string;
      warning?: string;
      error?: string;
      info?: string;
    };
    layout?: {
      sidebarWidth?: number;
      sidebarCollapsedWidth?: number;
      headerHeight?: number;
    };
  }
  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
}

// Design tokens
export const designTokens = {
  colors: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    secondary: {
      50: '#fce4ec',
      100: '#f8bbd0',
      200: '#f48fb1',
      300: '#f06292',
      400: '#ec407a',
      500: '#e91e63',
      600: '#d81b60',
      700: '#c2185b',
      800: '#ad1457',
      900: '#880e4f',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
  },
  typography: {
    fontFamily: {
      base: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      mono: [
        'Menlo',
        'Monaco',
        'Consolas',
        '"Liberation Mono"',
        '"Courier New"',
        'monospace',
      ].join(','),
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },
  elevation: {
    0: 'none',
    1: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    2: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    3: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    4: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  radius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

// Create light theme
const createLightTheme = (): ThemeOptions => ({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.colors.primary[700],
      light: designTokens.colors.primary[400],
      dark: designTokens.colors.primary[800],
      contrastText: '#fff',
    },
    secondary: {
      main: designTokens.colors.secondary[700],
      light: designTokens.colors.secondary[400],
      dark: designTokens.colors.secondary[800],
      contrastText: '#fff',
    },
    neutral: {
      main: designTokens.colors.neutral[700],
      light: designTokens.colors.neutral[400],
      dark: designTokens.colors.neutral[800],
      contrastText: '#fff',
    },
    error: {
      main: designTokens.colors.error,
    },
    warning: {
      main: designTokens.colors.warning,
    },
    info: {
      main: designTokens.colors.info,
    },
    success: {
      main: designTokens.colors.success,
    },
    grey: designTokens.colors.neutral,
    background: {
      default: designTokens.colors.neutral[50],
      paper: '#ffffff',
    },
    text: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[700],
      disabled: designTokens.colors.neutral[500],
    },
    divider: alpha(designTokens.colors.neutral[900], 0.12),
  },
  typography: {
    fontFamily: designTokens.typography.fontFamily.base,
    h1: {
      fontSize: designTokens.typography.fontSize['5xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
    },
    h2: {
      fontSize: designTokens.typography.fontSize['4xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
    },
    h3: {
      fontSize: designTokens.typography.fontSize['3xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.base,
    },
    h4: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.base,
    },
    h5: {
      fontSize: designTokens.typography.fontSize.xl,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.base,
    },
    h6: {
      fontSize: designTokens.typography.fontSize.lg,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.base,
    },
    body1: {
      fontSize: designTokens.typography.fontSize.base,
      lineHeight: designTokens.typography.lineHeight.base,
    },
    body2: {
      fontSize: designTokens.typography.fontSize.sm,
      lineHeight: designTokens.typography.lineHeight.base,
    },
    caption: {
      fontSize: designTokens.typography.fontSize.xs,
      lineHeight: designTokens.typography.lineHeight.base,
    },
    button: {
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      textTransform: 'none',
    },
  },
  spacing: designTokens.spacing[2],
  shape: {
    borderRadius: designTokens.radius.base,
  },
  breakpoints: {
    values: designTokens.breakpoints,
  },
  transitions: {
    duration: designTokens.transitions.duration,
    easing: designTokens.transitions.easing,
  },
  zIndex: designTokens.zIndex,
  status: {
    success: designTokens.colors.success,
    warning: designTokens.colors.warning,
    error: designTokens.colors.error,
    info: designTokens.colors.info,
  },
  layout: {
    sidebarWidth: 280,
    sidebarCollapsedWidth: 72,
    headerHeight: 64,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: designTokens.colors.neutral[400],
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: designTokens.colors.neutral[100],
            },
          },
          ':focus-visible': {
            outline: `2px solid ${designTokens.colors.primary[500]}`,
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: designTokens.typography.fontWeight.medium,
          borderRadius: designTokens.radius.base,
          transition: `all ${designTokens.transitions.duration.short}ms ${designTokens.transitions.easing.easeInOut}`,
          '&:focus-visible': {
            boxShadow: `0 0 0 4px ${alpha(designTokens.colors.primary[500], 0.25)}`,
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: designTokens.typography.fontSize.base,
        },
        sizeMedium: {
          padding: '8px 16px',
          fontSize: designTokens.typography.fontSize.sm,
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: designTokens.typography.fontSize.xs,
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.md,
          boxShadow: designTokens.elevation[1],
          transition: `box-shadow ${designTokens.transitions.duration.short}ms ${designTokens.transitions.easing.easeInOut}`,
          '&:hover': {
            boxShadow: designTokens.elevation[2],
          },
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: designTokens.radius.base,
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.radius.base,
            transition: `all ${designTokens.transitions.duration.short}ms ${designTokens.transitions.easing.easeInOut}`,
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: designTokens.colors.primary[500],
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.base,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.full,
          fontWeight: designTokens.typography.fontWeight.medium,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: designTokens.colors.neutral[800],
          fontSize: designTokens.typography.fontSize.xs,
          borderRadius: designTokens.radius.sm,
          padding: '6px 12px',
        },
        arrow: {
          color: designTokens.colors.neutral[800],
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.base,
        },
        standardSuccess: {
          backgroundColor: alpha(designTokens.colors.success, 0.1),
          color: designTokens.colors.success,
        },
        standardError: {
          backgroundColor: alpha(designTokens.colors.error, 0.1),
          color: designTokens.colors.error,
        },
        standardWarning: {
          backgroundColor: alpha(designTokens.colors.warning, 0.1),
          color: designTokens.colors.warning,
        },
        standardInfo: {
          backgroundColor: alpha(designTokens.colors.info, 0.1),
          color: designTokens.colors.info,
        },
      },
    },
  },
});

// Create dark theme
const createDarkTheme = (): ThemeOptions => {
  const lightTheme = createLightTheme();
  return {
    ...lightTheme,
    palette: {
      ...lightTheme.palette,
      mode: 'dark',
      primary: {
        main: designTokens.colors.primary[400],
        light: designTokens.colors.primary[300],
        dark: designTokens.colors.primary[500],
        contrastText: '#000',
      },
      secondary: {
        main: designTokens.colors.secondary[400],
        light: designTokens.colors.secondary[300],
        dark: designTokens.colors.secondary[500],
        contrastText: '#000',
      },
      background: {
        default: designTokens.colors.neutral[900],
        paper: designTokens.colors.neutral[800],
      },
      text: {
        primary: designTokens.colors.neutral[50],
        secondary: designTokens.colors.neutral[300],
        disabled: designTokens.colors.neutral[600],
      },
      divider: alpha(designTokens.colors.neutral[50], 0.12),
    },
    components: {
      ...lightTheme.components,
      MuiCssBaseline: {
        styleOverrides: {
          ...lightTheme.components?.MuiCssBaseline?.styleOverrides,
          '@global': {
            ...(lightTheme.components?.MuiCssBaseline?.styleOverrides as any)?.['@global'],
            body: {
              ...(lightTheme.components?.MuiCssBaseline?.styleOverrides as any)?.['@global']?.body,
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: designTokens.colors.neutral[600],
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: designTokens.colors.neutral[800],
              },
            },
          },
        },
      },
    },
  };
};

export const lightTheme = createTheme(createLightTheme());
export const darkTheme = createTheme(createDarkTheme());