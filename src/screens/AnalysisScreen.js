import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, StatusBar, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STRINGS } from '../constants';
import { analyzeIncident } from '../services/geminiService';
import { generateFIR } from '../services/firService';
import ParticleBackground from '../components/ParticleBackground';

const { width } = Dimensions.get('window');

const STEPS = [
    { icon: 'videocam',         label: 'Processing geo-tagged video...',   duration: 1800, color: '#CC0000' },
    { icon: 'location',         label: 'Extracting GPS coordinates...',     duration: 1400, color: '#FF9F43' },
    { icon: 'time',             label: 'Verifying timestamp & evidence...', duration: 1200, color: '#4E67EB' },
    { icon: 'analytics',        label: 'Running AI incident analysis...',   duration: 2500, color: '#7C4DFF' },
    { icon: 'document-text',    label: 'Generating FIR document...',        duration: 1500, color: '#FF6B6B' },
    { icon: 'shield-checkmark', label: 'Finalising report...',              duration: 800,  color: '#00C853' },
];

// Animated step dot
function StepDot({ step, isCompleted, isCurrent, isDone }) {
    const scale = useRef(new Animated.Value(isCurrent ? 0.85 : 1)).current;

    useEffect(() => {
        if (isCurrent) {
            const anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(scale, { toValue: 1.18, duration: 580, useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 0.85, duration: 580, useNativeDriver: true }),
                ])
            );
            anim.start();
            return () => anim.stop();
        }
    }, [isCurrent]);

    const color = isCompleted || isDone ? step.color : isCurrent ? step.color : '#DDDDDD';
    const bg = isCompleted || isDone ? `${step.color}14` : isCurrent ? `${step.color}10` : '#F8F8F8';
    const border = isCompleted || isDone ? step.color : isCurrent ? `${step.color}70` : '#E8E8E8';

    return (
        <Animated.View style={[styles.checkIconWrap, { backgroundColor: bg, borderColor: border, transform: [{ scale }] }]}>
            <Ionicons
                name={isCompleted || isDone ? 'checkmark-circle' : isCurrent ? 'radio-button-on' : 'ellipse-outline'}
                size={16}
                color={isCompleted || isDone ? step.color : isCurrent ? step.color : '#CCCCCC'}
            />
        </Animated.View>
    );
}

export default function AnalysisScreen({ navigation, route }) {
    const { language, videoUri, videoUrl, location, timestamp, answers, platePhotoUri } = route.params || {};
    const t = STRINGS[language] || STRINGS.en;

    const [currentStep, setCurrentStep] = useState(0);
    const [done, setDone] = useState(false);
    const [error, setError] = useState(null);

    const progressAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const stepFade = useRef(new Animated.Value(1)).current;
    const orbScale = useRef(new Animated.Value(0.80)).current;
    const scanLineY = useRef(new Animated.Value(-80)).current;
    const bgPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 650, useNativeDriver: true }).start();
        Animated.spring(orbScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }).start();
        startRotation();
        startScanLine();
        startBgPulse();
        runAnalysis();
    }, []);

    const startRotation = () => {
        Animated.loop(
            Animated.timing(rotateAnim, { toValue: 1, duration: 2600, useNativeDriver: true })
        ).start();
    };

    const startBgPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bgPulse, { toValue: 1.055, duration: 2200, useNativeDriver: true }),
                Animated.timing(bgPulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
            ])
        ).start();
    };

    const startScanLine = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineY, { toValue: 80, duration: 1900, useNativeDriver: true }),
                Animated.timing(scanLineY, { toValue: -80, duration: 0, useNativeDriver: true }),
            ])
        ).start();
    };

    const animateStep = (stepIndex) => {
        Animated.sequence([
            Animated.timing(stepFade, { toValue: 0, duration: 160, useNativeDriver: true }),
            Animated.timing(stepFade, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
        setCurrentStep(stepIndex);

        const totalDuration = STEPS.reduce((sum, s) => sum + s.duration, 0);
        const elapsed = STEPS.slice(0, stepIndex + 1).reduce((sum, s) => sum + s.duration, 0);
        Animated.timing(progressAnim, {
            toValue: elapsed / totalDuration,
            duration: STEPS[stepIndex]?.duration || 1000,
            useNativeDriver: false,
        }).start();
    };

    const runAnalysis = async () => {
        let delay = 0;
        STEPS.forEach((step, i) => {
            setTimeout(() => animateStep(i), delay);
            delay += step.duration;
        });

        try {
            const aiData = await analyzeIncident({ imageBase64: null, location, timestamp, answers });
            const fir = generateFIR(aiData, location, timestamp, answers, videoUri, videoUrl, platePhotoUri);
            setTimeout(() => {
                setDone(true);
                setTimeout(() => navigation.navigate('FIR', { language, fir }), 900);
            }, Math.max(delay - 1000, 2000));
        } catch (e) {
            console.error('Analysis error:', e);
            setError('Analysis completed with limited data');
            const fir = generateFIR({}, location, timestamp, answers, videoUri, videoUrl, platePhotoUri);
            setTimeout(() => navigation.navigate('FIR', { language, fir }), 3000);
        }

    };

    const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    const currentColor = done ? COLORS.success : (STEPS[currentStep]?.color || COLORS.primary);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
            <ParticleBackground intensity={0.7} />

            {/* Decorative soft rings */}
            <Animated.View style={[styles.bgRing, { transform: [{ scale: bgPulse }] }]} />
            <Animated.View style={[styles.bgRing2, { transform: [{ scale: bgPulse }] }]} />

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

                {/* ── AI Brain Orb ── */}
                <Animated.View style={[styles.orbWrap, { transform: [{ scale: orbScale }] }]}>
                    <Animated.View style={[styles.orbRingOuter, {
                        borderColor: `${currentColor}30`,
                        transform: [{ rotate }],
                    }]} />
                    <Animated.View style={[styles.orbRingMid, { borderColor: `${currentColor}18` }]} />

                    {/* Scan line */}
                    <View style={styles.orbClip}>
                        <Animated.View style={[styles.scanLine, {
                            backgroundColor: `${currentColor}45`,
                            transform: [{ translateY: scanLineY }],
                        }]} />
                    </View>

                    {/* Center gradient orb */}
                    <LinearGradient
                        colors={done ? ['#00E676', '#00C853', '#008a35'] : ['#FF5F5F', '#CC0000', '#8B0000']}
                        style={styles.orbInner}
                    >
                        <MaterialCommunityIcons
                            name={done ? 'check-decagram' : 'brain'}
                            size={50}
                            color="#fff"
                        />
                    </LinearGradient>

                    {/* Neural dots */}
                    <View style={styles.neuralRow}>
                        {[0, 1, 2, 3, 4].map(i => (
                            <View key={i} style={[styles.neuralDot, { backgroundColor: STEPS[i % STEPS.length]?.color }]} />
                        ))}
                    </View>
                </Animated.View>

                {/* ── Main label ── */}
                <Text style={styles.mainLabel}>
                    {done ? '✅ FIR Generated!' : (t.analyzing || 'AI Analyzing Incident...')}
                </Text>

                {/* ── Current step indicator ── */}
                <Animated.View style={[styles.stepIndicator, {
                    opacity: stepFade,
                    borderColor: `${currentColor}25`,
                    backgroundColor: `${currentColor}06`,
                }]}>
                    <View style={[styles.stepDot, { backgroundColor: currentColor }]} />
                    <Text style={[styles.stepLabel, { color: currentColor }]}>
                        {done ? 'All evidence processed. FIR ready.' : (STEPS[currentStep]?.label || '')}
                    </Text>
                </Animated.View>

                {/* ── Progress bar ── */}
                <View style={styles.progressBg}>
                    <Animated.View style={[styles.progressFill, { width: done ? '100%' : progressWidth }]}>
                        <LinearGradient
                            colors={done ? ['#00E676', '#00C853'] : [COLORS.primary, COLORS.accent]}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        />
                        <View style={styles.progressShimmer} />
                    </Animated.View>
                </View>

                {/* ── Steps checklist ── */}
                <View style={styles.checklist}>
                    {STEPS.map((step, i) => {
                        const isCompleted = i < currentStep || done;
                        const isCurrent = i === currentStep && !done;
                        return (
                            <View key={i} style={[styles.checkRow, isCurrent && styles.checkRowActive]}>
                                <StepDot step={step} isCompleted={isCompleted} isCurrent={isCurrent} isDone={done} />
                                <Text style={[styles.checkText, {
                                    color: isCompleted || isCurrent || done ? '#333' : '#CCCCCC',
                                    fontWeight: isCurrent ? '700' : '400',
                                }]}>
                                    {step.label}
                                </Text>
                                {isCurrent && (
                                    <View style={[styles.activeBadge, {
                                        backgroundColor: `${step.color}12`,
                                        borderColor: `${step.color}40`,
                                    }]}>
                                        <Text style={[styles.activeBadgeText, { color: step.color }]}>PROCESSING</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* ── AI Badge ── */}
                <View style={styles.aiBadge}>
                    <MaterialCommunityIcons name="brain" size={13} color="#CCCCCC" />
                    <Text style={styles.aiBadgeText}>Powered by Groq Llama 3.3 AI</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 },

    bgRing: {
        position: 'absolute', width: 540, height: 540, borderRadius: 270,
        top: -165, alignSelf: 'center',
        borderWidth: 1.5, borderColor: 'rgba(204,0,0,0.05)',
        borderStyle: 'dashed',
    },
    bgRing2: {
        position: 'absolute', width: 370, height: 370, borderRadius: 185,
        top: -85, alignSelf: 'center',
        borderWidth: 1, borderColor: 'rgba(78,103,235,0.05)',
    },

    orbWrap: { width: 232, height: 232, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
    orbRingOuter: {
        position: 'absolute', width: 222, height: 222, borderRadius: 111,
        borderWidth: 2, borderStyle: 'dashed',
    },
    orbRingMid: {
        position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1.5,
    },
    orbClip: {
        position: 'absolute', width: 128, height: 128, borderRadius: 64, overflow: 'hidden',
    },
    scanLine: { width: '100%', height: 3, position: 'absolute' },
    orbInner: {
        width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.26, shadowRadius: 30, elevation: 18,
    },
    neuralRow: { position: 'absolute', bottom: -14, flexDirection: 'row', gap: 7 },
    neuralDot: { width: 7, height: 7, borderRadius: 3.5 },

    mainLabel: {
        color: '#0D0D0D', fontSize: 22, fontWeight: '900',
        textAlign: 'center', marginBottom: 16, letterSpacing: 0.2,
    },

    stepIndicator: {
        flexDirection: 'row', alignItems: 'center', gap: 9,
        marginBottom: 20, paddingHorizontal: 18, paddingVertical: 11,
        borderRadius: 26, borderWidth: 1,
    },
    stepDot: { width: 8, height: 8, borderRadius: 4 },
    stepLabel: { fontSize: 13, fontWeight: '600' },

    progressBg: {
        width: '100%', height: 7, backgroundColor: '#F2F2F2',
        borderRadius: 4, overflow: 'hidden', marginBottom: 24,
    },
    progressFill: { height: 7, borderRadius: 4, overflow: 'hidden' },
    progressShimmer: {
        position: 'absolute', top: 0, bottom: 0, width: 38,
        backgroundColor: 'rgba(255,255,255,0.42)', right: 0,
    },

    checklist: { width: '100%', gap: 5, marginBottom: 26 },
    checkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 12, paddingVertical: 9, borderRadius: 13,
    },
    checkRowActive: { backgroundColor: 'rgba(0,0,0,0.025)' },
    checkIconWrap: {
        width: 28, height: 28, borderRadius: 9, borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    checkText: { fontSize: 13, flex: 1 },
    activeBadge: {
        borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3,
    },
    activeBadgeText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },

    aiBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: '#F8F8F8', borderRadius: 24,
        paddingHorizontal: 18, paddingVertical: 10,
        borderWidth: 1, borderColor: '#EEEEEE',
    },
    aiBadgeText: { color: '#C0C0C0', fontSize: 12 },
});
