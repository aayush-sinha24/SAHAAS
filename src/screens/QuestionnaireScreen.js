import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STRINGS } from '../constants';
import ParticleBackground from '../components/ParticleBackground';

export default function QuestionnaireScreen({ navigation, route }) {
    const { language, videoUri, videoUrl, location, timestamp, duration, platePhotoUri } = route.params || {};
    const t = STRINGS[language] || STRINGS.en;

    const [injured, setInjured] = useState(null);
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [peopleCount, setPeopleCount] = useState(1);
    const [description, setDescription] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;
    const cardAnims = [1, 2, 3, 4].map(() => useRef(new Animated.Value(36)).current);
    const cardFades = [1, 2, 3, 4].map(() => useRef(new Animated.Value(0)).current);
    const counterScale = useRef(new Animated.Value(1)).current;
    const warningSlide = useRef(new Animated.Value(-18)).current;
    const warningFade = useRef(new Animated.Value(0)).current;

    const isReady = injured !== null && description.trim().length > 5;

    const progress = [
        injured !== null,
        true,
        peopleCount >= 1,
        description.trim().length > 5,
    ];
    const completedCount = progress.filter(Boolean).length;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
        ]).start();

        cardFades.forEach((anim, i) => {
            setTimeout(() => {
                Animated.timing(anim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
                Animated.timing(cardAnims[i], { toValue: 0, duration: 420, useNativeDriver: true }).start();
            }, 140 + i * 100);
        });
    }, []);

    useEffect(() => {
        if (injured === true) {
            Animated.parallel([
                Animated.timing(warningFade, { toValue: 1, duration: 320, useNativeDriver: true }),
                Animated.timing(warningSlide, { toValue: 0, duration: 320, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(warningFade, { toValue: 0, duration: 220, useNativeDriver: true }),
                Animated.timing(warningSlide, { toValue: -18, duration: 220, useNativeDriver: true }),
            ]).start();
        }
    }, [injured]);

    const animateCounter = () => {
        Animated.sequence([
            Animated.timing(counterScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.timing(counterScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
    };

    const handleAnalyze = () => {
        if (!isReady) return;
        navigation.navigate('Analysis', {
            language, videoUri, videoUrl, location, timestamp, platePhotoUri,
            answers: { injured, vehicleNumber: vehicleNumber.toUpperCase(), peopleCount, description },
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
            <ParticleBackground intensity={0.6} />

            {/* ── Header ── */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Incident Details</Text>
                    <Text style={styles.headerSub}>{completedCount}/4 answered</Text>
                </View>
                <View style={styles.progressBadgeWrap}>
                    <LinearGradient
                        colors={completedCount === 4 ? ['#00E676', '#00C853'] : ['#FF5F5F', '#CC0000']}
                        style={styles.progressBadge}
                    >
                        <Text style={styles.progressBadgeText}>{Math.round((completedCount / 4) * 100)}%</Text>
                    </LinearGradient>
                </View>
            </Animated.View>

            {/* Progress bar */}
            <View style={styles.progressBar}>
                <Animated.View style={{ width: `${(completedCount / 4) * 100}%`, opacity: fadeAnim }}>
                    <LinearGradient
                        colors={completedCount === 4 ? ['#00E676', '#00C853'] : ['#FF5F5F', '#FF9F43']}
                        style={styles.progressFill}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                </Animated.View>
                <View style={styles.progressDots}>
                    {[0, 1, 2, 3].map(i => (
                        <View key={i} style={[styles.progressDot, progress[i] && styles.progressDotActive]} />
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* ── Q1 — Injured ── */}
                <Animated.View style={[styles.card, { opacity: cardFades[0], transform: [{ translateY: cardAnims[0] }] }]}>
                    <View style={styles.cardInner}>
                        <View style={styles.qHeader}>
                            <View style={[styles.qBadge, injured !== null && styles.qBadgeDone]}>
                                {injured !== null
                                    ? <Ionicons name="checkmark" size={13} color="#fff" />
                                    : <Text style={styles.qBadgeNum}>1</Text>}
                            </View>
                            <Text style={styles.qText}>{t.question1 || 'Is anyone injured?'}</Text>
                        </View>
                        <View style={styles.yesNoRow}>
                            <TouchableOpacity
                                style={[styles.yesNoBtn, injured === true && styles.yesBtnActive]}
                                onPress={() => setInjured(true)}
                                activeOpacity={0.8}
                            >
                                {injured === true && (
                                    <LinearGradient colors={['#FF5F5F', COLORS.primary]} style={StyleSheet.absoluteFill} />
                                )}
                                <Ionicons name="warning" size={18} color={injured === true ? '#fff' : COLORS.primary} />
                                <Text style={[styles.yesNoText, injured === true && { color: '#fff' }]}>
                                    {t.yes || 'Yes'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.yesNoBtn, injured === false && styles.noBtnActive]}
                                onPress={() => setInjured(false)}
                                activeOpacity={0.8}
                            >
                                {injured === false && (
                                    <LinearGradient colors={['#00E676', '#00C853']} style={StyleSheet.absoluteFill} />
                                )}
                                <Ionicons name="checkmark-circle" size={18} color={injured === false ? '#fff' : COLORS.success} />
                                <Text style={[styles.yesNoText, injured === false && { color: '#fff' }]}>
                                    {t.no || 'No'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Animated.View style={[styles.warningBanner, {
                            opacity: warningFade,
                            transform: [{ translateY: warningSlide }],
                        }]}>
                            <Ionicons name="alert-circle" size={14} color="#E65100" />
                            <Text style={styles.warningText}>Medical help will be dispatched immediately!</Text>
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* ── Q2 — Vehicle Number ── */}
                <Animated.View style={[styles.card, { opacity: cardFades[1], transform: [{ translateY: cardAnims[1] }] }]}>
                    <View style={styles.cardInner}>
                        <View style={styles.qHeader}>
                            <View style={[styles.qBadge, vehicleNumber.length > 0 && styles.qBadgeDone]}>
                                {vehicleNumber.length > 0
                                    ? <Ionicons name="checkmark" size={13} color="#fff" />
                                    : <Text style={styles.qBadgeNum}>2</Text>}
                            </View>
                            <Text style={styles.qText}>{t.question2 || 'Vehicle Number (if any)'}</Text>
                        </View>
                        <View style={styles.vehiclePlate}>
                            <LinearGradient colors={['#003580', '#001f6b']} style={styles.plateFlag}>
                                <Text style={styles.plateIND}>🇮🇳{'\n'}IND</Text>
                            </LinearGradient>
                            <View style={styles.plateInputWrap}>
                                <TextInput
                                    style={styles.vehicleInput}
                                    value={vehicleNumber}
                                    onChangeText={setVehicleNumber}
                                    placeholder={t.enterVehicle || 'TS 09 AB 1234'}
                                    placeholderTextColor="rgba(0,0,0,0.22)"
                                    autoCapitalize="characters"
                                    returnKeyType="done"
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Q3 — People Count ── */}
                <Animated.View style={[styles.card, { opacity: cardFades[2], transform: [{ translateY: cardAnims[2] }] }]}>
                    <View style={styles.cardInner}>
                        <View style={styles.qHeader}>
                            <View style={[styles.qBadge, styles.qBadgeDone]}>
                                <Ionicons name="checkmark" size={13} color="#fff" />
                            </View>
                            <Text style={styles.qText}>{t.question3 || 'Number of people involved'}</Text>
                        </View>
                        <View style={styles.counterRow}>
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => { setPeopleCount(p => Math.max(1, p - 1)); animateCounter(); }}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={['#FF5F5F', COLORS.primary]} style={styles.counterBtnGrad}>
                                    <Ionicons name="remove" size={22} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                            <Animated.View style={[styles.counterDisplay, { transform: [{ scale: counterScale }] }]}>
                                <Text style={styles.counterNum}>{peopleCount}</Text>
                                <Text style={styles.counterLabel}>person{peopleCount > 1 ? 's' : ''}</Text>
                            </Animated.View>
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => { setPeopleCount(p => Math.min(99, p + 1)); animateCounter(); }}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={['#FF5F5F', COLORS.primary]} style={styles.counterBtnGrad}>
                                    <Ionicons name="add" size={22} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Q4 — Description ── */}
                <Animated.View style={[styles.card, { opacity: cardFades[3], transform: [{ translateY: cardAnims[3] }] }]}>
                    <View style={styles.cardInner}>
                        <View style={styles.qHeader}>
                            <View style={[styles.qBadge, description.trim().length > 5 && styles.qBadgeDone]}>
                                {description.trim().length > 5
                                    ? <Ionicons name="checkmark" size={13} color="#fff" />
                                    : <Text style={styles.qBadgeNum}>4</Text>}
                            </View>
                            <Text style={styles.qText}>{t.question4 || 'Describe what happened'}</Text>
                        </View>
                        <TextInput
                            style={styles.descInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder={t.enterDescription || 'Describe the incident in detail...'}
                            placeholderTextColor="rgba(0,0,0,0.25)"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <View style={styles.charRow}>
                            <View style={[styles.charBarTrack]}>
                                <View style={[styles.charBar, { width: `${Math.min(100, description.length / 2)}%` }]} />
                            </View>
                            <Text style={styles.charCount}>{description.length} chars</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Meta card */}
                <View style={styles.metaCard}>
                    <LinearGradient colors={['rgba(204,0,0,0.04)', 'rgba(204,0,0,0.01)']} style={styles.metaGrad}>
                        {[
                            { icon: 'location', text: location?.address || 'Location recorded' },
                            { icon: 'time', text: timestamp },
                            { icon: 'videocam', text: `Video: ${duration || 0}s recorded` },
                        ].map((item, i) => (
                            <View key={i} style={styles.metaRow}>
                                <View style={styles.metaIconWrap}>
                                    <Ionicons name={item.icon} size={12} color={COLORS.primary} />
                                </View>
                                <Text style={styles.metaText} numberOfLines={1}>{item.text}</Text>
                            </View>
                        ))}
                    </LinearGradient>
                </View>

                {/* Analyze Button */}
                <TouchableOpacity
                    style={[styles.analyzeBtn, !isReady && styles.analyzeBtnDisabled]}
                    onPress={handleAnalyze}
                    disabled={!isReady}
                    activeOpacity={0.88}
                >
                    <LinearGradient
                        colors={isReady ? ['#FF5F5F', '#CC0000', '#8B0000'] : ['#E8E8E8', '#DEDEDE']}
                        style={styles.analyzeGrad}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.analyzeIconWrap}>
                            <Ionicons name="analytics" size={22} color={isReady ? '#fff' : '#AAAAAA'} />
                        </View>
                        <Text style={[styles.analyzeBtnText, !isReady && { color: '#AAAAAA' }]}>
                            {t.analyzeAI || 'Analyze with AI →'}
                        </Text>
                        {isReady && <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.55)" />}
                    </LinearGradient>
                </TouchableOpacity>

                {!isReady && (
                    <Text style={styles.disabledHint}>Answer Q1 and Q4 to continue</Text>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 14,
        paddingBottom: 14, paddingHorizontal: 16, gap: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F4F4F4',
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#F7F7F7', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#ECECEC',
    },
    headerCenter: { flex: 1 },
    headerTitle: { color: '#0D0D0D', fontSize: 18, fontWeight: '800' },
    headerSub: { color: '#BBBBBB', fontSize: 12, marginTop: 2 },
    progressBadgeWrap: { borderRadius: 14, overflow: 'hidden' },
    progressBadge: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
    progressBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },

    // Progress bar
    progressBar: { height: 5, backgroundColor: '#F5F5F5', position: 'relative' },
    progressFill: { height: 5 },
    progressDots: {
        position: 'absolute', top: -2, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-evenly',
    },
    progressDot: {
        width: 9, height: 9, borderRadius: 5,
        backgroundColor: '#E5E5E5', borderWidth: 2, borderColor: '#F8F8F8',
    },
    progressDotActive: { backgroundColor: COLORS.primary, borderColor: '#FF5F5F' },

    // Scroll
    scroll: { padding: 16, gap: 12, paddingBottom: 50 },

    // Cards
    card: {
        borderRadius: 22, overflow: 'hidden',
        borderWidth: 1.5, borderColor: '#F2F2F2',
        backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05, shadowRadius: 14, elevation: 4,
    },
    cardInner: { padding: 18 },

    qHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 11 },
    qBadge: {
        width: 28, height: 28, borderRadius: 9, backgroundColor: '#F5F5F5',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: '#E8E8E8',
    },
    qBadgeDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    qBadgeNum: { color: '#999', fontSize: 12, fontWeight: '900' },
    qText: { color: '#0D0D0D', fontSize: 15, fontWeight: '700', flex: 1 },

    // Yes/No
    yesNoRow: { flexDirection: 'row', gap: 10 },
    yesNoBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 15, borderRadius: 15, borderWidth: 1.5,
        borderColor: '#EBEBEB', overflow: 'hidden', backgroundColor: '#FAFAFA',
    },
    yesBtnActive: { borderColor: COLORS.primary },
    noBtnActive: { borderColor: COLORS.success },
    yesNoText: { color: '#666', fontWeight: '700', fontSize: 15 },

    // Warning
    warningBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,165,0,0.06)', borderRadius: 12,
        padding: 11, marginTop: 13,
        borderWidth: 1, borderColor: 'rgba(255,165,0,0.18)',
    },
    warningText: { color: '#E65100', fontSize: 12, fontWeight: '600', flex: 1 },

    // Vehicle plate
    vehiclePlate: {
        flexDirection: 'row', alignItems: 'stretch',
        backgroundColor: '#fff', borderRadius: 13, overflow: 'hidden',
        borderWidth: 2.5, borderColor: '#1a1a2e',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
    },
    plateFlag: { paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
    plateIND: { color: '#fff', fontWeight: '900', fontSize: 10, textAlign: 'center' },
    plateInputWrap: { flex: 1 },
    vehicleInput: {
        flex: 1, padding: 14, fontSize: 18,
        fontWeight: '900', color: '#111', letterSpacing: 3,
    },

    // Counter
    counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 26 },
    counterBtn: { borderRadius: 28, overflow: 'hidden' },
    counterBtnGrad: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 27 },
    counterDisplay: { alignItems: 'center', minWidth: 90 },
    counterNum: { color: '#0D0D0D', fontSize: 52, fontWeight: '900' },
    counterLabel: { color: '#BBBBBB', fontSize: 13 },

    // Description
    descInput: {
        color: '#222', fontSize: 14.5, lineHeight: 22,
        borderWidth: 1.5, borderColor: '#EBEBEB',
        borderRadius: 14, padding: 14, minHeight: 110,
        backgroundColor: '#FAFAFA',
    },
    charRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    charBarTrack: {
        flex: 1, height: 3, backgroundColor: '#F0F0F0',
        borderRadius: 2, marginRight: 10, overflow: 'hidden',
    },
    charBar: {
        height: 3, backgroundColor: COLORS.primary, borderRadius: 2,
    },
    charCount: { color: '#D0D0D0', fontSize: 11 },

    // Meta
    metaCard: {
        borderRadius: 18, overflow: 'hidden',
        borderWidth: 1.5, borderColor: 'rgba(204,0,0,0.08)',
        backgroundColor: '#fff',
        shadowColor: '#CC0000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    metaGrad: { padding: 15, gap: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    metaIconWrap: {
        width: 28, height: 28, borderRadius: 9,
        backgroundColor: 'rgba(204,0,0,0.06)', alignItems: 'center', justifyContent: 'center',
    },
    metaText: { color: '#777', fontSize: 12, flex: 1 },

    // Analyze button
    analyzeBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 4 },
    analyzeBtnDisabled: { opacity: 0.6 },
    analyzeGrad: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 20, gap: 10,
    },
    analyzeIconWrap: {
        width: 40, height: 40, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    analyzeBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3, flex: 1, textAlign: 'center' },
    disabledHint: { color: '#D0D0D0', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
