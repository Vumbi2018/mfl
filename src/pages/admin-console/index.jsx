import React, { useState, useEffect, useRef } from 'react';
import { SidebarProvider } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import IntegrationHealthMonitor from '../../components/navigation/IntegrationHealthMonitor';
import Icon from '../../components/AppIcon';
import api from '../../utils/api';

const AdminConsole = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [columns, setColumns] = useState([]);
    const [editRow, setEditRow] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});

    // Filtering, Sorting & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchTables();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            fetchData(selectedTable);
        }
    }, [selectedTable]);

    const fetchTables = async () => {
        try {
            const res = await api.get('/admin/tables');
            setTables(res.data || []);
            if (res.data && res.data.length > 0) {
                setSelectedTable(res.data[0]);
            }
        } catch (err) {
            console.error("Error fetching tables", err);
        }
    };

    const fetchData = async (tableName) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/tables/${tableName}`);
            const tableRows = res.data || [];
            setData(tableRows);
            if (tableRows.length > 0) {
                setColumns(Object.keys(tableRows[0]));
            } else {
                setColumns([]);
            }
        } catch (err) {
            console.error("Error fetching table data", err);
            setData([]);
            setColumns([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('csvFile', file);

        setLoading(true);
        try {
            const res = await api.post(`/admin/tables/${selectedTable}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert(`Upload successful! Inserted: ${res.data.inserted}, Updated: ${res.data.updated}`);
            fetchData(selectedTable);
        } catch (err) {
            alert("Error uploading CSV: " + (err.response?.data?.error || err.message));
            setLoading(false);
        }
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        try {
            if (editRow) {
                await api.put(`/admin/tables/${selectedTable}/${editRow.id}`, formData);
            } else {
                await api.post(`/admin/tables/${selectedTable}`, formData);
            }
            setIsModalOpen(false);
            fetchData(selectedTable);
        } catch (err) {
            alert("Error saving record: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
        try {
            await api.delete(`/admin/tables/${selectedTable}/${id}`);
            fetchData(selectedTable);
        } catch (err) {
            alert("Error deleting record: " + (err.response?.data?.error || err.message));
        }
    };

    const openModal = (row = null) => {
        setEditRow(row);
        setFormData(row || {});
        setIsModalOpen(true);
    };

    const filteredData = data.filter(row => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return Object.values(row).some(val => 
            String(val || '').toLowerCase().includes(q)
        );
    });

    const sortedData = [...filteredData].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc' 
            ? String(valA).localeCompare(String(valB)) 
            : String(valB).localeCompare(String(valA));
    });

    const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (col) => {
        if (sortField === col) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(col);
            setSortDirection('asc');
        }
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-slate-50 dark:bg-gray-950">
                <Sidebar />
                <MobileMenuButton />

                <div className="flex-1 flex flex-col ml-0 lg:ml-[280px]">
                    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">System Administration</h1>
                            <p className="text-sm text-slate-500 dark:text-gray-400">Manage reference data, system taxonomies, and governance tables</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <IntegrationHealthMonitor />
                            <WorkflowStatusIndicator isFixed={false} />
                        </div>
                    </header>

                    <main className="p-6 flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                        {/* Table List Sidebar */}
                        <div className="w-full lg:w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 p-4 shrink-0 flex flex-col">
                            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-3 px-2">Data Tables</h2>
                            <div className="space-y-1.5 flex-1 overflow-y-auto">
                                {tables.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => {
                                            setSelectedTable(t);
                                            setPage(1);
                                            setSearchQuery('');
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${selectedTable === t ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
                                    >
                                        <span>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                                        {selectedTable === t && <span className="w-2 h-2 bg-white rounded-full"></span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Data Grid */}
                        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 flex flex-col overflow-hidden">
                            {/* Table Action Bar */}
                            <div className="p-4 border-b border-slate-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white capitalize">
                                        {selectedTable?.replace(/_/g, ' ')} ({filteredData.length} records)
                                    </h3>
                                    <p className="text-xs text-slate-500">Live reference dataset view and management.</p>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <input 
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchQuery}
                                        onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                                        className="px-3 py-1.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-48"
                                    />
                                    <input 
                                        type="file" 
                                        accept=".csv" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-xs shadow-md shadow-indigo-600/20 shrink-0"
                                    >
                                        <Icon name="Upload" size={14} />
                                        <span>Upload CSV</span>
                                    </button>
                                    <button
                                        onClick={() => openModal()}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-xs shadow-md shadow-emerald-600/20 shrink-0"
                                    >
                                        <Icon name="Plus" size={14} />
                                        <span>Add Record</span>
                                    </button>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="flex-1 overflow-auto p-4">
                                {loading ? (
                                    <div className="flex flex-col justify-center items-center h-48 text-slate-400 space-y-2">
                                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-semibold">Loading table data...</span>
                                    </div>
                                ) : paginatedData.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 space-y-2">
                                        <p className="text-sm font-semibold">No records found for '{selectedTable}'</p>
                                        <p className="text-xs">Click 'Add Record' to add a new reference entry.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/60 text-slate-600 dark:text-gray-300 font-bold uppercase tracking-wider">
                                                {columns.map(col => (
                                                    <th 
                                                        key={col} 
                                                        onClick={() => handleSort(col)}
                                                        className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <div className="flex items-center space-x-1">
                                                            <span>{col.replace(/_/g, ' ')}</span>
                                                            {sortField === col && (
                                                                <span className="text-emerald-600 font-extrabold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-gray-800 text-slate-700 dark:text-gray-300">
                                            {paginatedData.map((row, i) => (
                                                <tr key={row.id || i} className="hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors">
                                                    {columns.map(col => (
                                                        <td key={col} className="px-4 py-3 font-medium truncate max-w-[200px]">
                                                            {col === 'code' ? (
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-200 rounded font-mono text-[11px] font-bold">
                                                                    {row[col]}
                                                                </span>
                                                            ) : typeof row[col] === 'boolean' ? (
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row[col] ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'}`}>
                                                                    {row[col] ? 'YES' : 'NO'}
                                                                </span>
                                                            ) : typeof row[col] === 'object' ? (
                                                                JSON.stringify(row[col])
                                                            ) : (
                                                                row[col] ?? <span className="text-slate-400 italic">null</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                onClick={() => openModal(row)}
                                                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                                                title="Edit Record"
                                                            >
                                                                <Icon name="Edit" size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row.id)}
                                                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                                                title="Delete Record"
                                                            >
                                                                <Icon name="Trash" size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            <div className="p-4 border-t border-slate-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                                <div className="flex items-center space-x-2">
                                    <span>Rows per page:</span>
                                    <select
                                        value={pageSize}
                                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                        className="px-2 py-1 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-semibold"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                    <span>
                                        Showing {sortedData.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, sortedData.length)} of {sortedData.length} entries
                                    </span>
                                </div>

                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 bg-slate-100 dark:bg-gray-800 disabled:opacity-40 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 font-bold text-slate-700 dark:text-gray-300">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="px-3 py-1 bg-slate-100 dark:bg-gray-800 disabled:opacity-40 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                {/* Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-gray-800 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editRow ? `Edit ${selectedTable} Record` : `New ${selectedTable} Record`}
                            </h2>
                            <div className="space-y-3">
                                {columns.filter(c => c !== 'id' && c !== 'created_at').map(col => (
                                    <div key={col}>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1 capitalize">
                                            {col.replace(/_/g, ' ')}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={formData[col] ?? ''}
                                            onChange={e => setFormData(prev => ({ ...prev, [col]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-gray-800">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs font-semibold shadow-md shadow-emerald-600/20"
                                >
                                    Save Record
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SidebarProvider>
    );
};

export default AdminConsole;
