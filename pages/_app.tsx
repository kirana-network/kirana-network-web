import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { loadMessages } from '../core/i18n/utils';
import { I18n } from 'react-polyglot';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect, useState } from 'react';
import getTheme from '../core/theme';
import { SnackbarProvider } from 'notistack';

function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}


function MyApp({ Component, pageProps }: AppProps) {
  const [locale, setLocale] = useState("en");
  const [messages, setMessages] = useState<any>({});
  const [theme, setTheme] = useState(getTheme("light"));

  useEffect(() => {
    setLocale(navigator.language.split("-")[0] || "en")
  }, []);

  useEffect(() => {
    setMessages(loadMessages(locale));
  }, [locale])

  return (
    <SafeHydrate>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={5}>
          <I18n locale={locale} messages={messages}>
            <Component {...pageProps} />
          </I18n>
        </SnackbarProvider>
      </ThemeProvider>
    </SafeHydrate>
  );
}

export default MyApp
