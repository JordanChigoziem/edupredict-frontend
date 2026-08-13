export function applyTheme(theme) {
  const root = document.documentElement;
  let effective = theme;

  if (theme === 'System') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';
  }

  if (effective === 'Dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  localStorage.setItem('edupredict_theme', theme);
  return effective;
}

export function getSavedTheme() {
  return localStorage.getItem('edupredict_theme') || 'Light';
}

export function initTheme() {
  applyTheme(getSavedTheme());
}