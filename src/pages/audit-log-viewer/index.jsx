import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import IntegrationHealthMonitor from '../../components/navigation/IntegrationHealthMonitor';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import api from '../../utils/api';
import Icon from '../../components/AppIcon';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/audit/logs');
                setLogs(res.data || []);
            } catch (err) {
                console.error("Failed to fetch logs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const formatDiff = (changes) => {
        if (!changes) return null;
        // If it's a simple key-value diff { key: { from, to } }
        if (typeof changes === 'object') {
            return (
                <div className="text-xs font-mono bg-muted/50 p-2 rounded mt-1">
                    {Object.entries(changes).map(([k, v]) => (
                        <div key={k}>
                            <span className="text-muted-foreground">{k}:</span>{' '}
                            <span className="text-red-500 line-through mr-1">{v?.from !== undefined ? String(v.from) : 'null'}</span>
                            <span className="text-green-600 font-bold">{v?.to !== undefined ? String(v.to) : 'null'}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return <pre className="text-xs">{JSON.stringify(changes, null, 2)}</pre>;
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-background">
                <MobileMenuButton />
                <Sidebar />

                <main className="main-content">
                    <div className="p-6 lg:p-8">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground mb-2">System Audit Logs</h1>
                                    <p className="text-muted-foreground">
                                        Chronological record of system activities and data modifications
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <IntegrationHealthMonitor />
                                    <WorkflowStatusIndicator isFixed={false} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-lg border border-border shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Time</th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Action</th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Entity</th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-1/3">Details/Changes</th>
                                            <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">IP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr><td colSpan="6" className="text-center py-8">Loading logs...</td></tr>
                                        ) : logs.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-8">No audit logs found.</td></tr>
                                        ) : (
                                            logs.map(log => (
                                                <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                                        {log.date}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">U</div>
                                                            {log.user_id ? `User #${log.user_id}` : log.user_name || 'System'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium 
                                                ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                                                log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                                                    log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                                        log.action === 'LOGIN' ? 'bg-purple-100 text-purple-800' :
                                                                            'bg-gray-100 text-gray-800'}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                                        {log.entity_type} #{log.entity_id}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {formatDiff(log.changes)}
                                                        {log.details && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-right text-muted-foreground font-mono">
                                                        {log.ip_address || '-'}
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
        </SidebarProvider>
    );
};

export default AuditLogViewer;
