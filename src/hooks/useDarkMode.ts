import { useEffect, useState } from "react";

export function useDarkMode() {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const [darkTheme, setDarkTheme] = useState(prefersDarkScheme.matches);

  useEffect(() => {
    const onDarkThemeChange = () => {
      setDarkTheme(prefersDarkScheme.matches);
    };
    prefersDarkScheme.addEventListener('change', onDarkThemeChange);
    return () => {
      prefersDarkScheme.removeEventListener('change', onDarkThemeChange);
    };
  }, []);

  return darkTheme;
}