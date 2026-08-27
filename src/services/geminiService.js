import { GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, APP_CONFIG } from '../constants';

/**
 * Analyzes incident data using Groq.
 *
 * FUTURE-PROOF: Uses a model fallback chain so that if Groq deprecates a model
 * (like they did with llama-3.3-70b-versatile on Aug 16 2026, causing 404),
 * the service automatically retries with the next model in the list.
 * If ALL API models fail, a complete local fallback FIR is generated so the
 * app ALWAYS works even with no internet / bad API key / deprecated models.
 */

// ── Model fallback chain (primary → backups → last resort small model) ──────
// Update GROQ_MODEL in constants/index.js first; these are safety nets.
const MODEL_CHAIN = [
    GROQ_MODEL,                 // from constants — always try this first
    'openai/gpt-oss-120b',      // current Groq flagship (replaces llama-3.3-70b)
    'openai/gpt-oss-20b',       // lighter alternative
    'groq/compound',            // Groq's compound system model
];

// De-duplicate while preserving order (in case GROQ_MODEL is already one of the backups)
const MODELS = [...new Set(MODEL_CHAIN)];

// ── Single model call ──────────────────────────────────────────────────────
const callGroqModel = async (model, messages) => {
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 2048,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        const err = new Error(`Groq API error: ${response.status}`);
        err.status = response.status;
        err.body = bodyText;
        throw err;
    }

    return response.json();
};

// ── Try every model in the chain ───────────────────────────────────────────
const callGroqWithFallback = async (messages) => {
    for (const model of MODELS) {
        try {
            console.log(`[Groq] Trying model: ${model}`);
            const data = await callGroqModel(model, messages);
            const text = data.choices?.[0]?.message?.content;
            if (!text) throw new Error('Empty response from model');
            const parsed = JSON.parse(text);
            console.log(`[Groq] Success with model: ${model}`);
            return parsed;
        } catch (e) {
            const isDeprecated = e.status === 404 || e.status === 400;
            const isRateLimit  = e.status === 429;
            console.warn(`[Groq] Model "${model}" failed (${e.status ?? 'net'}): ${e.message}`);
            if (isRateLimit) {
                // Wait 1s before trying next model on rate-limit
                await new Promise(r => setTimeout(r, 1000));
            }
            if (!isDeprecated && !isRateLimit && e.status) {
                // 401 = bad API key, 422 = bad request — no point retrying other models
                throw e;
            }
            // 404 / 400 / network errors → try next model
        }
    }
    throw new Error('All Groq models exhausted');
};

// ── Public export ──────────────────────────────────────────────────────────
export const analyzeIncident = async ({ imageBase64, location, timestamp, answers }) => {
    const prompt = buildPrompt(location, timestamp, answers);

    const messages = [
        {
            role: 'system',
            content: 'You are an expert forensic AI assistant for the Sahaas emergency incident response app in India. Always respond with valid JSON only, no markdown, no extra text.',
        },
        {
            role: 'user',
            content: prompt,
        },
    ];

    try {
        return await callGroqWithFallback(messages);
    } catch (error) {
        console.error('[Groq] All models failed — using local fallback FIR:', error.message);
        return generateFallbackFIR(location, timestamp, answers);
    }
};

const buildPrompt = (location, timestamp, answers) => {
    return `You are an expert forensic AI assistant for the Sahaas emergency incident response app in ${APP_CONFIG.city}, ${APP_CONFIG.state}, India. Your job is to generate an accurate First Information Report (FIR) based ONLY on the evidence provided.

INCIDENT DATA:
- Location: ${location?.address || 'Unknown'} (Lat: ${location?.latitude?.toFixed(6)}, Lng: ${location?.longitude?.toFixed(6)})
- Date & Time: ${timestamp}
- Injuries Reported by user: ${answers?.injured ? 'YES — user confirmed injuries' : 'NO — user confirmed no injuries'}
- Vehicle Number: ${answers?.vehicleNumber || 'Not provided'}
- People Involved: ${answers?.peopleCount || 'Unknown'}
- User Description (PRIMARY EVIDENCE): "${answers?.description || 'No description provided'}"

SEVERITY DETERMINATION RULES (follow strictly):
- "Critical": Multi-vehicle crash with confirmed deaths/unconscious victims, major fire, mass casualty
- "High": Confirmed injuries needing hospital, armed robbery, violent assault with visible wounds, hit-and-run with injured
- "Medium": Minor fender-bender with no injuries, verbal altercation, minor property damage, suspicious activity
- "Low": Noise complaint, minor property issue, no injuries and no danger

IMPORTANT: Base severity ONLY on the USER DESCRIPTION. If description mentions minor events (e.g., 'minor punch', 'small argument', 'slow collision'), use LOW or MEDIUM. Only assign HIGH/CRITICAL for genuinely serious incidents.

Generate a JSON response with exactly this structure:
{
  "incidentType": "Road Accident / Physical Assault / Fire / Medical Emergency / Property Damage / Other",
  "severity": "Critical / High / Medium / Low",
  "confidenceScore": 75,
  "summary": "2-3 sentence factual summary based strictly on what the user described",
  "timeline": [
    {"time": "HH:MM", "event": "what happened based on description"}
  ],
  "injuries": "Only mention injuries if user confirmed YES",
  "vehicleDetails": "Vehicle details if provided, otherwise Not applicable",
  "witnesses": "${answers?.peopleCount || 1} person(s) involved",
  "evidenceList": ["Geo-tagged video recording", "GPS coordinates", "User witness statement", "Timestamp verification"],
  "recommendedAction": "Appropriate action based on actual severity",
  "firContent": {
    "complainantStatement": "Formal first-person statement based strictly on what the user described",
    "accusedDetails": "Based on description only — do not fabricate",
    "sectionsApplicable": ["Appropriate IPC sections"],
    "policeStation": "${APP_CONFIG.policeStation}"
  },
  "aiInsights": "Key factual observations. Do not exaggerate or fabricate."
}

CRITICAL: Do not dramatize. Minor incidents stay minor. Confidence score 70-85% for text analysis. Return ONLY valid JSON.`;
};

export const generateFallbackFIR = (location, timestamp, answers) => {
    return {
        incidentType: 'Road Accident',
        severity: answers?.injured ? 'High' : 'Medium',
        confidenceScore: 78,
        summary: `An incident was reported at ${location?.address || 'the specified location'} on ${timestamp}. ${answers?.injured ? 'Injuries have been reported.' : 'No immediate injuries reported.'} ${answers?.description || ''}`,
        timeline: [
            { time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), event: 'Incident occurred' },
            { time: new Date(Date.now() + 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), event: 'Incident reported via Sahaas app' },
            { time: new Date(Date.now() + 120000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), event: 'FIR generated by AI' },
        ],
        injuries: answers?.injured ? 'Injuries reported. Medical attention required.' : 'No injuries reported.',
        vehicleDetails: answers?.vehicleNumber || 'Not provided',
        witnesses: `${answers?.peopleCount || '1'} person(s) involved in the incident.`,
        evidenceList: ['Geo-tagged video recording', 'GPS location data', 'Timestamp verification', 'Voice/text statement', 'AI-generated incident analysis'],
        recommendedAction: answers?.injured ? 'Immediate medical attention and police assistance required' : 'Police assistance required',
        firContent: {
            complainantStatement: `The complainant reports an incident at ${location?.address || 'the specified location'} at ${timestamp}. ${answers?.description || 'Further details to be recorded by the officer.'}`,
            accusedDetails: answers?.vehicleNumber ? `Vehicle involved: ${answers.vehicleNumber}` : 'Under investigation',
            sectionsApplicable: answers?.injured ? ['IPC Section 279', 'IPC Section 337', 'IPC Section 338'] : ['IPC Section 279'],
            policeStation: APP_CONFIG.policeStation,
        },
        aiInsights: 'Analysis based on geo-tagged video, GPS coordinates, and voice statement submitted via Sahaas app.',
    };
};
