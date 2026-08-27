import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    ScrollView, Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, APP_CONFIG, STRINGS, LANGUAGES } from '../constants';
import ParticleBackground from '../components/ParticleBackground';

const { width, height } = Dimensions.get('window');

// Lift-in block with spring animation
function LiftBlock({ children, delay = 0, style }) {
    const translateY = useRef(new Animated.Value(36)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]).start();
        }, delay);
    }, []);

    return (
        <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
}

// Pulse ring for the capture button
function PulseRing({ delay = 0, color = COLORS.primary }) {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.28)).current;
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 2.2, duration: 1800, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.28, duration: 0, useNativeDriver: true }),
                ]),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, []);
    return <Animated.View style={[styles.pulseRing, { borderColor: color, transform: [{ scale }], opacity }]} />;
}

// Animated emergency ticker
function Ticker() {
    const translateX = useRef(new Animated.Value(width)).current;
    useEffect(() => {
        Animated.loop(
            Animated.timing(translateX, { toValue: -width * 2.8, duration: 22000, useNativeDriver: true })
        ).start();
    }, []);
    return (
        <View style={styles.tickerWrap} pointerEvents="none">
            <Animated.Text style={[styles.tickerText, { transform: [{ translateX }] }]}>
                🚨 EMERGENCY RESPONSE ACTIVE  •  HYDERABAD PCR: 100  •  AMBULANCE: 108  •  FIRE: 101  •  WOMEN HELPLINE: 1091  •  CHILD HELPLINE: 1098  •{'  '}
            </Animated.Text>
        </View>
    );
}

export default function HomeScreen({ navigation }) {
    const [language, setLanguage] = useState('en');
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const stepsSlide = [1, 2, 3, 4, 5].map(() => useRef(new Animated.Value(26)).current);
    const stepsFade = [1, 2, 3, 4, 5].map(() => useRef(new Animated.Value(0)).current);
    const shimmerAnim = useRef(new Animated.Value(-1)).current;

    const t = STRINGS[language] || STRINGS.en;

    useEffect(() => {
        stepsFade.forEach((anim, i) => {
            setTimeout(() => {
                Animated.timing(anim, { toValue: 1, duration: 440, useNativeDriver: true }).start();
                Animated.spring(stepsSlide[i], { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
            }, 700 + i * 110);
        });

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.055, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        );
        pulse.start();

        const rotate = Animated.loop(
            Animated.timing(rotateAnim, { toValue: 1, duration: 18000, useNativeDriver: true })
        );
        rotate.start();

        const shimmer = Animated.loop(
            Animated.timing(shimmerAnim, { toValue: 1, duration: 2600, useNativeDriver: true })
        );
        shimmer.start();

        return () => { pulse.stop(); rotate.stop(); shimmer.stop(); };
    }, []);

    const rotateInterp = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [-1, 1], outputRange: [-200, 200] });

    const steps = [
        { icon: 'camera', label: t.step1 || 'Open app, tap Capture', color: '#CC0000' },
        { icon: 'videocam', label: t.step2 || 'Record 10–30 sec geo-tagged video', color: '#FF9F43' },
        { icon: 'chatbubble-ellipses', label: t.step3 || 'Answer 4 quick questions', color: '#4E67EB' },
        { icon: 'document-text', label: t.step4 || 'AI generates FIR instantly', color: '#7C4DFF' },
        { icon: 'shield-checkmark', label: t.step5 || 'Dispatch police/ambulance', color: '#00897B' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* Pure white base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />

            {/* Ultra-subtle ambient particles */}
            <ParticleBackground intensity={0.8} />

            {/* Top decorative bar */}
            <LinearGradient
                colors={['rgba(204,0,0,0.06)', 'rgba(204,0,0,0)']}
                style={styles.topDecorBar}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                pointerEvents="none"
            />

            {/* Emergency ticker strip */}
            <View style={styles.tickerContainer}>
                <MaterialCommunityIcons name="alarm-light" size={11} color={COLORS.primary} />
                <Ticker />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 54 }}
            >
                {/* ── Header ── */}
                <LiftBlock delay={0} style={styles.header}>
                    <View style={styles.logoRow}>
                        <View style={styles.logoIconWrap}>
                            <LinearGradient
                                colors={['#FF5F5F', '#CC0000', '#8B0000']}
                                style={styles.logoIconGradient}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <FontAwesome5 name="shield-alt" size={25} color="#fff" />
                            </LinearGradient>
                            {/* Subtle glow disc behind icon */}
                            <View style={styles.logoGlowDisc} />
                        </View>
                        <View style={styles.logoText}>
                            <Text style={styles.appName}>{APP_CONFIG.name.toUpperCase()}</Text>
                            <Text style={styles.appNameLocal}>सहास  •  సహాస్  •  સહાસ</Text>
                        </View>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    </View>
                    <Text style={styles.tagline}>{t.appTagline || 'Emergency Incident Response'}</Text>
                    <Text style={styles.subTagline}>AI-Powered  •  Geo-Tagged  •  Instant FIR</Text>
                    <View style={styles.headerDivider} />
                </LiftBlock>

                {/* ── Language Selector ── */}
                <LiftBlock delay={100} style={styles.langContainer}>
                    {Object.entries(LANGUAGES).map(([code, label]) => (
                        <TouchableOpacity
                            key={code}
                            style={[styles.langBtn, language === code && styles.langBtnActive]}
                            onPress={() => setLanguage(code)}
                            activeOpacity={0.75}
                        >
                            {language === code && (
                                <LinearGradient
                                    colors={['#FF5F5F', '#CC0000']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                />
                            )}
                            <Text style={[styles.langBtnText, language === code && styles.langBtnTextActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </LiftBlock>

                {/* ── MAIN CAPTURE BUTTON ── */}
                <LiftBlock delay={200} style={styles.captureSection}>
                    <View style={styles.captureOrb}>
                        <PulseRing delay={0} color={COLORS.primary} />
                        <PulseRing delay={600} color="#FF9F43" />
                        <PulseRing delay={1200} color="#4E67EB" />

                        <Animated.View style={[styles.orbitRing, { transform: [{ rotate: rotateInterp }] }]} />

                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={styles.captureBtn}
                                onPress={() => navigation.navigate('Capture', { language })}
                                activeOpacity={0.88}
                            >
                                <LinearGradient
                                    colors={['#FF5F5F', '#CC0000', '#8B0000']}
                                    style={styles.captureBtnGrad}
                                    start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                                >
                                    {/* Shimmer sweep */}
                                    <Animated.View
                                        style={[
                                            styles.shimmer,
                                            { transform: [{ translateX: shimmerTranslate }, { rotate: '25deg' }] },
                                        ]}
                                    />
                                    <View style={styles.captureInnerRing}>
                                        <Ionicons name="videocam" size={52} color="#fff" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <Text style={styles.captureLabel}>{t.captureButton || 'CAPTURE INCIDENT'}</Text>
                    <Text style={styles.captureSubLabel}>Tap to start geo-tagged recording</Text>

                    {/* Hint pills */}
                    <View style={styles.hintPills}>
                        <View style={styles.hintPill}>
                            <Ionicons name="time-outline" size={11} color={COLORS.primary} />
                            <Text style={styles.hintPillText}>10–30 sec</Text>
                        </View>
                        <View style={[styles.hintPill, styles.hintPillBlue]}>
                            <Ionicons name="location-outline" size={11} color="#4E67EB" />
                            <Text style={[styles.hintPillText, { color: '#4E67EB' }]}>Geo-tagged</Text>
                        </View>
                        <View style={[styles.hintPill, styles.hintPillPurple]}>
                            <MaterialCommunityIcons name="brain" size={11} color="#7C4DFF" />
                            <Text style={[styles.hintPillText, { color: '#7C4DFF' }]}>AI Powered</Text>
                        </View>
                    </View>
                </LiftBlock>

                {/* ── Emergency Numbers ── */}
                <LiftBlock delay={320} style={styles.emergencyRow}>
                    {[
                        { num: '100', label: 'Police', icon: 'shield', color: '#1565C0' },
                        { num: '108', label: 'Ambulance', icon: 'medkit', color: '#2E7D32' },
                        { num: '101', label: 'Fire', icon: 'flame', color: '#CC0000' },
                    ].map((item) => (
                        <View key={item.num} style={[styles.emergencyCard, { borderTopColor: item.color }]}>
                            <LinearGradient
                                colors={[`${item.color}0D`, '#FFFFFF']}
                                style={styles.emergencyCardGrad}
                                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            >
                                <View style={[styles.emergencyIconWrap, { backgroundColor: `${item.color}12` }]}>
                                    <Ionicons name={item.icon} size={19} color={item.color} />
                                </View>
                                <Text style={[styles.emergencyNum, { color: item.color }]}>{item.num}</Text>
                                <Text style={styles.emergencyLabel}>{item.label}</Text>
                            </LinearGradient>
                        </View>
                    ))}
                </LiftBlock>

                {/* ── How It Works ── */}
                <LiftBlock delay={440} style={styles.howCard}>
                    <View style={styles.howTitleRow}>
                        <LinearGradient
                            colors={['#FF5F5F', '#FF9F43']}
                            style={styles.howTitleIcon}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="information" size={14} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.howTitleText}>{t.howItWorks || 'How It Works'}</Text>
                        <View style={styles.howBadge}>
                            <Text style={styles.howBadgeText}>5 steps</Text>
                        </View>
                    </View>
                    {steps.map((step, i) => (
                        <Animated.View
                            key={i}
                            style={[styles.stepRow, {
                                opacity: stepsFade[i],
                                transform: [{ translateX: stepsSlide[i] }],
                            }]}
                        >
                            <View style={[styles.stepNumWrap, { backgroundColor: `${step.color}10`, borderColor: `${step.color}30` }]}>
                                <Text style={[styles.stepNum, { color: step.color }]}>{i + 1}</Text>
                            </View>
                            <View style={[styles.stepIconWrap, { backgroundColor: `${step.color}0D` }]}>
                                <Ionicons name={step.icon} size={15} color={step.color} />
                            </View>
                            <Text style={styles.stepText}>{step.label}</Text>
                            {i < steps.length - 1 && (
                                <View style={[styles.stepConnector, { backgroundColor: `${step.color}20` }]} />
                            )}
                        </Animated.View>
                    ))}
                </LiftBlock>

                {/* ── Bottom badge ── */}
                <LiftBlock delay={560} style={styles.bottomBadge}>
                    <MaterialCommunityIcons name="brain" size={12} color="#C8C8C8" />
                    <Text style={styles.bottomBadgeText}>Powered by Groq Llama 3.3 AI  •  v{APP_CONFIG.version}</Text>
                </LiftBlock>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    topDecorBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        height: Platform.OS === 'ios' ? 100 : 80,
        zIndex: 0,
    },

    // Ticker
    tickerContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: 'rgba(204,0,0,0.04)',
        borderBottomWidth: 1, borderBottomColor: 'rgba(204,0,0,0.09)',
        paddingVertical: 8, paddingHorizontal: 14, overflow: 'hidden',
        marginTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    },
    tickerWrap: { flex: 1, overflow: 'hidden' },
    tickerText: {
        color: COLORS.primary, fontSize: 10.5, fontWeight: '700',
        letterSpacing: 0.5, width: width * 4.5,
    },

    // Header
    header: { alignItems: 'center', paddingTop: 26, paddingBottom: 14, paddingHorizontal: 20 },
    logoRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        marginBottom: 16, alignSelf: 'stretch', justifyContent: 'center',
    },
    logoIconWrap: { position: 'relative' },
    logoIconGradient: {
        width: 62, height: 62, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18, shadowRadius: 18, elevation: 12,
    },
    logoGlowDisc: {
        position: 'absolute', bottom: -6, left: 6, right: 6, height: 12,
        backgroundColor: 'rgba(204,0,0,0.1)', borderRadius: 6,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 0,
    },
    logoText: { alignItems: 'center' },
    appName: {
        fontSize: 34, fontWeight: '900', color: '#0D0D0D',
        letterSpacing: 3.5,
    },
    appNameLocal: { fontSize: 10.5, color: '#C0C0C0', letterSpacing: 2, marginTop: 3 },
    liveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(204,0,0,0.06)', borderRadius: 10,
        paddingHorizontal: 9, paddingVertical: 5,
        borderWidth: 1, borderColor: 'rgba(204,0,0,0.13)',
        position: 'absolute', right: 0, top: 0,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    liveText: { color: COLORS.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    tagline: {
        fontSize: 15, color: COLORS.primary, fontWeight: '700',
        letterSpacing: 0.7, textAlign: 'center', marginBottom: 5,
    },
    subTagline: { fontSize: 11.5, color: '#B8B8B8', letterSpacing: 0.3 },
    headerDivider: {
        height: 1.5, width: '55%', marginTop: 18,
        backgroundColor: 'rgba(204,0,0,0.09)', borderRadius: 1,
    },

    // Language
    langContainer: {
        flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
        gap: 8, marginHorizontal: 20, marginBottom: 10,
    },
    langBtn: {
        paddingHorizontal: 17, paddingVertical: 8, borderRadius: 26,
        borderWidth: 1.5, borderColor: '#EBEBEB', overflow: 'hidden',
        backgroundColor: '#FAFAFA',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    langBtnActive: {
        borderColor: COLORS.primary, elevation: 6,
        shadowColor: COLORS.primary, shadowOpacity: 0.16, shadowRadius: 10,
    },
    langBtnText: { color: '#AAAAAA', fontSize: 13, fontWeight: '600' },
    langBtnTextActive: { color: '#fff', fontWeight: '800' },

    // Capture Section
    captureSection: { alignItems: 'center', marginVertical: 20 },
    captureOrb: {
        width: 224, height: 224,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    pulseRing: {
        position: 'absolute', width: 178, height: 178,
        borderRadius: 89, borderWidth: 1.5,
    },
    orbitRing: {
        position: 'absolute', width: 210, height: 210, borderRadius: 105,
        borderWidth: 1, borderColor: 'rgba(204,0,0,0.12)',
        borderStyle: 'dashed',
    },
    captureBtn: {
        borderRadius: 95,
        shadowColor: '#CC0000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.28, shadowRadius: 34, elevation: 22,
    },
    captureBtnGrad: {
        width: 178, height: 178, borderRadius: 89,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        width: 38, height: 300,
        backgroundColor: 'rgba(255,255,255,0.16)',
        top: -100,
    },
    captureInnerRing: {
        width: 142, height: 142, borderRadius: 71,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    captureLabel: {
        color: '#0D0D0D', fontSize: 19, fontWeight: '900', letterSpacing: 2.5,
    },
    captureSubLabel: { color: '#B8B8B8', fontSize: 12.5, marginTop: 6, marginBottom: 16 },
    hintPills: { flexDirection: 'row', gap: 8 },
    hintPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(204,0,0,0.05)', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: 'rgba(204,0,0,0.1)',
    },
    hintPillBlue: {
        backgroundColor: 'rgba(78,103,235,0.05)',
        borderColor: 'rgba(78,103,235,0.1)',
    },
    hintPillPurple: {
        backgroundColor: 'rgba(124,77,255,0.05)',
        borderColor: 'rgba(124,77,255,0.1)',
    },
    hintPillText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

    // Emergency row
    emergencyRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 18 },
    emergencyCard: {
        flex: 1, borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: '#F0F0F0',
        borderTopWidth: 2.5,
        backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    },
    emergencyCardGrad: { paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 5 },
    emergencyIconWrap: {
        width: 40, height: 40, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center', marginBottom: 3,
    },
    emergencyNum: { fontSize: 24, fontWeight: '900' },
    emergencyLabel: { color: '#B8B8B8', fontSize: 10, fontWeight: '600' },

    // How It Works
    howCard: {
        marginHorizontal: 16, marginBottom: 18,
        backgroundColor: '#fff',
        borderRadius: 24, padding: 22,
        borderWidth: 1, borderColor: '#F2F2F2',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05, shadowRadius: 18, elevation: 6,
    },
    howTitleRow: {
        flexDirection: 'row', alignItems: 'center',
        gap: 10, marginBottom: 20,
    },
    howTitleIcon: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    howTitleText: { color: '#0D0D0D', fontWeight: '800', fontSize: 14.5, letterSpacing: 0.2, flex: 1 },
    howBadge: {
        backgroundColor: '#F7F7F7', borderRadius: 8,
        paddingHorizontal: 9, paddingVertical: 4,
        borderWidth: 1, borderColor: '#EBEBEB',
    },
    howBadgeText: { color: '#AAAAAA', fontSize: 10.5, fontWeight: '700' },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    stepNumWrap: {
        width: 28, height: 28, borderRadius: 9, borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center', marginRight: 9, flexShrink: 0,
    },
    stepNum: { fontSize: 12, fontWeight: '900' },
    stepIconWrap: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', marginRight: 11, flexShrink: 0,
    },
    stepText: { color: '#555', fontSize: 13, flex: 1, lineHeight: 18.5 },
    stepConnector: {
        position: 'absolute', left: 14, bottom: -12,
        width: 2, height: 10, borderRadius: 1,
    },

    // Bottom badge
    bottomBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        justifyContent: 'center', paddingBottom: 10,
    },
    bottomBadgeText: { color: '#D0D0D0', fontSize: 11 },
});
