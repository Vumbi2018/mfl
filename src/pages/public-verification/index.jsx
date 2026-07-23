import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import Icon from '../../components/AppIcon';

const PublicVerification = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFacility = async () => {
            try {
                // Dynamic determination of backend URL to ensure mobile devices hit the correct Network IP
                // instead of 'localhost' which is baked into VITE_API_URL default.
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                const port = '5001'; // Backend port

                const backendUrl = `${protocol}//${hostname}:${port}/api/fhir/Location/${id}`;

                console.log("Verifying against:", backendUrl);

                const response = await fetch(backendUrl);

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const jsonData = await response.json();
                setData(jsonData);
            } catch (err) {
                console.error("Verification failed", err);
                setError("Unable to verify facility. It may not exist or the registry is unreachable.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchFacility();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 p-4">
                <Icon name="Loader2" className="animate-spin mb-4 text-blue-600" size={48} />
                <p className="font-medium animate-pulse">Verifying Facility Record...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <Icon name="XCircle" size={48} className="text-red-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                <p className="text-red-700 max-w-xs mx-auto">{error || "Record not found."}</p>
            </div>
        );
    }

    // Parse FHIR Data for Human Readable Display
    const name = data.name;
    const status = data.status === 'active' ? 'Operational' : data.status;
    const type = data.type?.[0]?.text || 'Health Facility';
    const license = data.identifier?.find(i => i.type?.coding?.[0]?.code === 'LN')?.value || 'PENDING';
    const address = data.address || {};
    const phone = data.telecom?.find(t => t.system === 'phone')?.value;
    const email = data.telecom?.find(t => t.system === 'email')?.value;
    const beds = data.extension?.find(e => e.url.includes('capacity'))?.valueInteger;

    return (
        <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">

                {/* Trusted Header */}
                <div className="bg-[#0f2a58] text-white p-6 text-center relative">
                    <div className="relative z-10 flex flex-col items-center">
                        <img src="/assets/images/emblem.png" alt="Official Emblem" className="w-16 h-16 object-contain mb-3" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">National Department of Health</h2>
                        <h1 className="text-xl font-bold tracking-tight">Facility Registry</h1>
                        <div className="mt-4 inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                            <Icon name="CheckCircle2" size={14} />
                            VERIFIED RECORD
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className={`h-2 w-full ${status === 'Operational' ? 'bg-green-500' : 'bg-amber-500'}`} />

                {/* Content */}
                <div className="p-6">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">{name}</h1>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{type}</p>
                    </div>

                    <div className="space-y-6">

                        {/* Key Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase font-bold text-center mb-1">License No.</p>
                                <p className="text-center font-mono font-bold text-slate-700">{license}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase font-bold text-center mb-1">Status</p>
                                <p className={`text-center font-bold flex justify-center items-center gap-1 ${status === 'Operational' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {status}
                                </p>
                            </div>
                        </div>

                        {/* Details List */}
                        <div className="border-t border-slate-100 pt-6 space-y-4">

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                    <Icon name="MapPin" size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
                                    <p className="text-sm text-slate-700 font-medium mt-0.5">
                                        {address.line?.[0]}<br />
                                        {address.district}, {address.state}
                                    </p>
                                </div>
                            </div>

                            {phone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <Icon name="Phone" size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Contact</p>
                                        <a href={`tel:${phone}`} className="text-sm text-blue-700 font-medium hover:underline block mt-0.5">{phone}</a>
                                    </div>
                                </div>
                            )}

                            {beds !== undefined && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <Icon name="Bed" size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Capacity</p>
                                        <p className="text-sm text-slate-700 font-medium mt-0.5">{beds} Beds</p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400">
                                This record is maintained by the<br />
                                <span className="font-semibold text-slate-600">National Health Facility Registry</span>
                            </p>
                            <p className="text-[10px] text-slate-300 mt-2 font-mono">ID: {id}</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicVerification;
