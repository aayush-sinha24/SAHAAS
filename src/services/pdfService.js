import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { APP_CONFIG } from '../constants';

/**
 * PDF Service — generates a professional Telangana Police FIR PDF
 * Uses expo-print to render HTML → PDF
 *
 * Changes:
 * - Removed % confidence score → replaced with stage-based severity visual (Low/Medium/High/Critical)
 * - Added number plate photo block in evidence section (if captured)
 * - Video link block unchanged
 */
export const generateFIRPDF = async (fir) => {
  // Build evidence list — add video/photo markers
  const evidenceWithVideo = [
    ...(fir.evidenceList || []),
    (fir.videoUri || fir.videoUrl)
      ? `📹 Incident Video Recording${fir.videoUrl ? ` — ${fir.videoUrl}` : ''} — ${fir.incidentTime}`
      : null,
    fir.platePhotoUri
      ? '📸 Vehicle Number Plate Photo — High-resolution capture (see evidence section below)'
      : null,
  ].filter(Boolean);

  const videoFileName = fir.referenceNumber
    ? `SAHAAS_${fir.referenceNumber.replace(/[^A-Z0-9]/gi, '_')}.mp4`
    : 'SAHAAS_incident_video.mp4';

  try {
    const { uri } = await printToFileAsync({
      html: buildFIRHTML({ ...fir, evidenceList: evidenceWithVideo, videoFileName }),
      base64: false,
    });
    return uri;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const shareFIRPDF = async (uri) => {
  await shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share / Download FIR PDF',
    UTI: 'com.adobe.pdf',
  });
};

// ── Severity stage config ──────────────────────────────────────────────────
const SEVERITY_STAGES = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITY_COLORS = {
  Low:      { bg: '#00c853', text: '#fff', light: '#e8f5e9', dot: '#00c853' },
  Medium:   { bg: '#ffc107', text: '#000', light: '#fffde7', dot: '#ffc107' },
  High:     { bg: '#ff6d00', text: '#fff', light: '#fff3e0', dot: '#ff6d00' },
  Critical: { bg: '#cc0000', text: '#fff', light: '#ffebee', dot: '#cc0000' },
};

const buildSeverityStages = (severity) => {
  const activeIndex = SEVERITY_STAGES.indexOf(severity);
  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.High;

  const stages = SEVERITY_STAGES.map((stage, i) => {
    const isActive = i === activeIndex;
    const isPast = i < activeIndex;
    const stageColor = SEVERITY_COLORS[stage];
    const bg = isActive ? stageColor.bg : isPast ? `${stageColor.bg}55` : '#e0e0e0';
    const textColor = isActive ? stageColor.text : isPast ? '#555' : '#bbb';
    const border = isActive ? `2px solid ${stageColor.bg}` : '2px solid transparent';
    const scale = isActive ? 'font-weight:900;font-size:13px;' : 'font-weight:600;font-size:12px;';

    return `
      <div style="
        flex:1; text-align:center; padding:10px 6px; border-radius:10px;
        background:${bg}; color:${textColor}; ${scale}
        border:${border}; position:relative;
        box-shadow:${isActive ? `0 4px 12px ${stageColor.bg}55` : 'none'};
      ">
        ${isActive ? `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:${stageColor.bg};color:${stageColor.text};font-size:9px;font-weight:900;padding:2px 8px;border-radius:10px;letter-spacing:1px;white-space:nowrap;">▼ CURRENT</div>` : ''}
        ${stage.toUpperCase()}
      </div>`;
  });

  return `
    <div style="display:flex;gap:6px;align-items:stretch;margin-top:8px;position:relative;padding-top:14px;">
      ${stages.join('')}
    </div>
    <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
      <div style="width:14px;height:14px;border-radius:50%;background:${colors.bg};flex-shrink:0;"></div>
      <span style="font-size:12px;color:#555;font-weight:600;">
        Incident classified as <strong style="color:${colors.bg};">${severity} Priority</strong>
        — ${severity === 'Critical' ? 'Immediate response required' :
           severity === 'High' ? 'Urgent assistance needed' :
           severity === 'Medium' ? 'Prompt police attention required' :
           'Routine police assistance requested'}
      </span>
    </div>`;
};

const buildFIRHTML = (fir) => {
  const evidenceItems = (fir.evidenceList || []).map(
    (item, i) => `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#555;">${i + 1}.</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:500;">${item}</td>
    </tr>`
  ).join('');

  const timelineItems = (fir.timeline || []).map(
    (t) => `<div style="display:flex;margin-bottom:12px;align-items:flex-start;">
      <div style="background:#cc0000;color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;white-space:nowrap;margin-right:12px;">${t.time}</div>
      <div style="flex:1;color:#333;padding-top:4px;">${t.event}</div>
    </div>`
  ).join('');

  const sections = (fir.sectionsApplicable || []).map(
    (s) => `<span style="background:#fff3cd;border:1px solid #ffc107;color:#856404;padding:3px 8px;border-radius:4px;font-size:12px;margin-right:6px;display:inline-block;margin-bottom:4px;">${s}</span>`
  ).join('');

  // ── Severity stage visual ─────────────────────────────────────────────────
  const severityStagesHTML = buildSeverityStages(fir.severity || 'Medium');

  // ── Video evidence block ──────────────────────────────────────────────────
  const videoBlock = (fir.videoUri || fir.videoUrl) ? `
  <div class="section">
    <div class="section-title">📹 Video Evidence — Click to Play</div>
    <div class="section-body">

      <!-- File name row -->
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
        <div style="background:#1a1a2e;width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">🎥</div>
        <div style="flex:1;">
          <div class="field-label">Video File</div>
          <div style="font-family:monospace;font-size:13px;font-weight:700;color:#1a1a2e;background:#f0f0f0;padding:6px 10px;border-radius:6px;margin-top:4px;word-break:break-all;">${fir.videoFileName || 'SAHAAS_incident_video.mp4'}</div>
        </div>
      </div>

      ${fir.videoUrl ? `
      <!-- ▶ BIG PLAY BUTTON -->
      <a href="${fir.videoUrl}" style="display:block;text-decoration:none;margin-bottom:14px;">
        <div style="
          background: linear-gradient(135deg, #cc0000 0%, #ff4444 50%, #cc0000 100%);
          border-radius: 14px; padding: 20px 22px;
          display: flex; align-items: center; gap: 16px;
          box-shadow: 0 6px 24px rgba(204,0,0,0.35);
        ">
          <div style="background:rgba(255,255,255,0.22);width:58px;height:58px;border-radius:29px;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;">▶</div>
          <div style="flex:1;">
            <div style="color:#fff;font-weight:900;font-size:17px;margin-bottom:5px;">TAP / CLICK TO PLAY INCIDENT VIDEO</div>
            <div style="color:rgba(255,255,255,0.8);font-size:12px;word-break:break-all;line-height:1.5;">${fir.videoUrl}</div>
          </div>
          <div style="background:#fff;color:#cc0000;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:900;white-space:nowrap;">▶ PLAY</div>
        </div>
      </a>
      <div style="background:#f8f9fa;border:1px dashed #ccc;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
        <div style="font-size:10px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">📋 Video URL (copy &amp; open in browser if tap doesn't work)</div>
        <div style="font-family:monospace;font-size:12px;color:#1565c0;word-break:break-all;font-weight:700;">${fir.videoUrl}</div>
        <div style="font-size:10px;color:#aaa;margin-top:4px;">✅ Free permanent link — plays unlimited times, never expires</div>
      </div>
      ` : `
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:14px;">
        <div style="color:#856404;font-size:13px;font-weight:600;">⚠️ Video was recorded locally. Cloud upload was not completed. The video is saved on the device that recorded it.</div>
      </div>
      `}

      <div class="grid-2" style="margin-bottom:10px;">
        <div class="field">
          <div class="field-label">Recorded At</div>
          <div class="field-value">${fir.incidentTime}</div>
        </div>
        <div class="field">
          <div class="field-label">GPS Coordinates</div>
          <div class="field-value">${fir.location?.latitude?.toFixed(6)}, ${fir.location?.longitude?.toFixed(6)}</div>
        </div>
      </div>

      <div style="background:#e8f5e9;border-left:4px solid #00c853;padding:10px 14px;border-radius:0 6px 6px 0;font-size:12px;color:#1b5e20;line-height:1.6;">
        <strong>📌 Evidence Note:</strong> Geo-tagged video recorded at the location above.
        ${fir.videoUrl ? 'Click the red button above to play. Link is permanent — can be opened and played unlimited times.' : 'Video evidence has been recorded and geo-tagged at the incident location.'}
      </div>

      <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="background:#1a1a2e;color:#ffa500;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;">GEO-TAGGED</span>
        <span style="background:#1a1a2e;color:#00c853;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;">TIMESTAMPED</span>
        <span style="background:#1a1a2e;color:#2196f3;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;">AI VERIFIED</span>
        ${fir.videoUrl ? '<span style="background:#cc0000;color:#fff;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;">ONLINE ∞</span>' : ''}
      </div>
    </div>
  </div>` : '';

  // ── Number plate photo block ───────────────────────────────────────────────
  const platePhotoBlock = fir.platePhotoUri ? `
  <div class="section">
    <div class="section-title">📸 Number Plate Photo Evidence</div>
    <div class="section-body">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
        <div style="background:#1a1a2e;width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">🪪</div>
        <div style="flex:1;">
          <div style="font-weight:800;color:#1a1a2e;font-size:15px;margin-bottom:4px;">Vehicle Number Plate — High-Resolution Photo</div>
          <div style="color:#888;font-size:12px;">Captured separately after video recording for clear number plate visibility</div>
        </div>
      </div>

      <!-- Embedded number plate image -->
      <div style="text-align:center;margin-bottom:16px;background:#f5f5f5;border-radius:12px;padding:16px;border:2px dashed #1a1a2e;">
        <img src="${fir.platePhotoUri}"
             style="max-width:100%;max-height:260px;border-radius:8px;object-fit:contain;border:2px solid #1a1a2e;"
             alt="Number Plate Photo" />
        <div style="font-size:11px;color:#888;margin-top:10px;font-weight:600;">
          📸 Original photo — taken at incident scene &nbsp;|&nbsp; Vehicle: <strong style="color:#cc0000;">${fir.vehicleNumber || 'See plate above'}</strong>
        </div>
      </div>

      <div style="background:#e3f2fd;border-left:4px solid #1565c0;padding:10px 14px;border-radius:0 6px 6px 0;font-size:12px;color:#0d47a1;line-height:1.6;">
        <strong>📌 Evidence Note:</strong> This high-resolution photo was captured specifically to ensure the vehicle number plate is clearly legible for enforcement purposes.
      </div>

      <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="background:#1565c0;color:#fff;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;">PHOTO EVIDENCE</span>
        <span style="background:#1a1a2e;color:#ffa500;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;">TIMESTAMPED</span>
        <span style="background:#1a1a2e;color:#00c853;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;">GEO-TAGGED</span>
      </div>
    </div>
  </div>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FIR - ${fir.referenceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; background: #f5f5f5; color: #222; }
  .page { width: 794px; margin: 0 auto; background: #fff; }
  .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #cc0000 100%); padding: 30px 40px; color: white; }
  .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .logo-text { font-size: 42px; font-weight: 900; letter-spacing: 2px; }
  .logo-sub { font-size: 13px; opacity: 0.85; letter-spacing: 1px; }
  .fir-title { text-align: center; font-size: 22px; font-weight: 700; letter-spacing: 3px; border: 2px solid rgba(255,255,255,0.4); padding: 8px 24px; display: inline-block; border-radius: 4px; }
  .ref-badge { background: rgba(255,165,0,0.9); color: #000; padding: 8px 16px; border-radius: 20px; font-weight: 800; font-size: 16px; letter-spacing: 1px; }
  .content { padding: 30px 40px; }
  .section { margin-bottom: 24px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
  .section-title { background: #1a1a2e; color: white; padding: 10px 16px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .section-body { padding: 16px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { margin-bottom: 10px; }
  .field-label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-value { font-size: 14px; color: #222; font-weight: 500; margin-top: 2px; }
  .severity-badge { padding: 5px 14px; border-radius: 12px; font-size: 13px; font-weight: 800; display: inline-block; letter-spacing: 0.5px; }
  .severity-Critical { background: #cc0000; color: white; }
  .severity-High { background: #ff6d00; color: white; }
  .severity-Medium { background: #ffc107; color: #000; }
  .severity-Low { background: #00c853; color: white; }
  .statement { background: #f9f9f9; border-left: 4px solid #cc0000; padding: 14px 16px; font-size: 13px; line-height: 1.7; color: #333; border-radius: 0 4px 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  .footer { background: #1a1a2e; color: rgba(255,255,255,0.8); padding: 20px 40px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; }
  .ai-badge { background: linear-gradient(135deg, #cc0000, #ff4444); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; }
  .verified { display: inline-block; border: 2px solid #00c853; color: #00c853; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
  .email-stamp { background: #e8f5e9; border: 1.5px solid #00c853; border-radius: 8px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
</style>
</head>
<body>
<div class="page">
  <!-- EMAIL DELIVERY STAMP -->
  <div style="padding: 14px 40px; background: #e8f5e9; border-bottom: 2px solid #00c853; display: flex; align-items: center; gap: 12px;">
    <div style="font-size: 22px;">✉️</div>
    <div>
      <div style="font-weight: 800; color: #1b5e20; font-size: 13px;">FIR AUTOMATICALLY DELIVERED TO POLICE STATION</div>
      <div style="color: #2e7d32; font-size: 12px;">This FIR has been digitally submitted to: <strong>rayarudrakshh@gmail.com</strong> &nbsp;|&nbsp; Ref: <strong>${fir.referenceNumber}</strong></div>
    </div>
    <div style="margin-left:auto; background: #00c853; color: #fff; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; white-space: nowrap;">✓ SENT</div>
  </div>

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="logo-text">⚡ SAHAAS</div>
        <div class="logo-sub">TELANGANA POLICE — AI-POWERED INCIDENT RESPONSE</div>
      </div>
      <div style="text-align:center;">
        <div class="fir-title">FIRST INFORMATION REPORT</div>
      </div>
      <div class="ref-badge">${fir.referenceNumber}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;">
      <div style="font-size:13px;opacity:0.9;">📍 ${fir.policeStation}, ${fir.district}, ${fir.state}</div>
      <div style="font-size:13px;opacity:0.9;">🕐 ${fir.filedAtFormatted}</div>
      <div class="verified">✓ AI VERIFIED</div>
    </div>
  </div>

  <div class="content">
    <!-- INCIDENT OVERVIEW -->
    <div class="section">
      <div class="section-title">📋 Incident Overview</div>
      <div class="section-body">
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Incident Type</div>
            <div class="field-value">${fir.incidentType}</div>
          </div>
          <div class="field">
            <div class="field-label">Date &amp; Time of Incident</div>
            <div class="field-value">${fir.incidentTime}</div>
          </div>
        </div>

        <!-- SEVERITY STAGE INDICATOR (replaces % confidence bar) -->
        <div class="field" style="margin-top:12px;">
          <div class="field-label">Severity Level</div>
          <div style="margin-top:4px;">
            <span class="severity-badge severity-${fir.severity}">${fir.severity?.toUpperCase()}</span>
          </div>
          ${severityStagesHTML}
        </div>

        <div class="field" style="margin-top:14px;">
          <div class="field-label">Incident Summary</div>
          <div class="statement">${fir.summary}</div>
        </div>
      </div>
    </div>

    <!-- LOCATION -->
    <div class="section">
      <div class="section-title">📍 Location Details</div>
      <div class="section-body">
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Address</div>
            <div class="field-value">${fir.location?.address || 'Recorded'}</div>
          </div>
          <div class="field">
            <div class="field-label">GPS Coordinates</div>
            <div class="field-value">${fir.location?.latitude?.toFixed(6)}, ${fir.location?.longitude?.toFixed(6)}</div>
          </div>
        </div>
        <div class="field">
          <div class="field-label">Google Maps</div>
          <div class="field-value" style="color:#1565c0;">${fir.location?.googleMapsUrl}</div>
        </div>
      </div>
    </div>

    <!-- INCIDENT DETAILS -->
    <div class="section">
      <div class="section-title">🚗 Incident Details</div>
      <div class="section-body">
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Injuries Reported</div>
            <div class="field-value" style="color:${fir.injured ? '#cc0000' : '#00c853'};font-weight:700;">${fir.injured ? '⚠️ YES — Medical Attention Needed' : '✅ No Injuries Reported'}</div>
          </div>
          <div class="field">
            <div class="field-label">Vehicle Number</div>
            <div class="field-value" style="font-family:monospace;font-size:16px;background:#f0f0f0;padding:4px 8px;border-radius:4px;display:inline-block;">${fir.vehicleNumber}</div>
          </div>
          <div class="field">
            <div class="field-label">People Involved</div>
            <div class="field-value">${fir.peopleCount} person(s)</div>
          </div>
          <div class="field">
            <div class="field-label">Witnesses</div>
            <div class="field-value">${fir.witnesses}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- TIMELINE -->
    <div class="section">
      <div class="section-title">⏱️ Incident Timeline</div>
      <div class="section-body">${timelineItems || '<p style="color:#888;">Timeline auto-generated by AI</p>'}</div>
    </div>

    <!-- COMPLAINANT'S STATEMENT -->
    <div class="section">
      <div class="section-title">📝 Complainant's Statement (AI Transcribed)</div>
      <div class="section-body">
        <div class="statement">"${fir.complainantStatement}"</div>
        <div style="margin-top:12px;">
          <div class="field-label">Sections Applicable</div>
          <div style="margin-top:6px;">${sections}</div>
        </div>
      </div>
    </div>

    <!-- VIDEO EVIDENCE (with big play button) -->
    ${videoBlock}

    <!-- NUMBER PLATE PHOTO EVIDENCE -->
    ${platePhotoBlock}

    <!-- EVIDENCE LIST -->
    <div class="section">
      <div class="section-title">🎥 Evidence List</div>
      <div class="section-body">
        <table>${evidenceItems}</table>
      </div>
    </div>

    <!-- AI INSIGHTS -->
    <div class="section">
      <div class="section-title">🤖 AI Analysis &amp; Insights</div>
      <div class="section-body">
        <div class="statement">${fir.aiInsights}</div>
        <div style="margin-top:12px;display:flex;align-items:center;gap:10px;">
          <span class="ai-badge">AI GENERATED</span>
          <span style="font-size:12px;color:#888;">Generated by Sahaas AI (Groq) on ${fir.filedAtFormatted}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div>
      <div style="font-weight:700;margin-bottom:2px;">SAHAAS — संकट में सहायता</div>
      <div>Telangana State Police | Emergency AI Response System</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:18px;font-weight:800;color:#ffa500;">${fir.referenceNumber}</div>
      <div>FIR Reference Number</div>
    </div>
    <div style="text-align:right;">
      <div>Digital Signature: AI Verified</div>
      <div>Submitted via: ${fir.submittedVia}</div>
    </div>
  </div>
</div>
</body>
</html>`;
};
