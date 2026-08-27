/**
 * videoUploadService.js
 *
 * Uploads the incident video to Cloudinary using XMLHttpRequest so we get
 * REAL upload progress (not a fake timer that freezes at 86%).
 *
 * Falls back to catbox.moe → 0x0.st if Cloudinary fails.
 * All services: free, permanent URLs, playable anywhere.
 */

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../constants';

// ─── Real XHR upload with actual progress events ─────────────────────────────
const xhrUpload = (url, formData, onProgress, timeoutMs = 120000) =>
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // ── Real upload progress ──
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                // Map actual bytes-sent to 10–95% (we save 95–100 for server processing)
                const pct = Math.round(10 + (e.loaded / e.total) * 85);
                onProgress(Math.min(pct, 95));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
            } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText?.slice(0, 200)}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.ontimeout = () => reject(new Error(`Upload timed out after ${timeoutMs / 1000}s`));

        xhr.timeout = timeoutMs;
        xhr.open('POST', url);
        xhr.send(formData);
    });

// ─── Service 1: Cloudinary ────────────────────────────────────────────────────
const uploadToCloudinary = async (videoUri, onProgress) => {
    onProgress && onProgress(5);

    const formData = new FormData();
    formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'sahaas_incident.mp4',
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'video');

    const rawText = await xhrUpload(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        formData,
        onProgress,
        120000, // 2-minute timeout
    );

    // Server-side processing: go from 95 → 98
    onProgress && onProgress(98);

    let data;
    try {
        data = JSON.parse(rawText);
    } catch {
        throw new Error('Cloudinary returned non-JSON response');
    }

    if (!data.secure_url) {
        throw new Error(data.error?.message || 'Cloudinary: no secure_url in response');
    }

    onProgress && onProgress(100);
    return data.secure_url; // e.g. https://res.cloudinary.com/.../video.mp4
};

// ─── Service 2: catbox.moe ────────────────────────────────────────────────────
const uploadToCatbox = async (videoUri, onProgress) => {
    onProgress && onProgress(5);

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'sahaas_incident.mp4',
    });

    const text = await xhrUpload(
        'https://catbox.moe/user/api.php',
        formData,
        onProgress,
        90000, // 90s timeout
    );

    const trimmed = text.trim();
    if (!trimmed.startsWith('https://')) {
        throw new Error(`catbox.moe bad response: ${trimmed.slice(0, 100)}`);
    }

    onProgress && onProgress(100);
    return trimmed; // e.g. https://files.catbox.moe/abc123.mp4
};

// ─── Service 3: 0x0.st ───────────────────────────────────────────────────────
const uploadTo0x0 = async (videoUri, onProgress) => {
    onProgress && onProgress(5);

    const formData = new FormData();
    formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'sahaas_incident.mp4',
    });

    const text = await xhrUpload(
        'https://0x0.st',
        formData,
        onProgress,
        90000, // 90s timeout
    );

    const trimmed = text.trim();
    if (!trimmed.startsWith('https://')) {
        throw new Error(`0x0.st bad response: ${trimmed.slice(0, 100)}`);
    }

    onProgress && onProgress(100);
    return trimmed; // e.g. https://0x0.st/XXXX.mp4
};

// ─── Main export: try all three services, return first that works ─────────────
const SERVICES = [
    { name: 'Cloudinary', fn: uploadToCloudinary },
    { name: 'catbox.moe', fn: uploadToCatbox },
    { name: '0x0.st',     fn: uploadTo0x0      },
];

export const uploadVideoToServer = async (videoUri, onProgress) => {
    if (!videoUri) throw new Error('No video URI provided');

    for (const service of SERVICES) {
        try {
            console.log(`[Upload] Trying ${service.name}...`);
            onProgress && onProgress(3);
            const url = await service.fn(videoUri, onProgress);
            console.log(`[Upload] ${service.name} succeeded → ${url}`);
            return url;
        } catch (e) {
            console.warn(`[Upload] ${service.name} failed: ${e.message} — trying next service...`);
            onProgress && onProgress(3); // reset progress bar for next attempt
        }
    }

    throw new Error('All upload services failed. Please check your internet connection.');
};
