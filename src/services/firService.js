import { APP_CONFIG } from '../constants';

/**
 * Generates a complete FIR object with reference number.
 * Accepts optional platePhotoUri for number plate photo evidence.
 */
export const generateFIR = (aiData, location, timestamp, answers, videoUri, videoUrl, platePhotoUri, language) => {
    const refNumber = generateReferenceNumber();
    const now = new Date();

    // Build evidence list — include number plate photo if captured
    const baseEvidence = aiData.evidenceList || [];
    const platePhotoEvidence = platePhotoUri
        ? ['📸 Number Plate Photo — High-resolution capture (attached in evidence section)']
        : [];
    const evidenceList = [...baseEvidence, ...platePhotoEvidence];

    return {
        // Header
        referenceNumber: refNumber,
        filedAt: now.toISOString(),
        filedAtFormatted: now.toLocaleString('en-IN', {
            dateStyle: 'full',
            timeStyle: 'medium',
            timeZone: 'Asia/Kolkata',
        }),
        policeStation: APP_CONFIG.policeStation,
        district: APP_CONFIG.city,
        state: APP_CONFIG.state,

        // Incident Info
        incidentType: aiData.incidentType || 'Road Accident',
        severity: aiData.severity || 'High',
        confidenceScore: aiData.confidenceScore || 80,

        // Location
        location: {
            address: location?.address || 'Location recorded',
            latitude: location?.latitude,
            longitude: location?.longitude,
            googleMapsUrl: `https://maps.google.com/?q=${location?.latitude},${location?.longitude}`,
        },

        // Time
        incidentTime: timestamp,

        // Complainant answers
        injured: answers?.injured ?? false,
        vehicleNumber: answers?.vehicleNumber || 'Not provided',
        peopleCount: answers?.peopleCount || 1,
        description: answers?.description || '',

        // AI Analysis
        summary: aiData.summary || '',
        timeline: aiData.timeline || [],
        injuries: aiData.injuries || '',
        vehicleDetails: aiData.vehicleDetails || '',
        witnesses: aiData.witnesses || '',
        evidenceList,
        recommendedAction: aiData.recommendedAction || '',
        aiInsights: aiData.aiInsights || '',

        // FIR Formal Content
        complainantStatement: aiData.firContent?.complainantStatement || '',
        sectionsApplicable: aiData.firContent?.sectionsApplicable || ['IPC Section 279'],

        // Video Evidence
        videoUri: videoUri || null,
        videoUrl: videoUrl || null,      // remote server URL for PDF link
        hasVideo: !!videoUri,

        // Number Plate Photo Evidence (optional)
        platePhotoUri: platePhotoUri || null,
        hasPlatePhoto: !!platePhotoUri,

        // Status
        status: 'GENERATED',
        submittedVia: 'SAHAAS Mobile App v1.0',
        language: language || 'en',
    };
};

export const generateReferenceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `HYD-${year}${month}${day}-${random}`;
};
