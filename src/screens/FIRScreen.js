import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    ScrollView, Animated, Alert, ActivityIndicator, Platform, Linking, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, STRINGS, APP_CONFIG } from '../constants';
import { generateFIRPDF, shareFIRPDF } from '../services/pdfService';
import ParticleBackground from '../components/ParticleBackground';

// ── Section header helper ──────────────────────────────────────────────────
function SectionTitle({ icon, title, color = '#666' }) {
    return (
        <View style={sectionStyles.row}>
            <LinearGradient colors={[`${color}18`, `${color}08`]} style={sectionStyles.iconWrap}>
                <Ionicons name={icon} size={13} color={color} />
            </LinearGradient>
            <Text style={sectionStyles.title}>{title}</Text>
        </View>
    );
}
const sectionStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    iconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    title: { color: '#2A2A2A', fontSize: 13, fontWeight: '800', flex: 1, letterSpacing: 0.3 },
});

// ── Detail row helper ──────────────────────────────────────────────────────
function DetailRow({ icon, label, value, valueColor, mono }) {
    return (
        <View style={drStyles.row}>
            <View style={drStyles.icon}>
                <Ionicons name={icon} size={12} color={COLORS.primary} />
            </View>
            <View style={drStyles.content}>
                <Text style={drStyles.label}>{label}</Text>
                <Text style={[drStyles.value, valueColor && { color: valueColor }, mono && drStyles.mono]}>
                    {value || '—'}
                </Text>
            </View>
        </View>
    );
}
const drStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 13 },
    icon: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(204,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    content: { flex: 1 },
    label: { fontSize: 9.5, color: '#C0C0C0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
    value: { fontSize: 14, color: '#1A1A1A', fontWeight: '500', marginTop: 2 },
    mono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, fontWeight: '800', backgroundColor: '#F5F5F5', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, alignSelf: 'flex-start' },
});

// ── Stage-based severity visual ────────────────────────────────────────────
const STAGES = ['Low', 'Medium', 'High', 'Critical'];
const STAGE_META = {
    Low:      { color: '#2E7D32', bg: 'rgba(46,125,50,0.09)',  border: 'rgba(46,125,50,0.25)',  icon: 'checkmark-circle',   desc: 'Routine police assistance' },
    Medium:   { color: '#F57F17', bg: 'rgba(245,127,23,0.09)', border: 'rgba(245,127,23,0.25)', icon: 'information-circle', desc: 'Prompt attention required' },
    High:     { color: '#E65100', bg: 'rgba(230,81,0,0.09)',   border: 'rgba(230,81,0,0.25)',   icon: 'warning',            desc: 'Urgent assistance needed' },
    Critical: { color: '#CC0000', bg: 'rgba(204,0,0,0.09)',    border: 'rgba(204,0,0,0.25)',    icon: 'alert-circle',       desc: 'Immediate response required' },
};

function SeverityStages({ severity, pulseAnim }) {
    const meta = STAGE_META[severity] || STAGE_META.High;
    const activeIndex = STAGES.indexOf(severity);

    return (
        <Animated.View style={[styles.severityContainer, { transform: [{ scale: pulseAnim }] }]}>
            {/* Current severity badge */}
            <View style={[styles.severityBadgeRow, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                <View style={[styles.severityIconWrap, { backgroundColor: `${meta.color}15` }]}>
                    <Ionicons name={meta.icon} size={17} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.severityLabel, { color: meta.color }]}>
                        {severity?.toUpperCase()} PRIORITY
                    </Text>
                    <Text style={styles.severityDesc}>{meta.desc}</Text>
                </View>
                <View style={[styles.stageNumBadge, { backgroundColor: meta.color }]}>
                    <Text style={styles.stageNumText}>
                        {activeIndex + 1}/{STAGES.length}
                    </Text>
                </View>
            </View>

            {/* Stage progress bar */}
            <View style={styles.stagesRow}>
                {STAGES.map((stage, i) => {
                    const sm = STAGE_META[stage];
                    const isActive = i === activeIndex;
                    const isPast = i < activeIndex;
                    return (
                        <View key={stage} style={styles.stageItem}>
                            <View style={[styles.stageDot, {
                                backgroundColor: isActive ? sm.color : isPast ? `${sm.color}55` : '#E8E8E8',
                                width: isActive ? 12 : 8,
                                height: isActive ? 12 : 8,
                                borderRadius: isActive ? 6 : 4,
                                borderWidth: isActive ? 2 : 0,
                                borderColor: isActive ? `${sm.color}55` : 'transparent',
                            }]} />
                            <View style={[styles.stageBar, {
                                backgroundColor: isActive ? sm.color : isPast ? `${sm.color}40` : '#F0F0F0',
                                height: isActive ? 6 : 4,
                            }]} />
                            <Text style={[styles.stageLabel, {
                                color: isActive ? sm.color : isPast ? '#888' : '#CCCCCC',
                                fontWeight: isActive ? '800' : '500',
                            }]}>
                                {stage}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

// ── Static "FIR Submitted" stamp (purely cosmetic — no email sent) ──────────
function FIRSubmittedStamp({ refNumber }) {
    return (
        <View style={styles.submittedStamp}>
            <LinearGradient
                colors={['rgba(46,125,50,0.07)', 'rgba(46,125,50,0.03)']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.submittedIconWrap}>
                <Ionicons name="shield-checkmark" size={18} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.submittedTitle}>FIR Submitted to Hyderabad Police</Text>
                <Text style={styles.submittedSub}>
                    Reference: <Text style={{ fontWeight: '800', color: '#2E7D32' }}>{refNumber}</Text>
                    {'  •  '}Telangana State Police
                </Text>
            </View>
            <View style={styles.submittedBadge}>
                <Text style={styles.submittedBadgeText}>✓ FILED</Text>
            </View>
        </View>
    );
}

export default function FIRScreen({ navigation, route }) {
    const { language, fir } = route.params || {};
    const t = STRINGS[language] || STRINGS.en;

    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfUri, setPdfUri] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(38)).current;
    const headerScale = useRef(new Animated.Value(0.94)).current;
    const severityPulse = useRef(new Animated.Value(1)).current;
    const stamperAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 650, useNativeDriver: true }),
            Animated.spring(headerScale, { toValue: 1, tension: 44, friction: 7, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
            Animated.spring(stamperAnim, { toValue: 1, tension: 48, friction: 5, useNativeDriver: true }).start();
        }, 500);

        if (fir?.severity === 'Critical') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(severityPulse, { toValue: 1.02, duration: 800, useNativeDriver: true }),
                    Animated.timing(severityPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        }
    }, []);

    const handleWatchVideo = async () => {
        const url = fir?.videoUrl || fir?.videoUri;
        if (!url) {
            Alert.alert('No Video', 'No video evidence available for this incident.');
            return;
        }
        try {
            await Linking.openURL(url);
        } catch (e) {
            Alert.alert('Error', 'Could not open the video. Please try again.\n' + e.message);
        }
    };

    const handleGeneratePDF = async () => {
        setPdfLoading(true);
        try {
            const uri = pdfUri || await generateFIRPDF(fir);
            if (!pdfUri) setPdfUri(uri);
            await shareFIRPDF(uri);
        } catch (e) {
            Alert.alert('PDF Error', 'Could not generate PDF. Please try again.\n' + e.message);
        } finally {
            setPdfLoading(false);
        }
    };

    const hasVideo = !!(fir?.videoUri || fir?.videoUrl);
    const hasPlatePhoto = !!fir?.platePhotoUri;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
            <ParticleBackground intensity={0.5} />

            {/* ── Header ── */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: headerScale }] }]}>
                <View style={styles.headerLeft}>
                    <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={styles.headerIcon}>
                        <FontAwesome5 name="file-alt" size={17} color="#fff" />
                    </LinearGradient>
                    <View>
                        <Text style={styles.headerTitle}>{t.firReady || 'FIR Ready'}</Text>
                        <Text style={styles.headerSub}>AI Generated Report</Text>
                    </View>
                </View>
                <View style={styles.refBadge}>
                    <Text style={styles.refLabel}>REF NO.</Text>
                    <Text style={styles.refNum}>{fir?.referenceNumber || 'HYD-XXXXXX'}</Text>
                </View>
            </Animated.View>

            <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Static FIR Submitted Stamp (no email — purely cosmetic) ── */}
                    <FIRSubmittedStamp refNumber={fir?.referenceNumber} />

                    {/* ── Stage-based Severity ── */}
                    <SeverityStages severity={fir?.severity} pulseAnim={severityPulse} />

                    {/* ── Official FIR Document Card ── */}
                    <Animated.View style={[styles.firCard, { transform: [{ scale: stamperAnim }] }]}>
                        {/* Official header */}
                        <LinearGradient colors={['#1C1C2E', '#111122']} style={styles.firCardHeader}>
                            <View style={styles.firEmblem}>
                                <FontAwesome5 name="shield-alt" size={19} color={COLORS.accent} />
                            </View>
                            <Text style={styles.firOffTitle}>TELANGANA STATE POLICE</Text>
                            <Text style={styles.firOffSub}>FIRST INFORMATION REPORT</Text>
                            <View style={styles.firRefRow}>
                                <Text style={styles.firRefNum}>{fir?.referenceNumber}</Text>
                            </View>
                        </LinearGradient>

                        {/* Details */}
                        <View style={styles.firBody}>
                            <DetailRow icon="location" label="Location" value={fir?.location?.address} />
                            <DetailRow icon="time" label="Date & Time" value={fir?.incidentTime} />
                            <DetailRow icon="people" label="People Involved" value={`${fir?.peopleCount} person(s)`} />
                            <DetailRow
                                icon="warning"
                                label="Injuries"
                                value={fir?.injured ? '⚠️ Injuries Reported' : '✅ None Reported'}
                                valueColor={fir?.injured ? '#E65100' : '#2E7D32'}
                            />
                            {fir?.vehicleNumber && fir.vehicleNumber !== 'Not provided' && (
                                <DetailRow icon="car" label="Vehicle" value={fir.vehicleNumber} mono />
                            )}
                            <DetailRow icon="business" label="Police Station" value={fir?.policeStation} />
                        </View>

                        {/* Summary */}
                        <View style={styles.firSection}>
                            <SectionTitle icon="document-text" title="Incident Summary" color={COLORS.primary} />
                            <Text style={styles.summaryText}>{fir?.summary}</Text>
                        </View>

                        {/* Timeline */}
                        {fir?.timeline?.length > 0 && (
                            <View style={styles.firSection}>
                                <SectionTitle icon="time" title="Timeline" color="#1565C0" />
                                {fir.timeline.map((item, i) => (
                                    <View key={i} style={styles.timelineRow}>
                                        <View style={styles.timelineChain}>
                                            <View style={styles.timelineDot} />
                                            {i < fir.timeline.length - 1 && <View style={styles.timelineLine} />}
                                        </View>
                                        <View style={styles.timeBadge}>
                                            <Text style={styles.timeText}>{item.time}</Text>
                                        </View>
                                        <Text style={styles.timelineEvent}>{item.event}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Evidence List */}
                        {fir?.evidenceList?.length > 0 && (
                            <View style={styles.firSection}>
                                <SectionTitle icon="albums" title="Evidence List" color="#6A0DAD" />
                                {fir.evidenceList.map((item, i) => (
                                    <View key={i} style={styles.evidenceRow}>
                                        <View style={styles.evidenceNum}>
                                            <Text style={styles.evidenceNumText}>{i + 1}</Text>
                                        </View>
                                        <Text style={styles.evidenceText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* IPC Sections */}
                        {fir?.sectionsApplicable?.length > 0 && (
                            <View style={styles.firSection}>
                                <SectionTitle icon="library" title="Sections Applicable" color="#E65100" />
                                <View style={styles.sectionsRow}>
                                    {fir.sectionsApplicable.map((s, i) => (
                                        <View key={i} style={styles.sectionChip}>
                                            <Text style={styles.sectionChipText}>{s}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* AI Insights */}
                        <View style={[styles.firSection, styles.aiSection]}>
                            <SectionTitle icon="analytics" title="AI Analysis" color="#6A0DAD" />
                            <Text style={styles.aiInsight}>{fir?.aiInsights}</Text>
                            <View style={styles.aiFooter}>
                                <MaterialCommunityIcons name="brain" size={11} color="#CCCCCC" />
                                <Text style={styles.aiFooterText}>SOTE AI  •  {fir?.filedAtFormatted}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* ── Number Plate Photo (if captured) ── */}
                    {hasPlatePhoto && (
                        <View style={styles.platePhotoSection}>
                            <View style={styles.platePhotoHeader}>
                                <LinearGradient colors={['#1e88e5', '#1565c0']} style={styles.platePhotoHeaderIcon}>
                                    <Ionicons name="camera" size={13} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.platePhotoTitle}>📸 Number Plate Photo Evidence</Text>
                            </View>
                            <View style={styles.platePhotoContent}>
                                <Image
                                    source={{ uri: fir.platePhotoUri }}
                                    style={styles.platePhotoImg}
                                    resizeMode="contain"
                                />
                                <View style={styles.platePhotoBadgeRow}>
                                    {['PHOTO EVIDENCE', 'TIMESTAMPED', 'GEO-TAGGED'].map(tag => (
                                        <View key={tag} style={[styles.videoTag,
                                            tag === 'PHOTO EVIDENCE' && { backgroundColor: 'rgba(21,101,192,0.07)', borderColor: 'rgba(21,101,192,0.18)' }
                                        ]}>
                                            <Text style={[styles.videoTagText, tag === 'PHOTO EVIDENCE' && { color: '#1565c0' }]}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                                <Text style={styles.platePhotoNote}>
                                    Vehicle: <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{fir.vehicleNumber}</Text>
                                    {' '}— Captured at incident scene for clear plate visibility
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ── Video Evidence Section ── */}
                    {hasVideo ? (
                        <View style={styles.videoSection}>
                            <View style={styles.videoSectionHeader}>
                                <LinearGradient colors={['#FF5F5F', '#CC0000']} style={styles.videoHeaderIcon}>
                                    <Ionicons name="videocam" size={13} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.videoSectionTitle}>📹 Video Evidence</Text>
                                <View style={styles.recBadge}>
                                    <View style={styles.recDot} />
                                    <Text style={styles.recLabel}>RECORDED</Text>
                                </View>
                            </View>
                            <View style={styles.videoInfoRow}>
                                <View style={styles.videoInfoIcon}>
                                    <Ionicons name="film" size={22} color={COLORS.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.videoInfoTitle}>Incident Video Recording</Text>
                                    <Text style={styles.videoInfoSub} numberOfLines={1}>🔒 Geo-tagged  •  {fir?.incidentTime}</Text>
                                    <Text style={styles.videoInfoSub} numberOfLines={1}>📍 {fir?.location?.address?.slice(0, 44) || 'Location recorded'}</Text>
                                    {fir?.videoUrl ? <Text style={styles.videoUrlText} numberOfLines={1}>{fir.videoUrl}</Text> : null}
                                </View>
                            </View>
                            <View style={styles.videoTagsRow}>
                                {['GEO-TAGGED', 'TIMESTAMPED', 'AI VERIFIED'].map(tag => (
                                    <View key={tag} style={styles.videoTag}>
                                        <Text style={styles.videoTagText}>{tag}</Text>
                                    </View>
                                ))}
                                {fir?.videoUrl && (
                                    <View style={[styles.videoTag, styles.videoTagOnline]}>
                                        <Text style={[styles.videoTagText, { color: '#2E7D32' }]}>ONLINE</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity style={styles.watchBtn} onPress={handleWatchVideo} activeOpacity={0.85}>
                                <LinearGradient colors={['#FF5F5F', COLORS.primary, COLORS.primaryDark]} style={styles.watchBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <Ionicons name="play-circle" size={21} color="#fff" />
                                    <Text style={styles.watchBtnText}>▶  Watch Evidence Video</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.noVideoCard}>
                            <Ionicons name="videocam-off" size={18} color="#E0E0E0" />
                            <Text style={styles.noVideoText}>No video recorded</Text>
                        </View>
                    )}

                    {/* ── Download PDF Button ── */}
                    <TouchableOpacity style={styles.actionBtn} onPress={handleGeneratePDF} disabled={pdfLoading} activeOpacity={0.88}>
                        <LinearGradient colors={['#1565c0', '#0d47a1']} style={styles.actionBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {pdfLoading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="download" size={21} color="#fff" />}
                            <Text style={styles.actionBtnText}>
                                {pdfLoading ? 'Generating PDF...' : (t.downloadPDF || 'Download & Share FIR PDF')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* ── Dispatch Button ── */}
                    <TouchableOpacity style={[styles.actionBtn, { marginBottom: 8 }]} onPress={() => navigation.navigate('Dispatch', { language, fir })} activeOpacity={0.88}>
                        <LinearGradient colors={['#FF5F5F', COLORS.primary, COLORS.primaryDark]} style={styles.actionBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="shield-checkmark" size={21} color="#fff" />
                            <Text style={styles.actionBtnText}>{t.dispatchHelp || 'Dispatch Emergency Help →'}</Text>
                            <Ionicons name="arrow-forward-circle" size={19} color="rgba(255,255,255,0.5)" />
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 12,
        paddingBottom: 15, paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F3F3',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#0D0D0D', fontSize: 18, fontWeight: '800' },
    headerSub: { color: '#C8C8C8', fontSize: 11.5, marginTop: 1 },
    refBadge: { backgroundColor: 'rgba(204,0,0,0.05)', borderWidth: 1.5, borderColor: 'rgba(204,0,0,0.12)', borderRadius: 13, padding: 10, alignItems: 'center' },
    refLabel: { color: COLORS.primary, fontSize: 8.5, fontWeight: '800', letterSpacing: 1 },
    refNum: { color: '#0D0D0D', fontSize: 10.5, fontWeight: '900', marginTop: 2 },

    scroll: { padding: 14, paddingBottom: 56 },

    // Static FIR submitted stamp
    submittedStamp: {
        flexDirection: 'row', alignItems: 'center', gap: 11,
        borderWidth: 1.5, borderColor: 'rgba(46,125,50,0.2)',
        borderRadius: 18, padding: 13, marginBottom: 12, overflow: 'hidden',
    },
    submittedIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(46,125,50,0.1)', alignItems: 'center', justifyContent: 'center' },
    submittedTitle: { color: '#1B5E20', fontWeight: '800', fontSize: 13 },
    submittedSub: { color: '#555', fontSize: 11.5, marginTop: 2 },
    submittedBadge: { backgroundColor: '#2E7D32', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 5 },
    submittedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    // Severity
    severityContainer: { marginBottom: 14 },
    severityBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 18, padding: 13, marginBottom: 10 },
    severityIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    severityLabel: { fontWeight: '900', fontSize: 13.5, letterSpacing: 0.4 },
    severityDesc: { color: '#AAAAAA', fontSize: 11.5, marginTop: 2 },
    stageNumBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    stageNumText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    stagesRow: {
        flexDirection: 'row', gap: 6,
        backgroundColor: '#fff', borderRadius: 16, padding: 12,
        borderWidth: 1, borderColor: '#F2F2F2',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
    },
    stageItem: { flex: 1, alignItems: 'center', gap: 4 },
    stageDot: {},
    stageBar: { width: '80%', borderRadius: 3 },
    stageLabel: { fontSize: 10, letterSpacing: 0.2 },

    // FIR Card
    firCard: {
        backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', marginBottom: 14,
        borderWidth: 1, borderColor: '#F0F0F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 22, elevation: 10,
    },
    firCardHeader: { padding: 24, alignItems: 'center' },
    firEmblem: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,165,0,0.35)', alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
    firOffTitle: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 2.5 },
    firOffSub: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1, marginTop: 5 },
    firRefRow: { marginTop: 9, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 5 },
    firRefNum: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    firBody: { padding: 19, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    firSection: { padding: 19, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
    aiSection: { backgroundColor: '#FAFAFA' },
    summaryText: { color: '#555', fontSize: 13.5, lineHeight: 22.5 },

    timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 13 },
    timelineChain: { alignItems: 'center', marginRight: 9 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1565c0', marginTop: 3 },
    timelineLine: { width: 2, flex: 1, backgroundColor: 'rgba(21,101,192,0.18)', marginTop: 3, minHeight: 16 },
    timeBadge: { backgroundColor: '#1565c0', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3, marginRight: 9, flexShrink: 0 },
    timeText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
    timelineEvent: { color: '#555', fontSize: 13, flex: 1, lineHeight: 20, paddingTop: 2 },

    evidenceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9, gap: 10 },
    evidenceNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1C1C2E', alignItems: 'center', justifyContent: 'center' },
    evidenceNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    evidenceText: { color: '#555', fontSize: 13, flex: 1 },

    sectionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sectionChip: { backgroundColor: '#FFFDF0', borderWidth: 1, borderColor: '#FFE082', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 5 },
    sectionChipText: { color: '#E65100', fontSize: 12, fontWeight: '700' },

    aiInsight: { color: '#666', fontSize: 13, lineHeight: 21.5, fontStyle: 'italic' },
    aiFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    aiFooterText: { color: '#CCCCCC', fontSize: 11 },

    // Plate photo section
    platePhotoSection: {
        backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', marginBottom: 14,
        borderWidth: 1.5, borderColor: 'rgba(21,101,192,0.14)',
        shadowColor: '#1565c0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
    },
    platePhotoHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 9,
        paddingHorizontal: 16, paddingVertical: 13,
        backgroundColor: 'rgba(21,101,192,0.04)',
        borderBottomWidth: 1, borderBottomColor: 'rgba(21,101,192,0.07)',
    },
    platePhotoHeaderIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    platePhotoTitle: { color: '#0D0D0D', fontWeight: '800', fontSize: 14.5 },
    platePhotoContent: { padding: 16 },
    platePhotoImg: { width: '100%', height: 170, borderRadius: 14, backgroundColor: '#111', marginBottom: 12 },
    platePhotoBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    platePhotoNote: { color: '#888', fontSize: 12.5, lineHeight: 19 },

    // Video section
    videoSection: {
        backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', marginBottom: 14,
        borderWidth: 1.5, borderColor: 'rgba(204,0,0,0.1)',
        shadowColor: '#CC0000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 5,
    },
    videoSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: 'rgba(204,0,0,0.03)', borderBottomWidth: 1, borderBottomColor: 'rgba(204,0,0,0.06)' },
    videoHeaderIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    videoSectionTitle: { color: '#0D0D0D', fontWeight: '800', fontSize: 14.5, flex: 1 },
    recBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(204,0,0,0.07)', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(204,0,0,0.13)' },
    recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    recLabel: { color: COLORS.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    videoInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, padding: 16 },
    videoInfoIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(204,0,0,0.06)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    videoInfoTitle: { color: '#0D0D0D', fontWeight: '800', fontSize: 14.5, marginBottom: 5 },
    videoInfoSub: { color: '#AAAAAA', fontSize: 11, marginBottom: 2 },
    videoUrlText: { color: '#4E67EB', fontSize: 10, marginTop: 4 },
    videoTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 15, paddingBottom: 11 },
    videoTag: { backgroundColor: 'rgba(204,0,0,0.05)', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(204,0,0,0.1)' },
    videoTagOnline: { backgroundColor: 'rgba(46,125,50,0.06)', borderColor: 'rgba(46,125,50,0.18)' },
    videoTagText: { color: COLORS.primary, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 },
    watchBtn: { marginHorizontal: 14, marginBottom: 15, borderRadius: 15, overflow: 'hidden' },
    watchBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
    watchBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    noVideoCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#FAFAFA', borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#F0F0F0' },
    noVideoText: { color: '#D0D0D0', fontSize: 13 },

    // Action buttons
    actionBtn: { borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
    actionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 19, gap: 10 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
