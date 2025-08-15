const toggleTheme = () => {
  const newTheme = !isDark;
  setIsDark(newTheme);
  
  // 🚀 SIMPLE FIX:
  if (newTheme) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  console.log('Theme switched to:', newTheme ? 'dark' : 'light');
};