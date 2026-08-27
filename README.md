<div align="center">

# 🛡️ Sahaas — साहस
### *Courage to Act. Technology to Help.*

**AI-powered emergency incident response — from witness to FIR in under 60 seconds.**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo)](https://expo.dev)
[![Groq AI](https://img.shields.io/badge/Groq-Llama%203.3%2070B-FF6B35?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Problem Statement

Every minute of delay in emergency response costs lives. In India, citizens witnessing accidents, crimes, or fires struggle to report incidents accurately — no geo-tagged evidence, no structured FIR, and no direct integration with emergency services. Existing solutions (112, PCR vans) rely on verbal reports that are often incomplete, leading to slow dispatch and poor legal follow-through. **Sahaas** solves this by letting any citizen capture geotagged video evidence, auto-generate an AI-powered FIR, and dispatch Police, Ambulance, and Fire Brigade — all in under 60 seconds.

---

## 🎯 Unique Selling Proposition

> **"Sahaas is the only app that turns a citizen's phone into a complete emergency command center — capturing geo-tagged video evidence, generating a legally valid AI-powered FIR, and dispatching Police, Ambulance, or Fire Brigade with a single tap, all in under 60 seconds."**

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📹 **Geo-tagged Video Capture** | Record incident video with live GPS coordinates & timestamp embedded |
| 🤖 **AI Incident Analysis** | Groq Llama 3.3 70B classifies incident type, severity, and generates a forensic summary |
| 📄 **Auto FIR Generation** | Legally formatted First Information Report (PDF) with IPC sections in seconds |
| 🚨 **One-tap Emergency Dispatch** | Simultaneously calls Police (100), Ambulance (108), or Fire Brigade (101) + sends SMS |
| 🔗 **Video Evidence Link** | Uploaded video linked directly inside the FIR PDF for legal documentation |
| 🌐 **Multi-language Support** | Supports English and Hindi (extensible) |
| 📲 **Offline-resilient** | Fallback FIR generation works even without internet |

---

## 🏗️ Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CITIZEN (Phone)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────▼───────────────┐
          │         CAPTURE MODULE         │
          │  expo-camera + expo-location   │
          │  (Video + GPS + Timestamp)     │
          └──────────┬──────────┬─────────┘
                     │          │
          ┌──────────▼──┐  ┌────▼──────────────┐
          │  GoFile.io  │  │  Questionnaire     │
          │Video Storage│  │  Screen            │
          └──────────┬──┘  └────┬──────────────┘
                     │          │
          ┌──────────▼──────────▼──────────────┐
          │        GROQ AI / LLAMA 3.3 70B      │
          │  Incident classification + FIR gen  │
          └─────────────────┬──────────────────┘
                            │
          ┌─────────────────▼──────────────────┐
          │          FIR GENERATOR              │
          │   PDF with GPS + IPC + Video Link   │
          └─────────────────┬──────────────────┘
                            │
          ┌─────────────────▼──────────────────┐
          │         DISPATCH SCREEN             │
          └────┬──────────────┬────────────────┘
               │              │              │
        ┌──────▼──┐   ┌───────▼──┐   ┌──────▼──┐
        │ Police  │   │Ambulance │   │  Fire   │
        │  PCR 100│   │   108    │   │   101   │
        │Call+SMS │   │ Call+SMS │   │Call+SMS │
        └─────────┘   └──────────┘   └─────────┘
```

---

## 📱 App Flow

```
Home Screen
    └─► Capture Screen       (Record geo-tagged video)
            └─► Questionnaire        (Incident type, injuries, vehicle no.)
                    └─► Analysis Screen      (AI processing animation)
                            └─► FIR Screen           (View + Download PDF)
                                    └─► Dispatch Screen   (Call 100 / 108 / 101)
                                            └─► Call Screen   (Dispatch confirmation)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81.5 + Expo SDK 54 |
| **Navigation** | React Navigation v6 (Stack Navigator) |
| **AI / LLM** | Groq API — Llama 3.3 70B Versatile |
| **Camera** | expo-camera |
| **Location** | expo-location (real GPS) |
| **Video Upload** | GoFile.io (free, reliable CDN) |
| **PDF Generation** | expo-print + expo-sharing |
| **SMS Alerts** | Custom SMS service integration |
| **Animations** | React Native Animated API + expo-linear-gradient |
| **Icons** | @expo/vector-icons (Ionicons, MaterialCommunity, FontAwesome5) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- **Expo Go** app installed on your Android/iOS device
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/sahaas.git
cd sahaas

# 2. Install dependencies
npm install

# 3. Add your API keys
# Edit src/constants/index.js and add:
#   GROQ_API_KEY = 'your_groq_api_key_here'

# 4. Start the development server
npx expo start

# 5. Scan the QR code with Expo Go on your phone
```

### Running with Tunnel (for physical devices on different networks)
```bash
npx expo start --tunnel
```

---

## 📦 All Packages & Installation

### Install all dependencies at once
```bash
npm install
```

### Or install individually:

```bash
# Core React Native & Expo
npx expo install expo@~54.0.33
npm install react@19.1.0
npm install react-native@0.81.5

# Navigation
npm install @react-navigation/native@^6.1.18
npm install @react-navigation/stack@^6.4.1
npm install react-native-gesture-handler@~2.28.0
npm install react-native-screens@~4.16.0
npm install react-native-safe-area-context@~5.6.0

# Expo Modules
npx expo install expo-camera@~17.0.10
npx expo install expo-location@~19.0.8
npx expo install expo-av@~16.0.8
npx expo install expo-file-system@~19.0.21
npx expo install expo-image-manipulator@~14.0.8
npx expo install expo-linear-gradient@~15.0.8
npx expo install expo-media-library@~18.2.1
npx expo install expo-print@~15.0.8
npx expo install expo-sensors@~15.0.8
npx expo install expo-sharing@~14.0.8
npx expo install expo-status-bar@~3.0.9

# UI & Icons
npm install @expo/vector-icons@^15.0.3

# Animations
npx expo install react-native-reanimated@~3.17.4
```

### Full `package.json` dependencies reference:
```json
{
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/stack": "^6.4.1",
    "expo": "~54.0.33",
    "expo-av": "~16.0.8",
    "expo-camera": "~17.0.10",
    "expo-file-system": "~19.0.21",
    "expo-image-manipulator": "~14.0.8",
    "expo-linear-gradient": "~15.0.8",
    "expo-location": "~19.0.8",
    "expo-media-library": "~18.2.1",
    "expo-print": "~15.0.8",
    "expo-sensors": "~15.0.8",
    "expo-sharing": "~14.0.8",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~3.17.4",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0"
  }
}
```

---

## 📁 Project Structure

```
sahaas/
├── App.js                          # Root navigator (7 screens)
├── index.js                        # Entry point
├── app.json                        # Expo config
├── package.json
└── src/
    ├── constants/
    │   └── index.js                # API keys, colors, strings, emergency contacts
    ├── screens/
    │   ├── HomeScreen.js           # Landing page with language selection
    │   ├── CaptureScreen.js        # Video recording with live GPS display
    │   ├── QuestionnaireScreen.js  # Incident context form
    │   ├── AnalysisScreen.js       # AI processing + animated steps
    │   ├── FIRScreen.js            # FIR viewer + PDF download + video player
    │   ├── DispatchScreen.js       # Emergency dispatch (Police/Ambulance/Fire)
    │   └── CallScreen.js           # Call confirmation screen
    └── services/
        ├── geminiService.js        # Groq Llama 3.3 AI integration + fallback
        ├── firService.js           # FIR data structure builder
        ├── pdfService.js           # PDF generation (expo-print)
        ├── videoUploadService.js   # GoFile.io video upload
        ├── smsService.js           # Emergency SMS sender
        └── emailService.js        # Email alert service
```

---

## 🤖 AI Analysis Pipeline

The AI pipeline uses **Groq's Llama 3.3 70B** for:

1. **Incident Classification** — Road Accident / Physical Assault / Fire / Medical Emergency / Property Damage
2. **Severity Assessment** — Critical / High / Medium / Low (rules-based, not hallucinated)
3. **FIR Content Generation** — Complainant statement, accused details, applicable IPC sections
4. **Timeline Reconstruction** — Event timeline based on description
5. **Forensic Insights** — AI confidence score + key observations

**Fallback Mode**: If the Groq API is unavailable, the app generates a complete FIR locally using structured fallback logic — no data is lost.

---

## 📄 FIR Document Contents

Each auto-generated FIR includes:

- ✅ FIR Reference Number (e.g., `SAH-HYD-2026-XXXXXX`)
- ✅ Telangana State Police header
- ✅ Incident location (address + GPS coordinates)
- ✅ Date & time
- ✅ Severity level & incident type
- ✅ AI confidence score
- ✅ Complainant statement
- ✅ Accused details (if available)
- ✅ Evidence list (geo-tagged video, GPS, timestamp)
- ✅ Applicable IPC sections
- ✅ Clickable video evidence link
- ✅ AI forensic analysis
- ✅ Responding officer fields

---

## 🚨 Emergency Dispatch

Each dispatch tap simultaneously:
1. **Places a real phone call** (via `Linking.openURL('tel:...')`)
2. **Sends an SMS alert** with FIR reference number + GPS location
3. **Navigates to Call Confirmation screen**

| Service | Number | Action |
|---|---|---|
| 🚓 Police + FIR | PCR 100 | Call + SMS + Show FIR |
| 🚑 Ambulance | 108 EMS | Call + Location SMS |
| 🚒 Fire Brigade + Ambulance | 101 + 108 | Call both + SMS |

---

## 🔐 Environment Variables

Create/edit `src/constants/index.js` and set:

```js
export const GROQ_API_KEY = 'your_groq_api_key';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL   = 'llama-3.3-70b-versatile';
```

> ⚠️ **Never commit your API keys to a public repo.** Use environment variables or a `.env` file with `expo-constants` in production.

---

## 🏆 Hackathon Context

Sahaas was built during a **5-hour hackathon** to solve the real problem of delayed emergency response in India. The app is fully functional — it records real video, calls real emergency numbers, sends real SMS alerts, and generates real PDF FIRs.

**Impact metrics:**
- 🕐 Time to FIR: **90 minutes → under 60 seconds**
- 📋 Evidence quality: **Verbal → Geo-tagged HD video + AI forensic summary**
- 📞 Dispatch speed: **Parallel calls + SMS in one tap**

---

## 👥 Team

> Built with ❤️ and too much coffee.

| Role | Name |
|---|---|
| Developer | Aayush |
| Developer | Aashish |
| Developer | Sabbir |
| Developer | Rudraksh |
| Developer | Shreyas |
| Developer | Darishma |

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Sahaas — साहस**
*When seconds matter, every tap counts.*

</div>
