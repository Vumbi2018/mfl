
/**
 * FHIR Transformer Utility
 * Maps internal database schema to HL7 FHIR R4 Location Resources
 * Standard: https://www.hl7.org/fhir/location.html
 */

const mapStatusToFHIR = (status) => {
    if (!status) return 'suspended';
    const s = status.toLowerCase();
    if (s.includes('operational') || s.includes('functional') || s.includes('open')) return 'active';
    if (s.includes('closed') || s.includes('inactive')) return 'inactive';
    if (s.includes('suspended')) return 'suspended';
    return 'inactive'; // Default fallback
};

const mapFacilityToFHIR = (facility) => {
    return {
        resourceType: "Location",
        id: facility.code || facility.id.toString(), // Prefer UUID/Code, fallback to ID
        identifier: [
            {
                system: "http://system-registry.org/facility-codes",
                value: facility.code
            },
            {
                type: {
                    coding: [{
                        system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                        code: "LN",
                        display: "License Number"
                    }]
                },
                value: facility.license_number
            }
        ],
        status: mapStatusToFHIR(facility.operational_status),
        name: facility.name,
        description: facility.description,
        mode: "instance",
        type: [
            {
                coding: [
                    {
                        system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
                        code: "HOSP", // Simplified mapping, ideally would map specific types
                        display: facility.type
                    }
                ],
                text: facility.type
            }
        ],
        telecom: [
            {
                system: "phone",
                value: facility.contact_phone,
                use: "work"
            },
            {
                system: "email",
                value: facility.contact_email,
                use: "work"
            },
            {
                system: "url",
                value: facility.website,
                use: "work"
            }
        ],
        address: {
            line: [facility.street_address],
            city: facility.city,
            district: facility.district,
            state: facility.province, // Mapping Province to State/Region
            postalCode: facility.postal_code,
            country: "PG" // Papua New Guinea ISO code
        },
        physicalType: {
            coding: [
                {
                    system: "http://terminology.hl7.org/CodeSystem/location-physical-type",
                    code: "bu",
                    display: "Building"
                }
            ]
        },
        position: {
            longitude: parseFloat(facility.longitude),
            latitude: parseFloat(facility.latitude),
            altitude: facility.elevation ? parseFloat(facility.elevation) : undefined
        },
        managingOrganization: {
            display: facility.agency_name || facility.ownership
        },
        // Extension for bed capacity (Standard FHIR Extension)
        extension: [
            {
                url: "http://hl7.org/fhir/StructureDefinition/location-capacity",
                valueInteger: facility.total_beds
            }
        ]
    };
};

module.exports = {
    mapFacilityToFHIR
};
