import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, FileSpreadsheet, Shield, AlertCircle } from 'lucide-react';
import Sidebar, { SidebarProvider, useSidebar } from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import LanguageSelector from '../../components/navigation/LanguageSelector';
import NotificationBell from '../../components/navigation/NotificationBell';
import TenantSwitcher from '../../components/navigation/TenantSwitcher';
import api from '../../utils/api';
import * as XLSX from 'xlsx';

const DataDictionaryContent = () => {
  const { t } = useTranslation();
  const { isCollapsed } = useSidebar();
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCriticality, setSelectedCriticality] = useState('All');

  useEffect(() => {
    fetchDictionary();
  }, []);

  const fetchDictionary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reference/data-dictionary');
      if (res.data && res.data.success) {
        setElements(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching data dictionary:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(elements.map(e => e.category))];
  const criticalities = ['All', 'Required', 'Recommended', 'Optional'];

  const filteredElements = elements.filter(e => {
    const matchesSearch = (e.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (e.code || '').toLowerCase().includes(search.toLowerCase()) ||
                          (e.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesCriticality = selectedCriticality === 'All' || e.criticality_level === selectedCriticality;

    return matchesSearch && matchesCategory && matchesCriticality;
  });

  const exportToExcel = () => {
    const exportData = filteredElements.map(e => ({
      'Element Code': e.code,
      'Element Name': e.name,
      'Domain Category': e.category,
      'Data Type': e.data_type,
      'RMR Criticality': e.criticality_level,
      'Requirement Code': e.requirement_code,
      'Required': e.is_required ? 'Yes' : 'No',
      'Unique': e.is_unique ? 'Yes' : 'No',
      'Sensitive': e.is_sensitive ? 'Yes' : 'No',
      'Description': e.description
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Dictionary');
    XLSX.writeFile(workbook, `HFRS_Data_Dictionary_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <MobileMenuButton />

      <div className={`flex-1 flex flex-col h-screen overflow-hidden relative z-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}>
        {/* Top Navigation */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              {t('dictionary.title')}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSelector />
            <TenantSwitcher />
            <NotificationBell />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    {t('dictionary.title')}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1 max-w-3xl">
                    {t('dictionary.subtitle')}
                  </p>
                </div>
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-xl shadow transition-all text-sm shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                  {t('dictionary.exportExcel')}
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-700 dark:text-gray-200"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={selectedCriticality}
                  onChange={(e) => setSelectedCriticality(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-700 dark:text-gray-200"
                >
                  {criticalities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Elements Data Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-gray-800/60 text-slate-600 dark:text-gray-400 font-semibold border-b border-slate-200 dark:border-gray-800">
                    <tr>
                      <th className="px-5 py-3.5">{t('dictionary.code')}</th>
                      <th className="px-5 py-3.5">{t('dictionary.name')}</th>
                      <th className="px-5 py-3.5">{t('dictionary.category')}</th>
                      <th className="px-5 py-3.5">{t('dictionary.dataType')}</th>
                      <th className="px-5 py-3.5">{t('dictionary.criticality')}</th>
                      <th className="px-5 py-3.5">{t('dictionary.requirement')}</th>
                      <th className="px-5 py-3.5">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-slate-500">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : filteredElements.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-slate-500">
                          {t('common.noData')}
                        </td>
                      </tr>
                    ) : (
                      filteredElements.map((el) => (
                        <tr key={el.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {el.code}
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                            <div>{el.name}</div>
                            <div className="text-xs text-slate-500 font-normal mt-0.5 max-w-md">{el.description}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              {el.category}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-gray-400">
                            {el.data_type}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              el.criticality_level === 'Required'
                                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                : el.criticality_level === 'Recommended'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                              {el.criticality_level}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-xs text-slate-700 dark:text-gray-300">
                            {el.requirement_code || 'RMR F4'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center space-x-1.5">
                              {el.is_required && (
                                <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">REQ</span>
                              )}
                              {el.is_unique && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">UNIQ</span>
                              )}
                              {el.is_sensitive && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">SENS</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const DataDictionaryPage = () => {
  return (
    <SidebarProvider>
      <DataDictionaryContent />
    </SidebarProvider>
  );
};

export default DataDictionaryPage;
