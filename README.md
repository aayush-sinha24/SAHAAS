# Sahaas - Emergency Incident Response

Sahaas is a React Native emergency incident reporting prototype that helps a citizen capture incident evidence, collect location and incident context, analyze an incident through SOTE AI, generate a structured FIR-style report, and present emergency-response actions.

## Overview

Sahaas follows this workflow:

Citizen
  |
Incident video capture
  |
GPS + timestamp
  |
Incident questionnaire
  |
SOTE AI analysis
  |
Structured FIR/report generation
  |
Emergency response actions

## Key Features

| Feature | Description |
|---|---|
| Incident video capture | Records incident video using the device camera |
| GPS collection | Captures device location associated with the incident |
| Timestamped evidence | Associates incident evidence with capture time |
| Incident questionnaire | Collects injury, vehicle, participant, and incident-description information |
| SOTE AI analysis | Sends incident information to the configured SOTE AI backend |
| FIR-style report | Generates a structured incident report and PDF |
| Video upload | Uploads evidence using the configured Cloudinary service |
| Emergency actions | Provides configurable police, ambulance, and fire response actions |
| Multi-language UI | Includes English, Hindi, Telugu, and Gujarati strings |
| Local fallback | Provides structured local report generation when remote analysis is unavailable |

## SOTE AI Integration

Sahaas integrates with a separate SOTE AI backend.

Default endpoint:
https://soteai.onrender.com

The frontend integration is implemented in:
src/services/soteService.js

The integration can:

1. Send incident metadata and an available video URL to the configured analysis service.
2. Use the emergency-analysis path when required.
3. Map the SOTE AI response into the Sahaas reporting flow.
4. Use local structured fallback logic when remote analysis is unavailable.

SOTE AI output is intended for prototype decision support and demonstration. It is not an authoritative legal, medical, police, or emergency-service determination.

## Technology Stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native 0.81.5 |
| App platform | Expo SDK 54 |
| Navigation | React Navigation |
| Camera | expo-camera |
| Location | expo-location |
| File handling | expo-file-system |
| Video storage | Cloudinary |
| PDF generation | expo-print |
| PDF sharing | expo-sharing |
| Icons | @expo/vector-icons |
| AI integration | SOTE AI HTTP API |
| Languages | English, Hindi, Telugu, Gujarati |

## Project Structure

SAHAAS/
  App.js
  index.js
  app.json
  babel.config.js
  package.json
  package-lock.json
  START_EXPO.bat
  .env.example
  src/
    components/
      ParticleBackground.js
    constants/
      index.js
    screens/
      HomeScreen.js
      CaptureScreen.js
      QuestionnaireScreen.js
      AnalysisScreen.js
      FIRScreen.js
      DispatchScreen.js
      CallScreen.js
    services/
      emailService.js
      firService.js
      pdfService.js
      smsService.js
      soteService.js
      videoUploadService.js
  assets/

## Getting Started

### Prerequisites

Install Node.js, npm, and Expo Go on an Android or iOS device.

### 1. Clone the repository

git clone https://github.com/aayush-sinha24/SAHAAS.git
cd SAHAAS

### 2. Install dependencies

npm install

### 3. Create local environment configuration

Create .env.local from the example:

Copy-Item .env.example .env.local

Then edit .env.local and enter the values required for your local or demo environment.

### 4. Start Expo

npx expo start

For a physical device on the same Wi-Fi network:

npx expo start --lan

Windows users can also use:
START_EXPO.bat

## Environment Variables

The repository contains .env.example with placeholders.

Required configuration includes:

EXPO_PUBLIC_SOTE_API_URL
EXPO_PUBLIC_SOTE_API_KEY
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
EXPO_PUBLIC_POLICE_PHONE
EXPO_PUBLIC_AMBULANCE_PHONE
EXPO_PUBLIC_FIRE_PHONE
EXPO_PUBLIC_EMAIL_SERVICE_ID
EXPO_PUBLIC_EMAIL_TEMPLATE_ID
EXPO_PUBLIC_EMAIL_PUBLIC_KEY
EXPO_PUBLIC_EMAIL_TO
EXPO_PUBLIC_SMS_API_KEY

## Security

Do not commit .env.local or other credential-containing files.

The .env.local file is ignored by Git.

Important: EXPO_PUBLIC_* values are exposed to the client application. They should therefore not be treated as true server-side secrets. A production deployment should place sensitive credentials behind a protected backend.

## Emergency Actions

The application contains configurable emergency contact values intended for the prototype/demo workflow.

Before real-world deployment, replace demonstration values with authorized services and appropriate emergency integrations.

The project should not be treated as an official emergency-service integration unless separately authorized and integrated with the relevant systems.

## FIR / Report Generation

The report-generation logic is separated into:

src/services/firService.js

The PDF generation logic is implemented in:

src/services/pdfService.js

The generated document is a prototype report. It should not be represented as an officially registered or legally valid FIR without the required police/legal process and authorization.

## Local Fallback

When remote SOTE AI analysis is unavailable, Sahaas can use structured local fallback logic to continue the reporting workflow.

This supports demonstrations and development but does not replace authoritative emergency or legal systems.

## Prototype Limitations

Sahaas is a hackathon/prototype application.

The project demonstrates:

- incident evidence capture
- GPS collection
- timestamped incident data
- AI-assisted incident analysis
- structured report generation
- PDF creation
- emergency-response workflow

The prototype does not guarantee:

- AI accuracy
- official legal validity of generated reports
- official police registration of an FIR
- guaranteed emergency dispatch
- production-grade evidence-chain integrity
- production-scale availability

AI-generated information should be reviewed by an appropriate human authority before operational or legal use.

## Development

The main SOTE AI integration is isolated in:

src/services/soteService.js

The analysis screen uses this service to process incident data.

The reporting and PDF-generation paths remain separate from the AI service so that structured fallback processing can be retained.

## Team

TEAM_LOGIX

Project: Sahaas

## Status

This repository contains the public prototype source code prepared for hackathon demonstration and further development.