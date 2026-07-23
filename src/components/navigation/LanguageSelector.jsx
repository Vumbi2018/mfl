import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
      <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      <select
        aria-label={t('common.language')}
        value={i18n.language && i18n.language.startsWith('fr') ? 'fr' : 'en'}
        onChange={handleLanguageChange}
        className="bg-transparent border-none focus:outline-none text-xs font-semibold cursor-pointer"
      >
        <option value="en" className="dark:bg-gray-800">English (EN)</option>
        <option value="fr" className="dark:bg-gray-800">Français (FR)</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
