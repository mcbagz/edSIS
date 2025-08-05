import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { lightTheme, darkTheme } from './theme';

interface ColorModeContextType {
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  colorMode: 'light',
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

interface DesignSystemProviderProps {
  children: React.ReactNode;
  defaultMode?: 'light' | 'dark';
}

export const DesignSystemProvider: React.FC<DesignSystemProviderProps> = ({ 
  children,
  defaultMode = 'light' 
}) => {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(defaultMode);

  useEffect(() => {
    const savedMode = localStorage.getItem('colorMode') as 'light' | 'dark' | null;
    if (savedMode) {
      setColorMode(savedMode);
    }
  }, []);

  const toggleColorMode = () => {
    const newMode = colorMode === 'light' ? 'dark' : 'light';
    setColorMode(newMode);
    localStorage.setItem('colorMode', newMode);
  };

  const theme = colorMode === 'light' ? lightTheme : darkTheme;

  return (
    <ColorModeContext.Provider value={{ colorMode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            '*': {
              margin: 0,
              padding: 0,
            },
            'html, body, #root': {
              height: '100%',
              width: '100%',
            },
            '#root': {
              display: 'flex',
              flexDirection: 'column',
            },
            '.sr-only': {
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              borderWidth: 0,
            },
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.5,
              },
            },
            '@keyframes spin': {
              from: {
                transform: 'rotate(0deg)',
              },
              to: {
                transform: 'rotate(360deg)',
              },
            },
            '@keyframes slideIn': {
              from: {
                transform: 'translateX(-100%)',
              },
              to: {
                transform: 'translateX(0)',
              },
            },
            '@keyframes fadeIn': {
              from: {
                opacity: 0,
              },
              to: {
                opacity: 1,
              },
            },
          }}
        />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};