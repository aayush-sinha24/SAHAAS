// ─── SAHAAS CONSTANTS ───────────────────────────────────────────────────────

export const GROQ_API_KEY = '';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'openai/gpt-oss-120b'; // Updated: llama-3.3-70b-versatile was deprecated Aug 16 2026

// Cloudinary — for video uploads (free account at cloudinary.com)
// Steps: 1) Sign up free at cloudinary.com  2) Copy your Cloud Name below
//        3) Settings → Upload → Add Preset → Unsigned → name it 'sahaas_videos'
export const CLOUDINARY_CLOUD_NAME = 'dgdzk5yas';  // ← your cloud name here
export const CLOUDINARY_UPLOAD_PRESET = 'sahaas_videos'; // ← your unsigned preset name

// Emergency contacts (for demo — real numbers to your friend's phone)
export const EMERGENCY_CONTACTS = {
  police: '9348994546',
  ambulance: '9348994546',
  fire: '9348994546',
};

// Email config
export const EMAIL_CONFIG = {
  serviceId: 'service_c4k64vj',
  templateId: 'template_lp2b3fy',
  publicKey: '6cMzQPB6c9eOxInzI',
  toEmail: 'rayarudrakshh@gmail.com', // Placeholder — email feature removed
};

// Fast2SMS
export const SMS_API_KEY = '';

export const APP_CONFIG = {
  name: 'Sahaas',
  nameHindi: 'सहास',
  nameTelugu: 'సహాస్',
  nameGujarati: 'સહાસ',
  city: 'Hyderabad',
  state: 'Telangana',
  policeStation: 'Hyderabad City Police Control Room',
  pcr: 'PCR-100',
  version: '1.0.0',
};

export const COLORS = {
  primary: '#CC0000',       // Deep red - emergency
  primaryDark: '#8B0000',
  primaryLight: '#FF4444',
  secondary: '#1A1A2E',     // Deep navy
  secondaryLight: '#16213E',
  accent: '#FFA500',        // Urgent amber
  accentLight: '#FFD700',
  success: '#00C853',
  warning: '#FF6D00',
  white: '#FFFFFF',
  offWhite: '#F8F9FA',
  lightGray: '#E0E0E0',
  darkGray: '#424242',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  cardBg: 'rgba(255,255,255,0.05)',
};

export const LANGUAGES = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
  gu: 'ગુજરાતી',
};

export const STRINGS = {
  en: {
    appTagline: 'Emergency Incident Response',
    captureButton: 'CAPTURE INCIDENT',
    recordingFor: 'Recording for',
    seconds: 'seconds',
    stopRecording: 'Stop & Continue',
    question1: 'Is anyone injured?',
    question2: 'Vehicle Number (if any)',
    question3: 'Number of people involved',
    question4: 'Describe what happened',
    analyzing: 'AI is analyzing the incident...',
    generatingFIR: 'Generating FIR...',
    firReady: 'FIR Ready',
    downloadPDF: 'Download PDF',
    sendEmail: 'Email FIR',
    dispatchHelp: 'Dispatch Emergency Help',
    police: 'Police + FIR',
    ambulance: 'Ambulance',
    fireBrigade: 'Ambulance + Fire',
    calling: 'Connecting...',
    dispatched: 'Help Dispatched!',
    yes: 'Yes',
    no: 'No',
    enterVehicle: 'e.g. TS 09 AB 1234',
    enterDescription: 'Describe the incident in detail...',
    analyzeAI: 'Analyze with AI →',
    location: 'Location',
    dateTime: 'Date & Time',
    firNumber: 'FIR Reference',
    howItWorks: 'How It Works',
    step1: 'Open app, tap Capture',
    step2: 'Record 10-30 sec video',
    step3: 'Answer 4 quick questions',
    step4: 'AI generates FIR instantly',
    step5: 'Dispatch police/ambulance',
  },
  hi: {
    appTagline: 'आपातकालीन घटना प्रतिक्रिया',
    captureButton: 'घटना रिकॉर्ड करें',
    recordingFor: 'रिकॉर्डिंग',
    seconds: 'सेकंड',
    stopRecording: 'रोकें और जारी रखें',
    question1: 'क्या कोई घायल है?',
    question2: 'वाहन नंबर (यदि हो)',
    question3: 'शामिल लोगों की संख्या',
    question4: 'क्या हुआ बताएं',
    analyzing: 'AI घटना का विश्लेषण कर रहा है...',
    generatingFIR: 'FIR बना रहे हैं...',
    firReady: 'FIR तैयार है',
    downloadPDF: 'PDF डाउनलोड करें',
    sendEmail: 'FIR ईमेल करें',
    dispatchHelp: 'आपातकालीन सहायता भेजें',
    police: 'पुलिस + FIR',
    ambulance: 'एम्बुलेंस',
    fireBrigade: 'एम्बुलेंस + अग्निशमन',
    calling: 'जोड़ा जा रहा है...',
    dispatched: 'सहायता भेजी गई!',
    yes: 'हाँ',
    no: 'नहीं',
    enterVehicle: 'जैसे TS 09 AB 1234',
    enterDescription: 'घटना का विवरण दें...',
    analyzeAI: 'AI से विश्लेषण करें →',
  },
  te: {
    appTagline: 'అత్యవసర సంఘటన స్పందన',
    captureButton: 'సంఘటన రికార్డ్ చేయి',
    yes: 'అవును',
    no: 'కాదు',
    analyzing: 'AI సంఘటనను విశ్లేషిస్తోంది...',
    generatingFIR: 'FIR రూపొందిస్తోంది...',
    police: 'పోలీసు + FIR',
    ambulance: 'అంబులెన్స్',
    fireBrigade: 'అంబులెన్స్ + అగ్నిమాపక',
  },
  gu: {
    appTagline: 'અત્યંત આपातकालीन ઘટના',
    captureButton: 'ઘટના રેકોર્ડ કરો',
    yes: 'હા',
    no: 'ના',
    analyzing: 'AI ઘટનાનું વિશ્લેષણ કરી રહ્યું છે...',
    generatingFIR: 'FIR તૈયાર કરી રહ્યા છીએ...',
    police: 'પોલીસ + FIR',
    ambulance: 'એમ્બ્યુલન્સ',
    fireBrigade: 'એમ્બ્યુલન્સ + ફાયર',
  },
};

