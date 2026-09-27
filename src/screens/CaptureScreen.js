import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    Animated, Dimensions, Platform, Linking, Alert, Image,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, STRINGS, APP_CONFIG } from '../constants';
import ParticleBackground from '../components/ParticleBackground';
import { uploadVideoToServer } from '../services/videoUploadService';
import * as FileSystem from 'expo-file-system/legacy';

const { width, height } = Dimensions.get('window');
const MIN_DURATION = 10;
const MAX_DURATION = 30;

// Corner bracket for the camera viewfinder
function CornerBracket({ position }) {
    const style = {
        topLeft:     { top: 0, left: 0,  borderTopWidth: 3, borderLeftWidth: 3 },
        topRight:    { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
        bottomLeft:  { bottom: 0, left: 0,  borderBottomWidth: 3, borderLeftWidth: 3 },
        bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
    }[position];
    return <View style={[styles.corner, style]} />;
}

// Blinking REC indicator
function RecIndicator({ blinkAnim }) {
    return (
        <View style={styles.recRow}>
            <Animated.View style={[styles.recDot, { opacity: blinkAnim }]} />
            <Text style={styles.recText}>REC</Text>
        </View>
    );
}

export default function CaptureScreen({ navigation, route }) {
    const language = route?.params?.language || 'en';
    const t = STRINGS[language] || STRINGS.en;

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState('Acquiring location...');
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [facing, setFacing] = useState('back');
    const [videoUri, setVideoUri] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoUrl, setVideoUrl] = useState(null);

    // ── Photo capture state ──────────────────────────────────────────────────
    const [photoMode, setPhotoMode] = useState(false);         // show plate camera
    const [platePhotoUri, setPlatePhotoUri] = useState(null);  // captured plate photo
    const [platePhotoAnim] = useState(new Animated.Value(0));  // slide-in for plate section

    const cameraRef = useRef(null);
    const timerRef = useRef(null);
    const videoUriRef = useRef(null);
    const isRecordingRef = useRef(false);
    const recordingResolveRef = useRef(null);
    const blinkAnim = useRef(new Animated.Value(1)).current;
    const previewFade = useRef(new Animated.Value(0)).current;
    const uploadBarWidth = useRef(new Animated.Value(0)).current;
    const hintFade = useRef(new Animated.Value(0)).current;
    const progressBarAnim = useRef(new Animated.Value(0)).current;
    const now = new Date();

    useEffect(() => {
        setupPermissions();
        startBlink();
        startHintFade();
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (elapsed >= MAX_DURATION && isRecording) stopRecording();
    }, [elapsed]);

    useEffect(() => {
        if (showPreview) {
            Animated.timing(previewFade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
            // Slide in the plate photo section
            Animated.timing(platePhotoAnim, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }).start();
        } else {
            previewFade.setValue(0);
            platePhotoAnim.setValue(0);
        }
    }, [showPreview]);

    useEffect(() => {
        Animated.timing(uploadBarWidth, {
            toValue: uploadProgress / 100,
            duration: 380, useNativeDriver: false,
        }).start();
    }, [uploadProgress]);

    useEffect(() => {
        Animated.timing(progressBarAnim, {
            toValue: elapsed / MAX_DURATION,
            duration: 920, useNativeDriver: false,
        }).start();
    }, [elapsed]);

    const startHintFade = () => {
        setTimeout(() => {
            Animated.timing(hintFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
        }, 600);
    };

    const setupPermissions = async () => {
        if (!cameraPermission?.granted) await requestCameraPermission();
        if (!micPermission?.granted) await requestMicPermission();
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                setLocation(loc.coords);
                const geocoded = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude, longitude: loc.coords.longitude,
                });
                if (geocoded.length > 0) {
                    const g = geocoded[0];
                    setAddress(`${g.street || ''} ${g.name || ''}, ${g.district || g.subregion || ''}, ${g.city || APP_CONFIG.city}`);
                }
            } catch {
                setAddress(`${APP_CONFIG.city}, ${APP_CONFIG.state}`);
                setLocation({ latitude: 17.3850, longitude: 78.4867 });
            }
        }
    };

    const startBlink = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    };

    const startRecording = async () => {
        if (!cameraRef.current) return;
        setIsRecording(true);
        isRecordingRef.current = true;
        setElapsed(0);
        setVideoUrl(null);
        setUploadStatus('idle');
        setUploadProgress(0);
        videoUriRef.current = null;
        timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
        try {
            const video = await cameraRef.current.recordAsync({ maxDuration: MAX_DURATION });
            if (video?.uri) {
                videoUriRef.current = video.uri;
                setVideoUri(video.uri);
                if (recordingResolveRef.current) {
                    recordingResolveRef.current(video.uri);
                    recordingResolveRef.current = null;
                }
            }
        } catch (e) {
            console.error('Recording error:', e);
            if (recordingResolveRef.current) {
                recordingResolveRef.current(null);
                recordingResolveRef.current = null;
            }
        }
    };

    const stopRecording = async () => {
        if (!isRecordingRef.current) return;
        isRecordingRef.current = false;
        clearInterval(timerRef.current);
        setIsRecording(false);

        const uriPromise = new Promise((resolve) => {
            if (videoUriRef.current) {
                resolve(videoUriRef.current);
            } else {
                recordingResolveRef.current = resolve;
            }
        });

        try { cameraRef.current?.stopRecording(); } catch { }

        const uri = await Promise.race([
            uriPromise,
            new Promise(resolve => setTimeout(() => resolve(videoUriRef.current), 5000)),
        ]);

        if (uri) {
            setVideoUri(uri);
            setShowPreview(true);
            startUpload(uri);
        } else {
            goToQuestionnaire(null, null);
        }
    };

    const startUpload = async (uri) => {
        setUploadStatus('uploading');
        setUploadProgress(5);
        try {
            const url = await uploadVideoToServer(uri, pct => setUploadProgress(pct));
            setVideoUrl(url);
            setUploadStatus('done');
            setUploadProgress(100);
        } catch (e) {
            console.error('Upload error:', e.message);
            setUploadStatus('error');
        }
    };

    // ── Take number plate photo ─────────────────────────────────────────────
    const handleTakePlatePhoto = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });

            // ── Immediately copy to permanent storage ──────────────────────────
            // takePictureAsync returns a temp cache URI that can be GC'd before
            // the PDF is generated (several screens later). Copy to documentDirectory
            // right now so the URI stays valid for the entire app session.
            let permanentUri = photo.uri; // fallback to original if copy fails
            try {
                const dir = FileSystem.documentDirectory + 'sahaas_evidence/';
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
                const dest = dir + `plate_${Date.now()}.jpg`;
                await FileSystem.copyAsync({ from: photo.uri, to: dest });
                permanentUri = dest;
                console.log('[Capture] Plate photo saved permanently:', permanentUri);
            } catch (copyErr) {
                console.warn('[Capture] Could not copy plate photo, using temp URI:', copyErr.message);
            }

            setPlatePhotoUri(permanentUri);
            setPhotoMode(false);
            // Animate the thumbnail in
            Animated.spring(platePhotoAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
        } catch (e) {
            console.error('Photo capture error:', e);
            Alert.alert('Error', 'Could not take photo. Please try again.');
        }
    };

    const goToQuestionnaire = (uri, url) => {
        const timestamp = now.toLocaleString('en-IN', {
            dateStyle: 'full', timeStyle: 'medium', timeZone: 'Asia/Kolkata',
        });
        navigation.navigate('Questionnaire', {
            language,
            videoUri: uri || null,
            videoUrl: url || null,
            platePhotoUri: platePhotoUri || null,   // pass plate photo
            location: location
                ? { ...location, address }
                : { latitude: 17.3850, longitude: 78.4867, address: `${APP_CONFIG.city}, ${APP_CONFIG.state}` },
            timestamp,
            duration: elapsed,
        });
    };

    const formatTime = s =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const formatDateTime = () => now.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata',
    });

    // ── Permission loading ──
    if (!cameraPermission) return (
        <View style={[styles.container, styles.center, { backgroundColor: '#FFFFFF' }]}>
            <ParticleBackground intensity={0.5} />
            <View style={styles.permIconWrap}>
                <Ionicons name="videocam-outline" size={50} color={COLORS.primary} />
            </View>
            <Text style={styles.permText}>Loading camera...</Text>
            <Text style={styles.permSub}>Please wait a moment</Text>
        </View>
    );

    // ── Permission denied ──
    if (!cameraPermission.granted) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: '#FFFFFF' }]}>
                <ParticleBackground intensity={0.5} />
                <View style={styles.permIconWrap}>
                    <Ionicons name="camera-outline" size={50} color={COLORS.primary} />
                </View>
                <Text style={styles.permText}>Camera permission needed</Text>
                <Text style={styles.permSub}>Required to record the incident video</Text>
                <TouchableOpacity style={styles.permButton} onPress={requestCameraPermission}>
                    <LinearGradient colors={['#FF5F5F', COLORS.primary]} style={styles.permBtnGrad}>
                        <Ionicons name="camera" size={18} color="#fff" />
                        <Text style={styles.permButtonText}>Grant Camera Access</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    // ── NUMBER PLATE PHOTO MODE (full-screen camera for plate) ───────────────
    if (photoMode && showPreview) {
        return (
            <View style={styles.container}>
                <StatusBar hidden />
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
                <LinearGradient
                    colors={['rgba(0,0,0,0.72)', 'transparent', 'rgba(0,0,0,0.88)']}
                    style={StyleSheet.absoluteFill}
                    locations={[0, 0.4, 1]}
                    pointerEvents="none"
                />

                {/* Header */}
                <View style={styles.photoModeHeader}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setPhotoMode(false)}>
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.photoModeTitle}>📸 Number Plate Photo</Text>
                        <Text style={styles.photoModeSub}>Point camera at vehicle plate • Keep steady</Text>
                    </View>
                </View>

                {/* Plate frame guide */}
                <View style={styles.plateFrame} pointerEvents="none">
                    <View style={[styles.corner, styles.cornerPlate, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
                    <View style={[styles.corner, styles.cornerPlate, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
                    <View style={[styles.corner, styles.cornerPlate, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
                    <View style={[styles.corner, styles.cornerPlate, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
                    <Text style={styles.plateGuideText}>Align number plate within frame</Text>
                </View>

                {/* Capture button */}
                <View style={styles.photoCaptureRow}>
                    <TouchableOpacity style={styles.photoCaptureBtn} onPress={handleTakePlatePhoto} activeOpacity={0.8}>
                        <LinearGradient colors={['#1565c0', '#0d47a1']} style={styles.photoCaptureBtnGrad}>
                            <Ionicons name="camera" size={30} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.photoCaptureLabel}>Tap to capture plate</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mode="video" />

            {/* Cinematic gradient overlays */}
            <LinearGradient
                colors={['rgba(0,0,0,0.74)', 'rgba(0,0,0,0.08)', 'transparent', 'rgba(0,0,0,0.84)']}
                style={StyleSheet.absoluteFill}
                locations={[0, 0.18, 0.55, 1]}
                pointerEvents="none"
            />

            {/* ── POST-RECORDING OVERLAY (WHITE PREMIUM) ── */}
            {showPreview && (
                <Animated.View style={[styles.overlay, { opacity: previewFade }]}>
                    {/* Pure white background */}
                    <LinearGradient
                        colors={['#FFFFFF', '#FAFAFA', '#FFFFFF']}
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                        colors={['rgba(204,0,0,0.04)', 'transparent']}
                        style={styles.overlayTopBar}
                        pointerEvents="none"
                    />

                    {/* Header */}
                    <View style={styles.overlayHeader}>
                        <View style={styles.overlayHeaderLeft}>
                            <LinearGradient colors={['#00E676', '#00C853']} style={styles.overlayHeaderIcon}>
                                <MaterialCommunityIcons name="shield-check" size={15} color="#fff" />
                            </LinearGradient>
                            <View>
                                <Text style={styles.overlayTitle}>Incident Recorded</Text>
                                <Text style={styles.overlaySubTitle}>Ready to upload & analyze</Text>
                            </View>
                        </View>
                        <View style={styles.durationBadge}>
                            <Ionicons name="time" size={11} color="#fff" />
                            <Text style={styles.durationText}>{elapsed}s</Text>
                        </View>
                    </View>

                    {/* Video thumbnail area */}
                    {videoUri ? (
                        <TouchableOpacity
                            style={styles.videoPreview}
                            onPress={() => Linking.openURL(videoUri)}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0.6)']}
                                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                            />
                            <View style={styles.playIconWrap}>
                                <LinearGradient colors={['#FF5F5F', '#CC0000']} style={styles.playBtnGrad}>
                                    <Ionicons name="play" size={26} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.playVideoText}>Tap to play recorded video</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.videoPlaceholder}>
                            <View style={styles.videoPlaceholderIcon}>
                                <Ionicons name="videocam" size={36} color={COLORS.accent} />
                            </View>
                            <Text style={styles.videoPlaceholderText}>Processing video...</Text>
                        </View>
                    )}

                    {/* Upload Status Card */}
                    <View style={styles.uploadCard}>
                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressFill, {
                                width: uploadBarWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                backgroundColor:
                                    uploadStatus === 'done' ? COLORS.success
                                    : uploadStatus === 'error' ? COLORS.primary
                                    : '#4E67EB',
                            }]} />
                        </View>

                        {uploadStatus === 'idle' && (
                            <View style={styles.statusRow}>
                                <Ionicons name="cloud-upload-outline" size={14} color="#CCCCCC" />
                                <Text style={styles.statusTextDim}>Preparing upload...</Text>
                            </View>
                        )}
                        {uploadStatus === 'uploading' && (
                            <View style={styles.statusRow}>
                                <MaterialCommunityIcons name="cloud-upload" size={14} color="#4E67EB" />
                                <Text style={[styles.statusText, { color: '#4E67EB' }]}>
                                    ☁️ Uploading to cloud... {uploadProgress}%  (please wait)
                                </Text>
                            </View>
                        )}
                        {uploadStatus === 'done' && videoUrl && (
                            <>
                                <View style={styles.statusRow}>
                                    <Ionicons name="cloud-done" size={14} color={COLORS.success} />
                                    <Text style={[styles.statusText, { color: COLORS.success }]}>
                                        ✅ Video uploaded! Link embedded in FIR PDF.
                                    </Text>
                                </View>
                                <Text style={styles.urlPreview} numberOfLines={1}>{videoUrl}</Text>
                            </>
                        )}
                        {uploadStatus === 'error' && (
                            <View style={styles.statusRow}>
                                <Ionicons name="warning" size={14} color={COLORS.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.statusText, { color: COLORS.primary }]}>Upload failed — tap Retry before continuing</Text>
                                    <TouchableOpacity onPress={() => startUpload(videoUri)}>
                                        <Text style={styles.retryText}>↺ Tap to Retry Upload</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── NUMBER PLATE PHOTO SECTION (optional) ── */}
                    <Animated.View style={[styles.plateSection, { opacity: platePhotoAnim }]}>
                        {platePhotoUri ? (
                            /* Plate captured — show thumbnail + retake option */
                            <View style={styles.plateCapturedCard}>
                                <Image source={{ uri: platePhotoUri }} style={styles.plateThumbnail} resizeMode="cover" />
                                <View style={styles.plateCapturedInfo}>
                                    <View style={styles.plateCapturedBadge}>
                                        <Ionicons name="camera" size={11} color="#fff" />
                                        <Text style={styles.plateCapturedBadgeText}>PLATE PHOTO</Text>
                                    </View>
                                    <Text style={styles.plateCapturedTitle}>Number Plate Captured</Text>
                                    <Text style={styles.plateCapturedSub}>Will be included in FIR evidence</Text>
                                    <TouchableOpacity onPress={() => setPhotoMode(true)} style={styles.retakePlateBtn}>
                                        <Ionicons name="refresh" size={11} color="#1565c0" />
                                        <Text style={styles.retakePlateBtnText}>Retake Photo</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            /* No plate photo yet — optional prompt */
                            <View style={styles.platePromptCard}>
                                <View style={styles.platePromptLeft}>
                                    <View style={styles.platePromptIcon}>
                                        <Text style={{ fontSize: 22 }}>🪪</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.platePromptTitle}>Add Number Plate Photo?</Text>
                                        <Text style={styles.platePromptSub}>Optional — if plate wasn't visible in video</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.platePhotoBtn}
                                    onPress={() => setPhotoMode(true)}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient colors={['#1e88e5', '#1565c0']} style={styles.platePhotoBtnGrad}>
                                        <Ionicons name="camera" size={16} color="#fff" />
                                        <Text style={styles.platePhotoBtnText}>Take Photo</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>

                    {/* Next Button — locked while uploading */}
                    <TouchableOpacity
                        style={[styles.nextBtn, (uploadStatus === 'uploading' || uploadStatus === 'idle') && { opacity: 0.45 }]}
                        onPress={() => {
                            if (uploadStatus === 'uploading' || uploadStatus === 'idle') return;
                            goToQuestionnaire(videoUri, videoUrl);
                        }}
                        activeOpacity={0.88}
                    >
                        <LinearGradient
                            colors={
                                (uploadStatus === 'uploading' || uploadStatus === 'idle')
                                    ? ['#C8C8C8', '#B8B8B8']
                                    : ['#FF5F5F', COLORS.primary, COLORS.primaryDark]
                            }
                            style={styles.nextBtnGrad}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="document-text" size={19} color="#fff" />
                            <Text style={styles.nextBtnText}>
                                {(uploadStatus === 'uploading' || uploadStatus === 'idle')
                                    ? '⏳ Uploading video... please wait'
                                    : uploadStatus === 'error'
                                        ? 'Continue Without Cloud Video →'
                                        : 'Next: Add Incident Details →'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.rerecordBtn}
                        onPress={() => {
                            setShowPreview(false); setVideoUri(null);
                            videoUriRef.current = null; setElapsed(0);
                            setVideoUrl(null); setUploadStatus('idle'); setUploadProgress(0);
                            setPlatePhotoUri(null);
                        }}
                    >
                        <Ionicons name="refresh" size={13} color="#CCCCCC" />
                        <Text style={styles.rerecordText}>Re-record video</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* ── LIVE CAMERA UI ── */}
            {!showPreview && (
                <>
                    <View style={styles.viewfinder} pointerEvents="none">
                        <CornerBracket position="topLeft" />
                        <CornerBracket position="topRight" />
                        <CornerBracket position="bottomLeft" />
                        <CornerBracket position="bottomRight" />
                    </View>

                    <View style={styles.topOverlay}>
                        {isRecording && <RecIndicator blinkAnim={blinkAnim} />}
                        <View style={styles.geoBadge}>
                            <MaterialCommunityIcons name="shield-check" size={10} color={COLORS.accent} />
                            <Text style={styles.geoBadgeText}>SAHAAS VERIFIED</Text>
                        </View>
                        <View style={styles.geoRow}>
                            <Ionicons name="location" size={11} color={COLORS.accent} />
                            <Text style={styles.geoText} numberOfLines={1}>{address}</Text>
                        </View>
                        {location && (
                            <Text style={styles.coordText}>
                                {location.latitude?.toFixed(5)}°N  {location.longitude?.toFixed(5)}°E
                            </Text>
                        )}
                        <Text style={styles.dateText}>{formatDateTime()}</Text>
                    </View>

                    {isRecording && (
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
                            <Text style={styles.timerSub}>/ {MAX_DURATION}s</Text>
                            {elapsed < MIN_DURATION && (
                                <View style={styles.holdBadge}>
                                    <Text style={styles.holdText}>Hold {MIN_DURATION - elapsed}s more</Text>
                                </View>
                            )}
                            <View style={styles.timerProgressBg}>
                                <Animated.View style={[styles.timerProgressFill, {
                                    width: progressBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                    backgroundColor: elapsed < MIN_DURATION ? COLORS.accent : COLORS.primary,
                                }]} />
                            </View>
                        </View>
                    )}

                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={styles.sideBtn}
                            onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
                        >
                            <Ionicons name="camera-reverse" size={24} color="#fff" />
                        </TouchableOpacity>

                        {!isRecording ? (
                            <TouchableOpacity style={styles.recordBtn} onPress={startRecording}>
                                <LinearGradient
                                    colors={[COLORS.primaryLight, COLORS.primary, COLORS.primaryDark]}
                                    style={styles.recordBtnInner}
                                >
                                    <Ionicons name="videocam" size={34} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.recordBtn, elapsed < MIN_DURATION && styles.recordBtnDim]}
                                onPress={elapsed >= MIN_DURATION ? stopRecording : undefined}
                            >
                                <LinearGradient
                                    colors={elapsed >= MIN_DURATION ? ['#FF4444', '#CC0000'] : ['#666', '#555']}
                                    style={styles.recordBtnInner}
                                >
                                    <Ionicons name="stop" size={34} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {!isRecording && (
                        <Animated.View style={[styles.hint, { opacity: hintFade }]}>
                            <LinearGradient
                                colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.56)']}
                                style={styles.hintGrad}
                            >
                                <Ionicons name="videocam" size={14} color={COLORS.accent} />
                                <Text style={styles.hintText}>Tap to start recording (10–30 seconds)</Text>
                            </LinearGradient>
                        </Animated.View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 },

    // Permission screens
    permIconWrap: {
        width: 114, height: 114, borderRadius: 34,
        backgroundColor: 'rgba(204,0,0,0.06)', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(204,0,0,0.13)', marginBottom: 8,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1, shadowRadius: 18, elevation: 6,
    },
    permText: { color: '#0D0D0D', fontSize: 18, fontWeight: '700', textAlign: 'center' },
    permSub: { color: '#AAAAAA', fontSize: 13, textAlign: 'center', marginTop: 4 },
    permButton: { borderRadius: 18, overflow: 'hidden', marginTop: 14 },
    permBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 30, paddingVertical: 16 },
    permButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    // Post-recording overlay (PREMIUM WHITE)
    overlay: {
        ...StyleSheet.absoluteFillObject, zIndex: 10,
        paddingTop: Platform.OS === 'ios' ? 56 : 30,
        paddingHorizontal: 16, paddingBottom: 18,
    },
    overlayTopBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
    overlayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    overlayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
    overlayHeaderIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    overlayTitle: { color: '#0D0D0D', fontSize: 20, fontWeight: '900' },
    overlaySubTitle: { color: '#BBBBBB', fontSize: 11.5, marginTop: 1 },
    durationBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: COLORS.success, borderRadius: 13,
        paddingHorizontal: 13, paddingVertical: 6,
    },
    durationText: { color: '#fff', fontWeight: '900', fontSize: 13 },

    videoPreview: {
        width: '100%', height: height * 0.22, borderRadius: 18,
        backgroundColor: '#111', marginBottom: 10,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
    },
    playIconWrap: { marginBottom: 8 },
    playBtnGrad: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    playVideoText: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: '600' },

    videoPlaceholder: {
        width: '100%', height: height * 0.22, borderRadius: 18,
        backgroundColor: '#F8F8F8', marginBottom: 10,
        alignItems: 'center', justifyContent: 'center', gap: 10,
        borderWidth: 1.5, borderColor: '#EBEBEB',
    },
    videoPlaceholderIcon: {
        width: 68, height: 68, borderRadius: 20,
        backgroundColor: 'rgba(255,165,0,0.08)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,165,0,0.18)',
    },
    videoPlaceholderText: { color: '#C8C8C8', fontSize: 13 },

    uploadCard: {
        backgroundColor: '#F8F9FA', borderRadius: 16,
        borderWidth: 1, borderColor: '#EBEBEB',
        padding: 13, marginBottom: 10, gap: 8,
    },
    progressTrack: { height: 5, backgroundColor: '#E8E8E8', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 5, borderRadius: 3 },
    statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    statusText: { fontSize: 12.5, flex: 1, fontWeight: '600' },
    statusTextDim: { color: '#C8C8C8', fontSize: 12.5 },
    urlPreview: { color: '#C0C0C0', fontSize: 10, marginTop: 2 },
    retryText: { color: '#4E67EB', fontSize: 12, marginTop: 5, fontWeight: '700' },

    // ── Number plate photo section ────────────────────────────────────────────
    plateSection: { marginBottom: 10 },

    platePromptCard: {
        backgroundColor: '#fff', borderRadius: 16,
        borderWidth: 1.5, borderColor: 'rgba(21,101,192,0.14)',
        padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
        shadowColor: '#1565c0', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    platePromptLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    platePromptIcon: {
        width: 44, height: 44, borderRadius: 13,
        backgroundColor: 'rgba(21,101,192,0.07)',
        alignItems: 'center', justifyContent: 'center',
    },
    platePromptTitle: { color: '#0D0D0D', fontWeight: '800', fontSize: 13 },
    platePromptSub: { color: '#AAAAAA', fontSize: 11, marginTop: 2 },
    platePhotoBtn: { borderRadius: 13, overflow: 'hidden' },
    platePhotoBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
    platePhotoBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    plateCapturedCard: {
        backgroundColor: '#fff', borderRadius: 16,
        borderWidth: 1.5, borderColor: 'rgba(21,101,192,0.2)',
        overflow: 'hidden', flexDirection: 'row', alignItems: 'stretch',
        shadowColor: '#1565c0', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
    },
    plateThumbnail: { width: 100, height: 80 },
    plateCapturedInfo: { flex: 1, padding: 10 },
    plateCapturedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#1565c0', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 5,
    },
    plateCapturedBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
    plateCapturedTitle: { color: '#0D0D0D', fontWeight: '800', fontSize: 13 },
    plateCapturedSub: { color: '#AAAAAA', fontSize: 10.5, marginTop: 2 },
    retakePlateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    retakePlateBtnText: { color: '#1565c0', fontSize: 11, fontWeight: '700' },

    // Photo mode (plate camera)
    photoModeHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        position: 'absolute', top: Platform.OS === 'ios' ? 54 : 28,
        left: 14, right: 14, zIndex: 20,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    },
    photoModeTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
    photoModeSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },
    plateFrame: {
        position: 'absolute', left: '8%', right: '8%',
        top: '30%', bottom: '35%',
        alignItems: 'center', justifyContent: 'flex-end',
    },
    cornerPlate: { borderColor: '#1e88e5', width: 32, height: 32 },
    plateGuideText: {
        color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600',
        marginBottom: -30, letterSpacing: 0.3,
    },
    photoCaptureRow: {
        position: 'absolute', bottom: 52, left: 0, right: 0,
        alignItems: 'center', gap: 10,
    },
    photoCaptureBtn: { shadowColor: '#1565c0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
    photoCaptureBtnGrad: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' },
    photoCaptureLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },

    nextBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 10 },
    nextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
    nextBtnText: { color: '#fff', fontSize: 15.5, fontWeight: '800' },

    rerecordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
    rerecordText: { color: '#CCCCCC', fontSize: 13 },

    // Camera UI (dark — unchanged)
    viewfinder: { position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '25%' },
    corner: { position: 'absolute', width: 24, height: 24, borderColor: 'rgba(255,165,0,0.82)' },
    topOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 24, left: 14, right: 14 },
    recRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    recDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.primary, marginRight: 6 },
    recText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 2.5 },
    geoBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6,
        borderWidth: 1, borderColor: 'rgba(255,165,0,0.5)',
    },
    geoBadgeText: { color: COLORS.accent, fontWeight: '900', fontSize: 10, letterSpacing: 1.2 },
    geoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
    geoText: { color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '600', flex: 1 },
    coordText: {
        color: COLORS.accent, fontSize: 11, marginBottom: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    dateText: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '600' },

    timerContainer: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' },
    timerText: { color: '#fff', fontSize: 54, fontWeight: '900', textShadowColor: 'rgba(204,0,0,0.88)', textShadowRadius: 22, textShadowOffset: { width: 0, height: 0 } },
    timerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: -6 },
    holdBadge: { backgroundColor: 'rgba(255,165,0,0.2)', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,165,0,0.4)', marginTop: 9 },
    holdText: { color: COLORS.accent, fontSize: 12, fontWeight: '700' },
    timerProgressBg: { width: 140, height: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 3, overflow: 'hidden', marginTop: 13 },
    timerProgressFill: { height: 5, borderRadius: 3 },

    controls: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
    sideBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)' },
    recordBtn: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.72, shadowRadius: 18, elevation: 16 },
    recordBtnInner: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    recordBtnDim: { opacity: 0.5 },

    hint: { position: 'absolute', bottom: 160, left: 20, right: 20, borderRadius: 14, overflow: 'hidden' },
    hintGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14 },
    hintText: { color: 'rgba(255,255,255,0.88)', fontSize: 12.5, textAlign: 'center', flex: 1 },
});
