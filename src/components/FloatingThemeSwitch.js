'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const FloatingThemeSwitch = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check current system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    
    // Apply initial theme
    document.documentElement.classList.toggle('dark', mediaQuery.matches);
  }, []);

  const toggleTheme = () => {
  const newTheme = !isDark;
  setIsDark(newTheme);
  
  // Turbopack CSS-Cache umgehen
  const html = document.documentElement;
  
  // 1. Alle theme-related classes entfernen
  html.classList.remove('dark', 'light');
  
  // 2. Force reflow
  html.offsetHeight;
  
  // 3. Neue class hinzufügen
  if (newTheme) {
    html.classList.add('dark');
  }
  
  // 4. CSS-Cache mit neuer Stylesheet-Injection umgehen
  const cacheKey = `theme-${Date.now()}`;
  const style = document.createElement('style');
  style.id = cacheKey;
  style.innerHTML = newTheme ? 
    `html.dark { color-scheme: dark !important; }` :
    `html:not(.dark) { color-scheme: light !important; }`;
  
  document.head.appendChild(style);
  
  // 5. Alte styles entfernen
  setTimeout(() => {
    const oldStyles = document.querySelectorAll('style[id^="theme-"]');
    oldStyles.forEach(s => {
      if (s.id !== cacheKey) s.remove();
    });
  }, 100);
  
  console.log('Theme switched to:', newTheme ? 'dark' : 'light');
};

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
    >
      {isDark ? (
        <Sun className="w-6 h-6 text-yellow-500" />
      ) : (
        <Moon className="w-6 h-6 text-gray-700" />
      )}
    </button>
  );
};

export default FloatingThemeSwitch;