import { useEffect, useState } from 'react';
import { api } from '../api';
import type { ThemeConfig } from '../types';

// Maps theme.yaml color keys to the CSS custom properties used in index.css.
// background/text are intentionally excluded — those are controlled by dark/light mode.
const THEME_TO_CSS: Record<string, string[]> = {
  primary: ['--accent'],
  border: ['--border'],
};

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useTheme(): ThemeConfig | null {
  const [config, setConfig] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    api
      .getConfig()
      .then((data) => {
        setConfig(data);
        const root = document.documentElement;
        if (data.colors) {
          for (const [key, value] of Object.entries(data.colors)) {
            const cssVars = THEME_TO_CSS[key];
            if (cssVars) {
              for (const cssVar of cssVars) {
                root.style.setProperty(cssVar, value);
              }
              // Derive alpha variants for the primary/accent color
              if (key === 'primary') {
                root.style.setProperty('--accent-bg', hexToRgba(value, 0.1));
                root.style.setProperty(
                  '--accent-border',
                  hexToRgba(value, 0.5),
                );
              }
            }
          }
        }
      })
      .catch(() => {
        // Fall back to CSS defaults already defined in index.css
      });
  }, []);

  return config;
}
