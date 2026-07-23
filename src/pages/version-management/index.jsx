import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Plus, FileSpreadsheet, ArrowLeftRight, CheckCircle2, Info, BookOpen, Clock, Tag, GitCommit } from 'lucide-react';
import Sidebar, { SidebarProvider, useSidebar } from '../../components/navigation/Sidebar';

import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import LanguageSelector from '../../components/navigation/LanguageSelector';
import NotificationBell from '../../components/navigation/NotificationBell';
import TenantSwitcher from '../../components/navigation/TenantSwitcher';
import api from '../../utils/api';

const VersionManagementContent = () => {
  const { t } = useTranslation();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('releases'); // 'releases', 'compare', 'guidance'
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  // New release modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Diff state
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [diffData, setDiffData] = useState(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/versions/releases');
      if (res.data && res.data.success) {
        setReleases(res.data.data || []);
        if (res.data.data.length >= 2) {
          setV1(String(res.data.data[1].id));
          setV2(String(res.data.data[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching releases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelease = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post('/versions/releases', {
        version_tag: newVersionTag,
        title: newTitle,
        description: newDescription
      });

      if (res.data && res.data.success) {
        setShowCreateModal(false);
        setNewVersionTag('');
        setNewTitle('');
        setNewDescription('');
        fetchReleases();
      }
    } catch (err) {
      console.error('Error creating release:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCompare = async () => {
    if (!v1 || !v2) return;
    try {
      setComparing(true);
      const res = await api.get(`/versions/diff?v1=${v1}&v2=${v2}`);
      if (res.data && res.data.success) {
        setDiffData(res.data.data);
      }
    } catch (err) {
      console.error('Error comparing releases:', err);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <MobileMenuButton />

      <div className={`flex-1 flex flex-col h-screen overflow-hidden relative z-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}>
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              HFML Version Management & Governance
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSelector />
            <TenantSwitcher />
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    HFML Release Snapshots & Versioning
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1 max-w-3xl">
                    Seal authoritative Master Health Facility List releases (RMR F22), compare historical changes, and adhere to national semantic versioning guidelines.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl shadow transition-all text-sm shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1.5 text-indigo-700" />
                  Seal New Version Release
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mt-6 border-t border-indigo-700/50 pt-4">
                <button
                  onClick={() => setActiveTab('releases')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'releases'
                      ? 'bg-white text-indigo-900 shadow'
                      : 'text-indigo-200 hover:bg-indigo-700/40'
                  }`}
                >
                  <Tag className="w-4 h-4 inline mr-1.5" />
                  Published Releases ({releases.length})
                </button>
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'compare'
                      ? 'bg-white text-indigo-900 shadow'
                      : 'text-indigo-200 hover:bg-indigo-700/40'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 inline mr-1.5" />
                  Version Comparison (Diff)
                </button>
                <button
                  onClick={() => setActiveTab('guidance')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'guidance'
                      ? 'bg-white text-indigo-900 shadow'
                      : 'text-indigo-200 hover:bg-indigo-700/40'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-1.5" />
                  Versioning Guidance Standard
                </button>
              </div>
            </div>

            {/* TAB 1: RELEASES LIST */}
            {activeTab === 'releases' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {releases.map((rel) => (
                  <div key={rel.id} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-mono font-bold text-sm rounded-full border border-indigo-200/50">
                        {rel.version_tag}
                      </span>
                      {rel.is_active_release && (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold rounded-full flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active Release
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{rel.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">{rel.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(rel.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-gray-300">
                        {rel.facility_count} Facilities Sealed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: VERSION COMPARISON DIFF */}
            {activeTab === 'compare' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compare Two HFML Release Snapshots</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Baseline Version (Older)</label>
                    <select
                      value={v1}
                      onChange={(e) => setV1(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                    >
                      {releases.map(r => (
                        <option key={r.id} value={r.id}>{r.version_tag} - {r.title}</option>
                      ))}
                    </select>
                  </div>

                  <ArrowLeftRight className="w-6 h-6 text-slate-400 mt-5 hidden sm:block" />

                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Target Version (Newer)</label>
                    <select
                      value={v2}
                      onChange={(e) => setV2(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                    >
                      {releases.map(r => (
                        <option key={r.id} value={r.id}>{r.version_tag} - {r.title}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleCompare}
                    disabled={comparing}
                    className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow transition-colors shrink-0"
                  >
                    {comparing ? 'Comparing...' : 'Compare Diff'}
                  </button>
                </div>

                {diffData && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-gray-800">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 rounded-xl">
                        <span className="block text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{diffData.summary.addedCount}</span>
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Added Facilities</span>
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 rounded-xl">
                        <span className="block text-2xl font-extrabold text-amber-700 dark:text-amber-400">{diffData.summary.modifiedCount}</span>
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Modified Facilities</span>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200/50 rounded-xl">
                        <span className="block text-2xl font-extrabold text-red-700 dark:text-red-400">{diffData.summary.removedCount}</span>
                        <span className="text-xs font-semibold text-red-800 dark:text-red-300">Removed Facilities</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VERSIONING GUIDANCE */}
            {activeTab === 'guidance' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-6 text-slate-800 dark:text-gray-200">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">HFML Semantic Versioning Policy (RMR F22)</h3>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    The Health Facility Registry Service follows <strong>Semantic Versioning (`MAJOR.MINOR.PATCH`)</strong> for official health facility master list publications:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
                      <h4 className="font-bold text-indigo-600 dark:text-indigo-400">MAJOR Version (v1.0.0, v2.0.0)</h4>
                      <p className="text-xs text-slate-600 dark:text-gray-400 mt-2">
                        Triggered when national administrative boundaries change, major health system re-classifications take effect, or database schema definitions evolve.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
                      <h4 className="font-bold text-blue-600 dark:text-blue-400">MINOR Version (v1.1.0, v1.2.0)</h4>
                      <p className="text-xs text-slate-600 dark:text-gray-400 mt-2">
                        Triggered upon completion of annual or semi-annual national curation cycles, onboarding newly licensed health facilities, or adding new services.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
                      <h4 className="font-bold text-emerald-600 dark:text-emerald-400">PATCH Version (v1.1.1, v1.1.2)</h4>
                      <p className="text-xs text-slate-600 dark:text-gray-400 mt-2">
                        Triggered for routine data quality fixes, typo corrections in facility names, contact number updates, or minor coordinate refinements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CREATE RELEASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seal New HFML Version Release</h3>
            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Version Tag (e.g., v1.1.0)</label>
                <input
                  type="text"
                  required
                  placeholder="v1.1.0"
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Release Title</label>
                <input
                  type="text"
                  required
                  placeholder="2026 Q3 Annual Curation Release"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Description / Release Notes</label>
                <textarea
                  rows="3"
                  placeholder="Summary of newly verified facilities and boundary updates..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  {creating ? 'Sealing...' : 'Seal Release Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const VersionManagementPage = () => {
  return (
    <SidebarProvider>
      <VersionManagementContent />
    </SidebarProvider>
  );
};

export default VersionManagementPage;
