import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import LanguageSelector from '../../components/navigation/LanguageSelector';
import NotificationBell from '../../components/navigation/NotificationBell';
import TenantSwitcher from '../../components/navigation/TenantSwitcher';
import { Search, X, MapPin, ChevronDown, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Bookmark, Save } from 'lucide-react';
import api from '../../utils/api';


// ... inside component ...
const FacilitiesContent = () => {
    const { isCollapsed } = useSidebar();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams(); // Hook for URL params
    // State for ALL data
    const [allFacilities, setAllFacilities] = useState([]);
    const [facilities, setFacilities] = useState([]); // Currently displayed (paginated) page

    // Loading & Pagination
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        status: searchParams.get('status') || 'all',
        type: searchParams.get('type') || 'all',
        region_id: searchParams.get('region_id') || 'all',
        province_id: searchParams.get('province_id') || 'all',
        province_name: searchParams.get('province') || '', // Handle name-based param
        district_id: searchParams.get('district_id') || 'all',
        ward_id: searchParams.get('ward_id') || 'all',
        gps_status: searchParams.get('gps_status') || 'all', // Fix: Read from URL
        isDuplicate: searchParams.get('isDuplicate') === 'true' // Fix: Read boolean from URL
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const [sort, setSort] = useState({
        key: 'name',
        order: 'ASC'
    });

    // 2. Fetch ALL Facilities (Public Endpoint)
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const response = await api.get('/facilities/public');
                const rawData = response.data || [];

                // Enhance data for filtering
                const processed = rawData.map(f => {
                    const s = (f.operational_status || '').toLowerCase();
                    let cat = 'pending';
                    if (s.includes('open') || s.includes('active') || s.includes('functional')) cat = 'operational';
                    else if (s.includes('closed') || s.includes('inactive')) cat = 'closed';

                    return {
                        ...f,
                        status_category: cat, // For filtering
                        date_established: f.created_at // Fallback if date_established missing
                    };
                });

                setAllFacilities(processed);
            } catch (err) {
                console.error("Failed to fetch facilities", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const [locations, setLocations] = useState([]);
    const [facilityTypes, setFacilityTypes] = useState([]);

    // Derived Location Hierarchies
    const hasRegions = locations.length > 0 && !!locations[0].provinces;
    
    const availableProvinces = hasRegions 
        ? (filters.region_id !== 'all' ? locations.find(r => r.id === parseInt(filters.region_id))?.provinces || [] : [])
        : locations;
        
    const availableDistricts = filters.province_id !== 'all'
        ? availableProvinces.find(p => p.id === parseInt(filters.province_id))?.districts || []
        : [];

    const availableWards = filters.district_id !== 'all'
        ? availableDistricts.find(d => d.id === parseInt(filters.district_id))?.wards || []
        : [];


    // 1. Fetch Metadata (Locations + Types)
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [locRes, typeRes] = await Promise.all([
                    api.get('/facilities/locations'),
                    api.get('/facilities/types')
                ]);
                setLocations(locRes.data);
                setFacilityTypes(typeRes.data);
            } catch (error) {
                console.error("Failed to fetch metadata", error);
            }
        };
        fetchMeta();
    }, []);

    // 2.5 Duplicate Detection Logic
    const processedFacilities = React.useMemo(() => {
        if (!allFacilities.length) return [];

        const nameMap = new Map();
        const coordMap = new Map();

        // Pass 1: Count occurrences
        allFacilities.forEach(f => {
            const nameKey = (f.name || '').trim().toLowerCase();
            if (nameKey) nameMap.set(nameKey, (nameMap.get(nameKey) || 0) + 1);

            if (f.latitude && f.longitude) {
                const coordKey = `${parseFloat(f.latitude).toFixed(4)},${parseFloat(f.longitude).toFixed(4)}`;
                coordMap.set(coordKey, (coordMap.get(coordKey) || 0) + 1);
            }
        });

        // Pass 2: Flag duplicates
        return allFacilities.map(f => {
            const nameKey = (f.name || '').trim().toLowerCase();
            const isNameDup = nameMap.get(nameKey) > 1;

            let isCoordDup = false;
            if (f.latitude && f.longitude) {
                const coordKey = `${parseFloat(f.latitude).toFixed(4)},${parseFloat(f.longitude).toFixed(4)}`;
                isCoordDup = coordMap.get(coordKey) > 1;
            }

            let dupReason = null;
            if (isNameDup && isCoordDup) dupReason = 'Duplicate Name & Location';
            else if (isNameDup) dupReason = 'Duplicate Name';
            else if (isCoordDup) dupReason = 'Duplicate Location';

            return { ...f, isDuplicate: !!dupReason, duplicateReason: dupReason };
        });
    }, [allFacilities]);




    // Sync filters with URL params (Improved Reliability)
    const urlString = searchParams.toString();
    useEffect(() => {
        console.log("URL Params Changed:", urlString);
        setFilters(prev => ({
            ...prev,
            search: searchParams.get('search') || '',
            status: searchParams.get('status') || 'all',
            type: searchParams.get('type') || 'all',
            region_id: searchParams.get('region_id') || 'all',
            province_id: searchParams.get('province_id') || 'all',
            province_name: searchParams.get('province') || '',
            district_id: searchParams.get('district_id') || 'all',
            ward_id: searchParams.get('ward_id') || 'all',
            gps_status: searchParams.get('gps_status') || 'all',
            isDuplicate: searchParams.get('isDuplicate') === 'true'
        }));
    }, [urlString]);

    // 3. Client-Side Filtering, Sorting & Pagination
    useEffect(() => {
        console.log("Applying filters:", filters);
        let result = [...processedFacilities];
        console.log("Initial count:", result.length);

        // A. Filtering
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(f =>
                (f.name || '').toLowerCase().includes(q) ||
                (f.code || '').toLowerCase().includes(q)
            );
        }
        if (filters.type !== 'all') {
            result = result.filter(f => f.type === filters.type);
        }
        if (filters.status !== 'all') {
            // Match against status_category (operational/closed/pending)
            result = result.filter(f => f.status_category === filters.status.toLowerCase());
        }

        // GPS Status Filter
        if (filters.gps_status !== 'all') {
            if (filters.gps_status === 'with_gps') {
                result = result.filter(f => f.latitude && f.longitude && f.latitude !== 0 && f.longitude !== 0);
            } else if (filters.gps_status === 'no_gps') {
                result = result.filter(f => !f.latitude || !f.longitude || f.latitude === 0 || f.longitude === 0);
            }
        }

        // Duplicate Filter Special Case
        if (filters.isDuplicate) {
            result = result.filter(f => f.isDuplicate);
        }

        if (filters.region_id !== 'all') {
            result = result.filter(f => f.region_id == filters.region_id);
        }

        // Province Filter (ID or Name)
        if (filters.province_id !== 'all') {
            result = result.filter(f => f.province_id == filters.province_id);
        } else if (filters.province_name && filters.province_name !== '') {
            result = result.filter(f => (f.province || '').toLowerCase() === filters.province_name.toLowerCase());
        }


        if (filters.district_id !== 'all') {
            result = result.filter(f => f.district_id == filters.district_id);
        }

        if (filters.ward_id !== 'all') {
            result = result.filter(f => f.ward_id == filters.ward_id);
        }


        // B. Sorting
        result.sort((a, b) => {
            let valA = a[sort.key] || '';
            let valB = b[sort.key] || '';

            // Handle numbers/dates if needed? string comparison is usually fine for these stats
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sort.order === 'ASC' ? -1 : 1;
            if (valA > valB) return sort.order === 'ASC' ? 1 : -1;
            return 0;
        });

        const totalItems = result.length;
        const totalPages = Math.ceil(totalItems / pagination.limit);

        // C. Pagination Slice
        const startIndex = (pagination.page - 1) * pagination.limit;
        const sliced = result.slice(startIndex, startIndex + pagination.limit);

        setFacilities(sliced);
        setPagination(prev => ({
            ...prev,
            total: totalItems,
            totalPages: totalPages || 1,
            // Ensure page doesn't exceed new range
            page: (pagination.page > totalPages && totalPages > 0) ? totalPages : pagination.page
        }));

    }, [processedFacilities, filters, sort, pagination.page, pagination.limit]);


    // Handlers
    const handleSearchChange = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (key) => {
        setSort(prev => ({
            key,
            order: prev.key === key && prev.order === 'ASC' ? 'DESC' : 'ASC'
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleLimitChange = (e) => {
        setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            status: 'all',
            type: 'all',
            region_id: 'all',
            province_id: 'all',
            province_name: '',
            district_id: 'all',
            ward_id: 'all',
            gps_status: 'all',
            isDuplicate: false
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const SortIcon = ({ column }) => {
        if (sort.key !== column) return <ArrowUpDown size={14} className="ml-1 text-slate-400 opacity-50" />;
        return sort.order === 'ASC' ? <ArrowUp size={14} className="ml-1 text-indigo-600" /> : <ArrowDown size={14} className="ml-1 text-indigo-600" />;
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <MobileMenuButton />

            <div className={`flex-1 flex flex-col h-screen overflow-hidden relative z-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}>
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
                    <h1 className="text-xl font-bold text-slate-800">Facilities Registry</h1>
                    <div className="flex items-center space-x-3">
                        <LanguageSelector />
                        <TenantSwitcher />
                        <NotificationBell />
                        <WorkflowStatusIndicator />
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    {/* Controls Bar */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4 shrink-0">
                        {/* Top Row: Search & reset */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                            <div className="relative flex-1 min-w-[300px] w-full md:w-auto md:max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search facilities..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
                                    value={filters.search}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                />
                            </div>

                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                            >
                                <X size={16} />
                                Reset Filters
                            </button>
                        </div>

                        {/* Filter Bar - Compact & Neat */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Location Group */}
                            <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center px-2 text-slate-400">
                                    <MapPin size={14} />
                                </div>

                                {/* Region */}
                                {hasRegions && (
                                    <>
                                        <div className="relative group">
                                            <select
                                                className="appearance-none bg-transparent text-sm text-slate-700 font-medium py-1.5 pl-2 pr-6 focus:ring-0 border-none outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                                                value={filters.region_id}
                                                onChange={(e) => setFilters(prev => ({ ...prev, region_id: e.target.value, province_id: 'all', province_name: '', district_id: 'all', ward_id: 'all', page: 1 }))}
                                            >
                                                <option value="all">Region</option>
                                                {locations.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500" />
                                        </div>
                                        <span className="text-slate-300 text-sm select-none">/</span>
                                    </>
                                )}

                                {/* Province */}
                                <div className="relative group">
                                    <select
                                        className="appearance-none bg-transparent text-sm text-slate-700 font-medium py-1.5 pl-2 pr-6 focus:ring-0 border-none outline-none cursor-pointer hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={filters.province_id}
                                        onChange={(e) => setFilters(prev => ({ ...prev, province_id: e.target.value, province_name: '', district_id: 'all', ward_id: 'all', page: 1 }))}
                                        disabled={hasRegions && filters.region_id === 'all'}
                                    >
                                        <option value="all">Province</option>
                                        {availableProvinces.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500" />
                                </div>
                                <span className="text-slate-300 text-sm select-none">/</span>

                                {/* District */}
                                <div className="relative group">
                                    <select
                                        className="appearance-none bg-transparent text-sm text-slate-700 font-medium py-1.5 pl-2 pr-6 focus:ring-0 border-none outline-none cursor-pointer hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={filters.district_id}
                                        onChange={(e) => setFilters(prev => ({ ...prev, district_id: e.target.value, ward_id: 'all', page: 1 }))}
                                        disabled={filters.province_id === 'all'}
                                    >
                                        <option value="all">District</option>
                                        {availableDistricts.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500" />
                                </div>
                                <span className="text-slate-300 text-sm select-none">/</span>

                                {/* Ward */}
                                <div className="relative group">
                                    <select
                                        className="appearance-none bg-transparent text-sm text-slate-700 font-medium py-1.5 pl-2 pr-6 focus:ring-0 border-none outline-none cursor-pointer hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={filters.ward_id}
                                        onChange={(e) => setFilters(prev => ({ ...prev, ward_id: e.target.value, page: 1 }))}
                                        disabled={filters.district_id === 'all'}
                                    >
                                        <option value="all">Ward</option>
                                        {availableWards.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500" />
                                </div>

                            </div>


                            {/* Separator */}
                            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                            {/* Type Filter */}
                            <div className="relative">
                                <select
                                    className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors appearance-none font-medium text-slate-700 min-w-[140px]"
                                    value={filters.type}
                                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                                >
                                    <option value="all">All Types</option>
                                    {facilityTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <select
                                    className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors appearance-none font-medium text-slate-700 min-w-[140px]"
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Operational">Operational</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Pending">Pending</option>
                                </select>
                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none ${filters.status === 'Operational' ? 'bg-emerald-500' :
                                    filters.status === 'Pending' ? 'bg-amber-500' :
                                        filters.status === 'Closed' ? 'bg-red-500' : 'bg-slate-400'
                                    }`}></div>
                            </div>

                            {/* GPS Filter */}
                            <div className="relative">
                                <select
                                    className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors appearance-none font-medium text-slate-700 min-w-[140px]"
                                    value={filters.gps_status || 'all'}
                                    onChange={(e) => setFilters(prev => ({ ...prev, gps_status: e.target.value, page: 1 }))}
                                >
                                    <option value="all">All Locations</option>
                                    <option value="with_gps">With GPS</option>
                                    <option value="no_gps">Missing GPS</option>
                                </select>
                                <MapPin className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${filters.gps_status === 'with_gps' ? 'text-emerald-500' :
                                    filters.gps_status === 'no_gps' ? 'text-red-500' : 'text-slate-400'
                                    }`} size={14} />
                            </div>

                            {/* Duplicate Toggle */}
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, isDuplicate: !prev.isDuplicate, page: 1 }))}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${filters.isDuplicate
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                title="Show Possible Duplicates"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                Possible Duplicates
                            </button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0 relative overflow-hidden">
                        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead className="bg-slate-50 z-10">
                                    <tr className="border-b border-slate-200">
                                        {[
                                            ...(hasRegions ? [{ label: 'Region', key: 'region' }] : []),
                                            { label: 'Province', key: 'province' },
                                            { label: 'District', key: 'district' },
                                            { label: 'Facility Name', key: 'name' },
                                            { label: 'Code', key: 'code' },
                                            { label: 'Type', key: 'type' },
                                            { label: 'Ownership', key: 'ownership' },
                                            { label: 'Date Opened', key: 'date_established' },
                                            { label: 'Status', key: 'status' }
                                        ].map((col) => (
                                            <th
                                                key={col.key}
                                                className="sticky top-0 z-20 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 hover:bg-slate-100 transition-colors user-select-none shadow-sm whitespace-nowrap"
                                                onClick={() => handleSort(col.key)}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {col.label}
                                                    <SortIcon column={col.key} />
                                                </div>
                                            </th>
                                        ))}
                                        <th className="sticky top-0 z-20 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right shadow-sm whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="10" className="text-center py-12 text-slate-400">Loading facilities...</td></tr>
                                    ) : facilities.length === 0 ? (
                                        <tr><td colSpan="10" className="text-center py-12 text-slate-400">No facilities found.</td></tr>
                                    ) : (
                                        facilities.map(facility => (
                                                <tr 
                                                    key={facility.id} 
                                                    className="hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                                                    onClick={() => navigate(`/facilities/${facility.id}`)}
                                                >
                                                    {hasRegions && <td className="px-4 py-3 text-sm text-slate-600 font-medium whitespace-nowrap">{facility.region || '-'}</td>}
                                                    <td className="px-4 py-3 text-sm text-slate-600 font-medium whitespace-nowrap">{facility.province || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{facility.district || '-'}</td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors min-w-[200px]">
                                                        <div className="flex items-center gap-2">
                                                            {facility.name}
                                                            {facility.isDuplicate && (
                                                                <div className="relative group/tooltip" onClick={(e) => e.stopPropagation()}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 cursor-help"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                                                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none z-50">
                                                                        Possible Duplicate: {facility.duplicateReason}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs"><span className="bg-slate-100 px-2 py-1 rounded w-fit inline-block">{facility.code}</span></td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                            {facility.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{facility.ownership || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                                                        {facility.date_established ? new Date(facility.date_established).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${facility.operational_status?.toLowerCase() === 'operational'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                            : facility.operational_status?.toLowerCase() === 'pending'
                                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${facility.operational_status?.toLowerCase() === 'operational' ? 'bg-emerald-500' :
                                                                facility.operational_status?.toLowerCase() === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                                                                }`}></span>
                                                            {facility.operational_status || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/facilities/${facility.id}`);
                                                            }}
                                                            className="text-slate-400 hover:text-indigo-600 font-medium transition-colors hover:bg-indigo-50 p-1.5 rounded-full"
                                                            title="Edit Facility"
                                                        >
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 z-10">
                            <div className="text-sm text-slate-500">
                                Showing <span className="font-semibold text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-slate-900">{pagination.total}</span> results
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">Rows:</span>
                                    <select
                                        className="border border-slate-200 rounded-md px-2 py-1 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                        value={pagination.limit}
                                        onChange={handleLimitChange}
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        Page
                                        <select
                                            className="border border-slate-200 rounded px-1 py-0.5 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                            value={pagination.page}
                                            onChange={(e) => handlePageChange(parseInt(e.target.value))}
                                        >
                                            {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map(pageNum => (
                                                <option key={pageNum} value={pageNum}>
                                                    {pageNum}
                                                </option>
                                            ))}
                                        </select>
                                        of {pagination.totalPages || 1}
                                    </span>

                                    <button
                                        className="p-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const FacilitiesList = () => {
    return (
        <SidebarProvider>
            <FacilitiesContent />
        </SidebarProvider>
    );
};

export default FacilitiesList;
