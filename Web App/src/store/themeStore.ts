import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('vvit_csp_theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // ignore
  }
  // Light theme is the default per design guidelines
  return 'light';
};

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
};

// Initial run
const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('vvit_csp_theme', nextTheme);
      } catch {
        // ignore
      }
      applyThemeToDocument(nextTheme);
      return { theme: nextTheme };
    });
  },

  setTheme: (theme: Theme) => {
    try {
      localStorage.setItem('vvit_csp_theme', theme);
    } catch {
      // ignore
    }
    applyThemeToDocument(theme);
    set({ theme });
  },
}));
