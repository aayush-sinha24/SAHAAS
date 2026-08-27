import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    Animated, Dimensions, Platform, Linking, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STRINGS, EMERGENCY_CONTACTS } from '../constants';
import ParticleBackground from '../components/ParticleBackground';

const { width } = Dimensions.get('window');

const DISPATCH_OPTIONS = [
    {
        id: 'police',
        label: 'Police + FIR',
        sublabel: 'Hyderabad PCR Control Room',
        color: '#1565c0',
        darkColor: '#0d47a1',
        emoji: '🚓',
        description: 'Police will arrive at incident location. Show AI-generated FIR on arrival.',
        actions: ['Call PCR', 'View FIR PDF'],
    },
    {
        id: 'ambulance',
        label: 'Ambulance',
        sublabel: '108 Emergency Medical Service',
        color: '#2e7d32',
        darkColor: '#1b5e20',
        emoji: '🚑',
        description: 'Medical team dispatched to your GPS location immediately.',
        actions: ['Call 108', 'Alert Hospital'],
    },
    {
        id: 'fire',
        label: 'Ambulance + Fire Brigade',
        sublabel: '101 Fire & Rescue + 108 Ambulance',
        color: '#e65100',
        darkColor: '#bf360c',
        emoji: '🚒',
        description: 'Fire brigade and ambulance both dispatched. GPS location shared.',
        actions: ['Call 101', 'Alert All Services'],
    },
];

// Animated live dot
function LiveDot() {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(scale, { toValue: 2.4, duration: 800, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);
    return (
        <View style={{ width: 13, height: 13, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[styles.livePulse, { transform: [{ scale }], opacity }]} />
            <View style={styles.liveDotCore} />
        </View>
    );
}

function DispatchCard({ option, dispatching, dispatched, onPress, index }) {
    const translateY = useRef(new Animated.Value(42)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, tension: 46, friction: 9, useNativeDriver: true }),
            ]).start();
        }, index * 120);
    }, []);

    const onPressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start();
    const onPressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

    return (
        <Animated.View style={[{ opacity, transform: [{ translateY }, { scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={[
                    styles.card,
                    dispatched && { borderColor: `${option.color}35`, borderLeftWidth: 4, borderLeftColor: option.color },
                ]}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={dispatching || dispatched}
                activeOpacity={1}
            >
                {dispatched && (
                    <LinearGradient
                        colors={[`${option.color}08`, `${option.color}04`]}
                        style={StyleSheet.absoluteFill}
                    />
                )}

                {/* Left emoji */}
                <View style={[styles.cardEmojiBg, { backgroundColor: `${option.color}0E`, borderColor: `${option.color}28` }]}>
                    <Text style={styles.cardEmoji}>{option.emoji}</Text>
                </View>

                {/* Center info */}
                <View style={styles.cardContent}>
                    <Text style={styles.cardLabel}>{option.label}</Text>
                    <Text style={styles.cardSublabel}>{option.sublabel}</Text>
                    <Text style={styles.cardDesc}>{option.description}</Text>
                    <View style={styles.chipsRow}>
                        {option.actions.map((a, i) => (
                            <View key={i} style={[styles.chip, { borderColor: `${option.color}35`, backgroundColor: `${option.color}07` }]}>
                                <Text style={[styles.chipText, { color: option.color }]}>{a}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Right CTA */}
                <View style={styles.cardRight}>
                    {dispatching ? (
                        <ActivityIndicator color={option.color} size="small" />
                    ) : dispatched ? (
                        <View style={styles.dispatchedCheck}>
                            <Ionicons name="checkmark-circle" size={32} color={option.color} />
                            <Text style={[styles.sentText, { color: option.color }]}>Calling</Text>
                        </View>
                    ) : (
                        <LinearGradient
                            colors={[option.color, option.darkColor]}
                            style={styles.callBtn}
                        >
                            <Ionicons name="call" size={19} color="#fff" />
                        </LinearGradient>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function DispatchScreen({ navigation, route }) {
    const { language, fir } = route.params || {};
    const t = STRINGS[language] || STRINGS.en;

    const [dispatching, setDispatching] = useState(null);
    const [dispatched, setDispatched] = useState({});

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 560, useNativeDriver: true }),
            Animated.timing(headerSlide, { toValue: 0, duration: 560, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleDispatch = async (option) => {
        if (dispatched[option.id]) return;
        setDispatching(option.id);
        try {
            const phoneNumber = EMERGENCY_CONTACTS[option.id] || EMERGENCY_CONTACTS.police;
            await Linking.openURL(`tel:${phoneNumber}`);

            setDispatched(prev => ({ ...prev, [option.id]: true }));
            setTimeout(() => {
                setDispatching(null);
                navigation.navigate('Call', { language, option, fir });
            }, 1200);
        } catch (e) {
            console.error('Dispatch error:', e);
            setDispatching(null);
            Alert.alert('Dispatch Error', 'Please call emergency services directly.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
            <ParticleBackground intensity={0.6} />

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: headerSlide }] }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{t.dispatchHelp || 'Dispatch Emergency Help'}</Text>
                    <Text style={styles.headerSub}>FIR {fir?.referenceNumber}</Text>
                </View>
            </Animated.View>

            {/* Location strip */}
            <Animated.View style={[styles.locationStrip, { opacity: fadeAnim }]}>
                <Ionicons name="location" size={12} color={COLORS.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                    {fir?.location?.address || 'Location recorded'}
                </Text>
                <LiveDot />
                <Text style={styles.liveLabel}>LIVE</Text>
            </Animated.View>

            {/* Dispatch cards */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.Text style={[styles.chooseLabel, { opacity: fadeAnim }]}>
                    Choose emergency service to dispatch:
                </Animated.Text>

                {DISPATCH_OPTIONS.map((option, index) => (
                    <DispatchCard
                        key={option.id}
                        option={option}
                        dispatching={dispatching === option.id}
                        dispatched={dispatched[option.id]}
                        onPress={() => handleDispatch(option)}
                        index={index}
                    />
                ))}

                <Animated.View style={[styles.firReminder, { opacity: fadeAnim }]}>
                    <MaterialCommunityIcons name="file-check" size={15} color={COLORS.success} />
                    <Text style={styles.firReminderText}>
                        Show FIR <Text style={styles.firReminderRef}>{fir?.referenceNumber}</Text> to responding officers
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 14,
        paddingBottom: 13, paddingHorizontal: 16, gap: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F3F3',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#F7F7F7', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#EBEBEB',
    },
    headerCenter: { flex: 1 },
    headerTitle: { color: '#0D0D0D', fontSize: 17.5, fontWeight: '800' },
    headerSub: { color: '#C0C0C0', fontSize: 12, marginTop: 2 },

    // Location strip
    locationStrip: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: 'rgba(204,0,0,0.03)',
        paddingHorizontal: 16, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: 'rgba(204,0,0,0.06)',
    },
    locationText: { color: '#777', fontSize: 12, flex: 1 },
    livePulse: {
        position: 'absolute', width: 13, height: 13, borderRadius: 7,
        backgroundColor: '#FF4444', opacity: 0.5,
    },
    liveDotCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF4444', position: 'absolute' },
    liveLabel: { color: '#FF4444', fontSize: 9.5, fontWeight: '900', letterSpacing: 1 },

    // Content
    content: { padding: 16, gap: 10, paddingBottom: 44 },
    chooseLabel: {
        color: '#C0C0C0', fontSize: 12, fontWeight: '600',
        letterSpacing: 0.3, marginBottom: 4,
    },

    // Cards
    card: {
        borderRadius: 20, overflow: 'hidden',
        flexDirection: 'row', alignItems: 'center', padding: 15, gap: 13,
        borderWidth: 1.5, borderColor: '#F2F2F2',
        backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05, shadowRadius: 14, elevation: 4,
    },
    cardEmojiBg: {
        width: 58, height: 58, borderRadius: 17, alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, borderWidth: 1,
    },
    cardEmoji: { fontSize: 28 },
    cardContent: { flex: 1 },
    cardLabel: { color: '#0D0D0D', fontWeight: '800', fontSize: 14.5, marginBottom: 2 },
    cardSublabel: { color: '#C0C0C0', fontSize: 10.5, marginBottom: 5 },
    cardDesc: { color: '#888', fontSize: 11, lineHeight: 16.5, marginBottom: 9 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    chipText: { fontSize: 9.5, fontWeight: '800' },
    cardRight: { alignItems: 'center', justifyContent: 'center', width: 54 },
    callBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    dispatchedCheck: { alignItems: 'center', gap: 3 },
    sentText: { fontSize: 9.5, fontWeight: '800' },

    // FIR reminder
    firReminder: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: 'rgba(0,200,83,0.16)',
        borderRadius: 16, padding: 14, marginTop: 4,
        shadowColor: '#00C853', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    firReminderText: { color: '#666', fontSize: 13, flex: 1 },
    firReminderRef: { color: COLORS.primary, fontWeight: '800' },
});
