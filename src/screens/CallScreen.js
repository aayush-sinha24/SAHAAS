import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    Animated, Dimensions, Platform, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import ParticleBackground from '../components/ParticleBackground';

const { width, height } = Dimensions.get('window');

const CALLER_INFO = {
    police: {
        name: 'Hyderabad PCR',
        detail: 'Police Control Room — 100',
        unit: 'Hyderabad City Police',
        avatar: '👮',
        color: '#1565c0',
        light: '#1e88e5',
        status: 'Hyderabad PCR is responding...',
        connectedMsg: 'Officer en route to your location',
    },
    ambulance: {
        name: '108 Ambulance',
        detail: 'Emergency Medical Services',
        unit: 'Telangana 108 EMS',
        avatar: '🚑',
        color: '#2e7d32',
        light: '#43a047',
        status: 'Medical team being dispatched...',
        connectedMsg: 'Ambulance en route — ETA 8 min',
    },
    fire: {
        name: '101 Fire Brigade',
        detail: 'Fire & Rescue + 108 Ambulance',
        unit: 'Hyderabad Fire Station',
        avatar: '🚒',
        color: '#e65100',
        light: '#f4511e',
        status: 'Fire brigade & ambulance dispatched...',
        connectedMsg: 'Fire + Medical team en route',
    },
};

// Wave ring around avatar
function WaveRing({ delay, size, color }) {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.42)).current;
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 2.3, duration: 2000, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.42, duration: 0, useNativeDriver: true }),
                ]),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, []);
    return (
        <Animated.View style={{
            position: 'absolute',
            width: size, height: size, borderRadius: size / 2,
            borderWidth: 1.5, borderColor: color,
            transform: [{ scale }], opacity,
        }} />
    );
}

// Signal bars
function SignalBars({ color, active }) {
    const anims = [1, 2, 3, 4, 5].map(() => useRef(new Animated.Value(0.3)).current);

    useEffect(() => {
        if (!active) return;
        anims.forEach((anim, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 100),
                    Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: false }),
                    Animated.timing(anim, { toValue: 0.3, duration: 350, useNativeDriver: false }),
                ])
            ).start();
        });
    }, [active]);

    const heights = [14, 22, 30, 22, 14];
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
            {anims.map((anim, i) => (
                <Animated.View key={i} style={{
                    width: 5, borderRadius: 3, backgroundColor: color,
                    height: anim.interpolate({ inputRange: [0.3, 1], outputRange: [heights[i] * 0.3, heights[i]] }),
                }} />
            ))}
        </View>
    );
}

function DispatchBadge({ icon, text }) {
    return (
        <View style={styles.badge}>
            <Ionicons name={icon} size={10} color={COLORS.primary} />
            <Text style={styles.badgeText} numberOfLines={1}>{text}</Text>
        </View>
    );
}

export default function CallScreen({ navigation, route }) {
    const { language, option, fir } = route.params || {};
    const caller = CALLER_INFO[option?.id] || CALLER_INFO.police;

    const [phase, setPhase] = useState('ringing');
    const [callDuration, setCallDuration] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(48)).current;
    const avatarScale = useRef(new Animated.Value(0.72)).current;
    const timerRef = useRef(null);
    const statusFade = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 580, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 38, friction: 8, useNativeDriver: true }),
            Animated.spring(avatarScale, { toValue: 1, tension: 36, friction: 7, useNativeDriver: true }),
        ]).start();

        Vibration.vibrate([500, 500, 500, 500], true);

        const connectTimer = setTimeout(() => {
            Vibration.cancel();
            Animated.timing(statusFade, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
                setPhase('connected');
                Animated.timing(statusFade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
            });
            startCallTimer();
        }, 3000);

        return () => {
            clearTimeout(connectTimer);
            clearInterval(timerRef.current);
            Vibration.cancel();
        };
    }, []);

    const startCallTimer = () => {
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    };

    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleEndCall = () => {
        Vibration.cancel();
        clearInterval(timerRef.current);
        Animated.timing(statusFade, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
            setPhase('ended');
            Animated.timing(statusFade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
        });
        setTimeout(() => navigation.navigate('Home'), 1600);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" hidden />

            {/* Premium gradient from service color fading to pure white */}
            <LinearGradient
                colors={[caller.color, `${caller.color}DD`, '#ECEFF1', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.62 }}
            />
            <View style={[StyleSheet.absoluteFill, { top: '62%', backgroundColor: '#FFFFFF' }]} />
            <ParticleBackground intensity={0.55} />

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                {/* Status pill */}
                <Animated.View style={[styles.statusPill, { opacity: statusFade, borderColor: `${caller.color}50` }]}>
                    <View style={[styles.statusDot, {
                        backgroundColor: phase === 'connected' ? COLORS.success : phase === 'ended' ? '#AAAAAA' : caller.light,
                    }]} />
                    <Text style={styles.statusPillText}>
                        {phase === 'ringing' ? '📞 Calling...' : phase === 'connected' ? '✅ Connected' : '📵 Call Ended'}
                    </Text>
                </Animated.View>

                {/* Avatar */}
                <Animated.View style={[styles.avatarOuter, { transform: [{ scale: avatarScale }] }]}>
                    {phase === 'ringing' && (
                        <>
                            <WaveRing delay={0}    size={168} color={`${caller.light}88`} />
                            <WaveRing delay={670}  size={168} color={`${caller.light}55`} />
                            <WaveRing delay={1340} size={168} color={`${caller.light}30`} />
                        </>
                    )}
                    <LinearGradient
                        colors={[`${caller.light}30`, `${caller.color}18`]}
                        style={styles.avatarCircle}
                    >
                        <Text style={styles.avatarEmoji}>{caller.avatar}</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Caller info */}
                <Text style={styles.callerName}>{caller.name}</Text>
                <Text style={styles.callerDetail}>{caller.detail}</Text>
                <Text style={styles.callerUnit}>{caller.unit}</Text>

                {/* Timer / Status */}
                <View style={styles.timerSection}>
                    {phase === 'connected' ? (
                        <View style={styles.connectedBox}>
                            <SignalBars color={COLORS.success} active />
                            <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
                            <SignalBars color={COLORS.success} active />
                        </View>
                    ) : (
                        <Animated.Text style={[styles.statusText, { opacity: statusFade }]}>
                            {phase === 'ringing' ? caller.status : 'Redirecting to home...'}
                        </Animated.Text>
                    )}
                </View>

                {/* Connected message */}
                {phase === 'connected' && (
                    <View style={[styles.connectedMsg, { borderColor: `${COLORS.success}30` }]}>
                        <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                        <Text style={styles.connectedMsgText}>{caller.connectedMsg}</Text>
                    </View>
                )}

                {/* FIR info box */}
                <View style={[styles.firBox, { borderColor: `${caller.color}28` }]}>
                    <Ionicons name="document-text" size={13} color={caller.color} />
                    <Text style={styles.firBoxText}>
                        Show FIR <Text style={[styles.firBoxRef, { color: caller.color }]}>{fir?.referenceNumber}</Text> to authorities
                    </Text>
                </View>

                {/* Dispatch badges */}
                <View style={styles.badgesRow}>
                    <DispatchBadge icon="location" text={fir?.location?.address || 'GPS shared'} />
                    <DispatchBadge icon="time" text={fir?.incidentTime || 'Time recorded'} />
                    <DispatchBadge icon="mail" text="FIR emailed to PCR" />
                    <DispatchBadge icon="chatbubble" text="SMS alert sent" />
                </View>

                {/* End call / ended */}
                <View style={styles.controls}>
                    {phase === 'ringing' || phase === 'connected' ? (
                        <View style={styles.endBtnWrap}>
                            <TouchableOpacity style={styles.endBtn} onPress={handleEndCall} activeOpacity={0.8}>
                                <LinearGradient colors={['#FF4444', '#CC0000', '#8B0000']} style={styles.endBtnGrad}>
                                    <Ionicons name="call" size={29} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                                </LinearGradient>
                            </TouchableOpacity>
                            <Text style={styles.endLabel}>End Call</Text>
                        </View>
                    ) : (
                        <View style={styles.endedBlock}>
                            <Ionicons name="checkmark-circle" size={52} color={COLORS.success} />
                            <Text style={styles.endedText}>Help Dispatched!</Text>
                            <Text style={styles.endedSub}>Returning to home...</Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1, alignItems: 'center', justifyContent: 'flex-start',
        paddingTop: Platform.OS === 'ios' ? 64 : 54, paddingHorizontal: 28,
    },

    // Status pill
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 26,
        paddingHorizontal: 18, paddingVertical: 9, borderWidth: 1, marginBottom: 32,
    },
    statusDot: { width: 9, height: 9, borderRadius: 4.5 },
    statusPillText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },

    // Avatar
    avatarOuter: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
    avatarCircle: {
        width: 124, height: 124, borderRadius: 62,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)',
    },
    avatarEmoji: { fontSize: 60 },

    // Caller info
    callerName: { color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 7 },
    callerDetail: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center' },
    callerUnit: { color: 'rgba(255,255,255,0.42)', fontSize: 12, textAlign: 'center', marginBottom: 24 },

    // Timer
    timerSection: { marginBottom: 15, alignItems: 'center' },
    connectedBox: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    timerText: {
        color: '#111', fontSize: 28, fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 2,
    },
    statusText: { color: 'rgba(255,255,255,0.65)', fontSize: 13.5, textAlign: 'center' },

    // Connected msg
    connectedMsg: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: 'rgba(0,200,83,0.09)', borderRadius: 14, borderWidth: 1,
        paddingHorizontal: 15, paddingVertical: 11, marginBottom: 15,
    },
    connectedMsgText: { color: COLORS.success, fontSize: 13.5, fontWeight: '700' },

    // FIR box
    firBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fff', borderRadius: 13, borderWidth: 1.5,
        paddingHorizontal: 15, paddingVertical: 10, marginBottom: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    },
    firBoxText: { color: '#666', fontSize: 12.5 },
    firBoxRef: { fontWeight: '900' },

    // Badges
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 34 },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#F5F5F5', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 6,
        borderWidth: 1, borderColor: '#EBEBEB',
    },
    badgeText: { color: '#888', fontSize: 10.5, maxWidth: 120 },

    // Controls
    controls: { alignItems: 'center' },
    endBtnWrap: { alignItems: 'center', gap: 11 },
    endBtn: {
        shadowColor: '#FF4444', shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45, shadowRadius: 22, elevation: 14,
    },
    endBtnGrad: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
    endLabel: { color: '#BBBBBB', fontSize: 12, fontWeight: '600' },

    endedBlock: { alignItems: 'center', gap: 9 },
    endedText: { color: COLORS.success, fontSize: 22, fontWeight: '900' },
    endedSub: { color: '#BBBBBB', fontSize: 13 },
});
