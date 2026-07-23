import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../../../components/AppIcon';
import api from '../../../utils/api';
import Button from '../../../components/ui/Button';

const FacilityLicenseView = ({ facilityId, onClose }) => {
    const [fhirData, setFhirData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFhirData = async () => {
            try {
                // Fetching from the FHIR endpoint to demonstrate Interoperability
                const response = await api.get(`/fhir/Location/${facilityId}`);
                setFhirData(response.data);
            } catch (err) {
                console.error("FHIR Verification Failed", err);
                setError("Could not verify facility against National Registry.");
            } finally {
                setLoading(false);
            }
        };

        if (facilityId) fetchFhirData();
    }, [facilityId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Icon name="Loader2" className="animate-spin mr-2" /> Verifying...
        </div>
    );

    if (error) return (
        <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">
            <Icon name="AlertTriangle" className="mx-auto mb-2" size={32} />
            <p>{error}</p>
            <Button variant="outline" onClick={onClose} className="mt-4">Close</Button>
        </div>
    );

    // Parse FHIR Data for Display
    const name = fhirData.name;
    const type = fhirData.type?.[0]?.text;
    const status = fhirData.status === 'active' ? 'Operational' : fhirData.status;
    const license = fhirData.identifier?.find(i => i.type?.coding?.[0]?.code === 'LN')?.value || 'PENDING';
    const lastUpdated = new Date().toLocaleDateString(); // Mocking generic 'issued' date
    const fhirUrl = `${window.location.protocol}//${window.location.hostname === 'localhost' ? '192.168.1.195' : window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/verify/${facilityId}`;

    // Aggressive Print Styles
    const printStyles = `
        @media print {
            /* 1. RESET PAGE */
            @page {
                size: A4 portrait;
                margin: 0mm;
            }
            
            /* 2. HIDE EVERYTHING ELSE */
            body {
                visibility: hidden;
                overflow: hidden;
            }
            
            /* 3. TARGET THE CERTIFICATE CONTAINER */
            .certificate-container {
                /* Visibility & Position */
                visibility: visible !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                
                /* Dimensions - Aggressive Fill */
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                max-height: none !important;
                margin: 0 !important;
                padding: 0 !important;
                
                /* Layering */
                z-index: 2147483647 !important; /* Max Z-Index */
                background-color: white !important;
                
                /* Visuals */
                box-sizing: border-box !important;
                border: 10px double #cbd5e1 !important; /* Thick generic border */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                
                /* Flex Layout to Fill Space */
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
            }
            
            /* 4. ENSURE CHILDREN ARE VISIBLE */
            .certificate-container * {
                visibility: visible !important;
            }
            
            /* 5. DISABLE TRANSFORMS THAT MIGHT SHRINK IT */
            * {
                transform: none !important;
                box-shadow: none !important; /* graphical artifacts removal */
            }
        }
    `;

    return (
        <div className="bg-white text-slate-900 w-full max-w-2xl mx-auto rounded-lg shadow-2xl overflow-hidden border-8 border-double border-slate-200 print:shadow-none print:border-4 certificate-container">
            <style>{printStyles}</style>
            {/* Certificate Header */}
            <div className="bg-slate-900 text-white p-6 text-center relative overflow-hidden print:p-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400"></div>
                <div className="relative z-10 flex flex-col items-center gap-1">
                    <img src="/assets/images/emblem.png" alt="Emblem" className="w-16 h-16 object-contain mb-2 print:w-24 print:h-24" />
                    <h1 className="text-xl font-serif font-bold tracking-wider uppercase print:text-3xl">National Department of Health</h1>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300 print:text-lg print:text-gray-200">Provincial Health Authority</h2>
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold mt-1 print:text-sm print:mt-2">
                        {fhirData.address?.state ? `${fhirData.address.state} PHA` : 'National Registry'}
                    </p>
                </div>
            </div>

            {/* Certificate Body */}
            <div className="p-8 text-center space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex-1 flex flex-col justify-center print:p-12">

                <div className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 font-bold text-xs uppercase tracking-widest border border-green-200 print:border-green-800 print:text-green-900 print:bg-green-100">
                    Officially Registered
                </div>

                <div className="space-y-4 print:space-y-8">
                    <p className="text-sm text-slate-500 font-serif italic print:text-lg">This certifies that</p>
                    <h2 className="text-4xl font-serif font-bold text-slate-900 print:text-6xl">{name}</h2>
                    <p className="text-lg text-slate-600 border-b border-slate-200 pb-4 inline-block px-12 print:text-2xl print:px-20 print:pb-6">{type}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 text-left max-w-md mx-auto py-4 print:max-w-2xl print:gap-12 print:py-10">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide print:text-sm print:text-slate-600">License Number</p>
                        <p className="font-mono text-lg font-bold print:text-2xl">{license}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide print:text-sm print:text-slate-600">Operational Status</p>
                        <p className="font-bold text-green-600 flex items-center gap-2 print:text-2xl">
                            <Icon name="CheckCircle2" size={16} className="print:w-6 print:h-6" /> {status}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-slate-400 uppercase tracking-wide print:text-sm print:text-slate-600">Authorized Location</p>
                        <p className="text-sm font-medium print:text-xl">
                            {fhirData.address?.line?.[0]}<br />
                            {fhirData.address?.district}, {fhirData.address?.state}
                        </p>
                    </div>
                </div>

                {/* Footer / Validation */}
                <div className="mt-auto pt-16 border-t border-dashed border-slate-300 flex items-center justify-between print:pt-20">
                    <div className="text-left">
                        <QRCodeSVG value={fhirUrl} size={84} className="print:w-32 print:h-32" />
                        <p className="text-[10px] text-slate-400 mt-2 max-w-[120px] print:text-xs print:max-w-[200px]">Scan to verify against the National Master Facility List (FHIR Layer)</p>
                    </div>

                    <div className="text-right">
                        <div className="h-12 w-32 border-b border-slate-400 mb-2 relative print:w-48 print:h-16 print:mb-4">
                            <span className="absolute bottom-1 right-0 font-script text-2xl text-slate-600 opacity-60 rotate-[-10deg] print:text-4xl">Registrar</span>
                        </div>
                        <p className="text-xs font-bold uppercase print:text-sm">Registrar of Facilities</p>
                        <p className="text-[10px] text-slate-400 print:text-xs">Date Issued: {lastUpdated}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 p-4 flex justify-between print:hidden border-t border-slate-200">
                <Button variant="ghost" onClick={onClose}>Close</Button>
                <Button variant="default" iconName="Printer" onClick={handlePrint}>Print Certificate</Button>
            </div>
        </div>
    );
};

export default FacilityLicenseView;
