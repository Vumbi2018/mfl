import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Network, Play, Copy, Check, Plus, RefreshCw, Sliders, ArrowUpRight, ArrowDownRight, RefreshCcw, FileText, Activity, AlertTriangle, CheckCircle2, Shield, Settings, Server } from 'lucide-react';
import Sidebar, { SidebarProvider, useSidebar } from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import LanguageSelector from '../../components/navigation/LanguageSelector';
import NotificationBell from '../../components/navigation/NotificationBell';
import TenantSwitcher from '../../components/navigation/TenantSwitcher';
import api from '../../utils/api';

const InteroperabilityHubContent = () => {
  const { t } = useTranslation();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('connections'); // 'connections', 'connectors', 'sandbox', 'guidance'
  
  // Custom HIS Connections state
  const [connections, setConnections] = useState([]);
  const [loadingConn, setLoadingConn] = useState(true);
  const [showConnModal, setShowConnModal] = useState(false);
  const [editingConn, setEditingConn] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [systemType, setSystemType] = useState('dhis2');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState('bearer');
  const [authToken, setAuthToken] = useState('');
  const [syncDirection, setSyncDirection] = useState('PUSH');
  const [entityScope, setEntityScope] = useState('facilities');
  const [fieldMappings, setFieldMappings] = useState('{\n  "code": "code",\n  "name": "name",\n  "type": "type"\n}');
  const [savingConn, setSavingConn] = useState(false);

  // Sync execution state
  const [syncingId, setSyncingId] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  // Logs state
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Sandbox state
  const [activeConnector, setActiveConnector] = useState('fhir');
  const [testResponse, setTestResponse] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoadingConn(true);
      const res = await api.get('/connections');
      if (res.data && res.data.success) {
        setConnections(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoadingConn(false);
    }
  };

  const handleSaveConnection = async (e) => {
    e.preventDefault();
    try {
      setSavingConn(true);

      let parsedMappings = {};
      try {
        parsedMappings = JSON.parse(fieldMappings);
      } catch (e) {
        alert('Invalid Field Mappings JSON format.');
        setSavingConn(false);
        return;
      }

      const payload = {
        name,
        system_type: systemType,
        base_url: baseUrl,
        auth_type: authType,
        auth_credentials: { token: authToken },
        sync_direction: syncDirection,
        entity_scope: entityScope,
        field_mappings: parsedMappings
      };

      if (editingConn) {
        await api.put(`/connections/${editingConn.id}`, payload);
      } else {
        await api.post('/connections', payload);
      }

      setShowConnModal(false);
      resetForm();
      fetchConnections();
    } catch (err) {
      console.error('Error saving connection:', err);
    } finally {
      setSavingConn(false);
    }
  };

  const handleTriggerSync = async (connId) => {
    try {
      setSyncingId(connId);
      setSyncResult(null);
      const res = await api.post(`/connections/${connId}/sync`);
      if (res.data && res.data.success) {
        setSyncResult(res.data.data);
        fetchConnections();
      }
    } catch (err) {
      console.error('Error executing sync:', err);
      setSyncResult({ error: err.message });
    } finally {
      setSyncingId(null);
    }
  };

  const handleViewLogs = async (connId) => {
    try {
      setLoadingLogs(true);
      setShowLogsModal(true);
      const res = await api.get(`/connections/${connId}/logs`);
      if (res.data && res.data.success) {
        setSyncLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSystemType('dhis2');
    setBaseUrl('');
    setAuthType('bearer');
    setAuthToken('');
    setSyncDirection('PUSH');
    setEntityScope('facilities');
    setFieldMappings('{\n  "code": "code",\n  "name": "name",\n  "type": "type"\n}');
    setEditingConn(null);
  };

  const connectors = [
    {
      id: 'fhir',
      name: 'HL7 FHIR R4 & mCSD Location API',
      standard: 'HL7 FHIR R4 / mCSD Profile',
      endpoint: '/api/interop/fhir/Location',
      format: 'application/fhir+json',
      badge: 'OpenHIE Standard',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
      description: 'Exposes health facility locations as standardized FHIR Location resources compatible with OpenHIE Mobile Care Services Discovery (mCSD).'
    },
    {
      id: 'dhis2',
      name: 'DHIS2 Organization Units Connector',
      standard: 'DHIS2 Web API v2.38+',
      endpoint: '/api/interop/dhis2/orgunits',
      format: 'application/json',
      badge: 'HMIS Interop',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
      description: 'Provides standardized DHIS2 Organization Unit payload format with district/province parent hierarchy for direct import into DHIS2 instances.'
    },
    {
      id: 'openlmis',
      name: 'OpenLMIS / mSupply Supply Chain Connector',
      standard: 'eLMIS Inventory Standard',
      endpoint: '/api/interop/openlmis/facilities',
      format: 'application/json',
      badge: 'Supply Chain',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
      description: 'Exposes facility capacity, operational status, contact details, and cold chain bed counts for logistics management.'
    },
    {
      id: 'geojson',
      name: 'GeoJSON Spatial Data Connector',
      standard: 'OGC GeoJSON Standard',
      endpoint: '/api/interop/geojson/facilities',
      format: 'application/geo+json',
      badge: 'GIS Standard',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
      description: 'Provides spatial point features in standard OGC GeoJSON FeatureCollection format for QGIS, ArcGIS, and spatial analytics.'
    }
  ];

  const currentConnector = connectors.find(c => c.id === activeConnector) || connectors[0];

  const runSandboxTest = async () => {
    try {
      setLoadingTest(true);
      const res = await api.get(currentConnector.endpoint);
      setTestResponse(res.data);
    } catch (err) {
      console.error('Error testing connector:', err);
      setTestResponse({ error: err.message, response: err.response?.data });
    } finally {
      setLoadingTest(false);
    }
  };

  const generateCurlSnippet = () => {
    return `curl -X GET "http://localhost:5002${currentConnector.endpoint}" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -H "Accept: ${currentConnector.format}"`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <MobileMenuButton />

      <div className={`flex-1 flex flex-col h-screen overflow-hidden relative z-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}>
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              Interoperability & Remote HIS Integration Hub
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
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    Remote HIS Connections & Data Synchronization (RMR NF16)
                  </h2>
                  <p className="text-blue-100 text-sm mt-1 max-w-3xl">
                    Configure connections to external applications (DHIS2, OpenLMIS, EMRs), define data direction (PUSH, PULL, Bidirectional), map custom fields, and execute syncs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setShowConnModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-xl shadow transition-all text-sm shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1.5 text-blue-700" />
                  + Create Remote Connection
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mt-6 border-t border-blue-700/50 pt-4">
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'connections'
                      ? 'bg-white text-blue-900 shadow'
                      : 'text-blue-200 hover:bg-blue-700/40'
                  }`}
                >
                  <Sliders className="w-4 h-4 inline mr-1.5" />
                  Configured Connections ({connections.length})
                </button>
                <button
                  onClick={() => setActiveTab('connectors')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'connectors'
                      ? 'bg-white text-blue-900 shadow'
                      : 'text-blue-200 hover:bg-blue-700/40'
                  }`}
                >
                  <Cpu className="w-4 h-4 inline mr-1.5" />
                  Standard API Connectors ({connectors.length})
                </button>
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'sandbox'
                      ? 'bg-white text-blue-900 shadow'
                      : 'text-blue-200 hover:bg-blue-700/40'
                  }`}
                >
                  <Play className="w-4 h-4 inline mr-1.5" />
                  Live API Testing Sandbox
                </button>
                <button
                  onClick={() => setActiveTab('guidance')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'guidance'
                      ? 'bg-white text-blue-900 shadow'
                      : 'text-blue-200 hover:bg-blue-700/40'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-1.5" />
                  Detailed Connector Guidance
                </button>
              </div>
            </div>

            {/* TAB 1: CONFIGURABLE HIS CONNECTIONS */}
            {activeTab === 'connections' && (
              <div className="space-y-6">
                {syncResult && (
                  <div className={`p-4 rounded-xl border flex items-center justify-between text-sm font-medium ${
                    syncResult.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>
                        Sync Finished ({syncResult.direction}). Pushed: <strong>{syncResult.recordsPushed}</strong>, Pulled: <strong>{syncResult.recordsPulled}</strong>.
                      </span>
                    </div>
                    <button onClick={() => setSyncResult(null)} className="text-xs font-bold underline">Dismiss</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {connections.map((conn) => (
                    <div key={conn.id} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs uppercase px-2.5 py-1 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-full border border-slate-200 dark:border-gray-700">
                          {conn.system_type}
                        </span>

                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center ${
                          conn.sync_direction === 'PUSH'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                            : conn.sync_direction === 'PULL'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        }`}>
                          {conn.sync_direction === 'PUSH' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                          {conn.sync_direction === 'PULL' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                          {conn.sync_direction === 'BIDIRECTIONAL' && <RefreshCcw className="w-3 h-3 mr-1" />}
                          {conn.sync_direction}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{conn.name}</h3>
                        <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1 truncate">{conn.base_url}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
                        <button
                          onClick={() => handleTriggerSync(conn.id)}
                          disabled={syncingId === conn.id}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow flex items-center space-x-1.5 transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                          <span>{syncingId === conn.id ? 'Syncing...' : 'Run Sync Now'}</span>
                        </button>

                        <button
                          onClick={() => handleViewLogs(conn.id)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white flex items-center space-x-1"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>View Sync Logs</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: STANDARD API CONNECTORS */}
            {activeTab === 'connectors' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {connectors.map((conn) => (
                  <div key={conn.id} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${conn.badgeColor}`}>
                        {conn.badge}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-500">{conn.format}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{conn.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{conn.description}</p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-gray-800 rounded-lg font-mono text-xs text-blue-600 dark:text-blue-400 flex items-center justify-between">
                      <span>{conn.endpoint}</span>
                      <button
                        onClick={() => {
                          setActiveConnector(conn.id);
                          setActiveTab('sandbox');
                        }}
                        className="text-xs font-sans font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Test Sandbox &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: LIVE API TESTING SANDBOX */}
            {activeTab === 'sandbox' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">API Connector Test Sandbox</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Select a connector, trigger live requests, and inspect raw API response payloads.</p>
                  </div>

                  <select
                    value={activeConnector}
                    onChange={(e) => {
                      setActiveConnector(e.target.value);
                      setTestResponse(null);
                    }}
                    className="p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-semibold"
                  >
                    {connectors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-3 font-mono text-xs relative">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                    <span>cURL Request Snippet</span>
                    <button
                      onClick={() => copyToClipboard(generateCurlSnippet())}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-emerald-400">{generateCurlSnippet()}</pre>
                </div>

                <div>
                  <button
                    onClick={runSandboxTest}
                    disabled={loadingTest}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow transition-colors flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>{loadingTest ? 'Executing Request...' : 'Execute Live Test'}</span>
                  </button>
                </div>

                {testResponse && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Response Payload Output</h4>
                    <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto max-h-96 border border-slate-800">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DETAILED CONNECTOR GUIDANCE */}
            {activeTab === 'guidance' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-6 text-slate-800 dark:text-gray-200">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise Integration & Connector Handbook</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Detailed specifications, field mappings, PUSH/PULL workflow standards, and DHIS2/OpenLMIS integration rules.</p>
                  </div>
                </div>

                <div className="space-y-6 text-sm leading-relaxed">
                  <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 space-y-2">
                    <h4 className="font-bold text-blue-600 dark:text-blue-400">1. Data Direction Protocols (PUSH vs PULL)</h4>
                    <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-gray-300 space-y-1">
                      <li><strong>PUSH Protocol</strong>: HFRS broadcasts authoritative facility changes outwards to target applications (DHIS2, OpenLMIS).</li>
                      <li><strong>PULL Protocol</strong>: HFRS safely ingests external records or administrative boundary updates using upsert logic.</li>
                      <li><strong>BIDIRECTIONAL Protocol</strong>: Synchronizes changes both ways with conflict resolution based on timestamp auditing.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 space-y-2">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400">2. Custom Field Mapping Rules</h4>
                    <p className="text-xs text-slate-600 dark:text-gray-300">
                      Field mappings use standard JSON format mapping local database keys to target JSON attributes. Example:
                    </p>
                    <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto">
{`{
  "code": "lmisFacilityCode",
  "name": "facilityName",
  "type": "facilityType",
  "operational_status": "activeStatus"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CREATE/EDIT HIS CONNECTION MODAL */}
      {showConnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingConn ? 'Edit Remote HIS Connection' : 'Create Remote HIS Connection'}
            </h3>

            <form onSubmit={handleSaveConnection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Application / Server Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National DHIS2 Production Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">System Type</label>
                  <select
                    value={systemType}
                    onChange={(e) => setSystemType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-semibold"
                  >
                    <option value="dhis2">DHIS2 (HMIS)</option>
                    <option value="openlmis">OpenLMIS / mSupply</option>
                    <option value="fhir">HL7 FHIR R4</option>
                    <option value="geojson">GeoJSON GIS</option>
                    <option value="custom_rest">Custom REST API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Sync Direction</label>
                  <select
                    value={syncDirection}
                    onChange={(e) => setSyncDirection(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-semibold"
                  >
                    <option value="PUSH">PUSH (HFRS &rarr; Target App)</option>
                    <option value="PULL">PULL (Target App &rarr; HFRS)</option>
                    <option value="BIDIRECTIONAL">BIDIRECTIONAL (Both Ways)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Target Base URL / Endpoint</label>
                <input
                  type="url"
                  required
                  placeholder="https://dhis2.health.gov/api/organisationUnits"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Authentication Method</label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">API Key (x-api-key)</option>
                    <option value="none">None (Public)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Auth Token / Secret Key</label>
                  <input
                    type="password"
                    placeholder="Token string..."
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Field Mappings (JSON)</label>
                <textarea
                  rows="4"
                  value={fieldMappings}
                  onChange={(e) => setFieldMappings(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg border border-slate-700"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConn}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  {savingConn ? 'Saving...' : 'Save Connection Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYNC EXECUTION LOGS MODAL */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sync Execution History Logs</h3>
              <button onClick={() => setShowLogsModal(false)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>

            <div className="space-y-3">
              {loadingLogs ? (
                <div className="text-center py-6 text-slate-500">Loading sync logs...</div>
              ) : syncLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-500">No sync execution logs found.</div>
              ) : (
                syncLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-gray-800/60 rounded-xl border border-slate-200 dark:border-gray-700 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 font-bold rounded ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status} ({log.sync_direction})
                      </span>
                      <span className="text-slate-400">{new Date(log.started_at).toLocaleString()}</span>
                    </div>

                    <div className="text-slate-700 dark:text-gray-300">
                      Pushed: <strong>{log.records_pushed}</strong> | Pulled: <strong>{log.records_pulled}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InteroperabilityHubPage = () => {
  return (
    <SidebarProvider>
      <InteroperabilityHubContent />
    </SidebarProvider>
  );
};

export default InteroperabilityHubPage;
