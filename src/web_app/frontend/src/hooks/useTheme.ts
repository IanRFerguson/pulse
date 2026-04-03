import { useEffect, useState } from 'react';
import { api } from '../api';
import type { ThemeConfig } from '../types';

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
            root.style.setProperty(`--color-${key.replace(/_/g, '-')}`, value);
          }
        }
      })
      .catch(() => {
        // Fall back to CSS defaults already defined in index.css
      });
  }, []);

  return config;
}
