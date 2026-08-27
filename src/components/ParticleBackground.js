import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Premium light-theme floating orbs — ultra-subtle, pure white luxury
const BLOB_COLORS = [
  'rgba(204,0,0,0.045)',
  'rgba(255,107,107,0.035)',
  'rgba(78,103,235,0.03)',
  'rgba(255,159,67,0.04)',
  'rgba(124,77,255,0.025)',
];

function FloatOrb({ cx, cy, color, size, duration, delay = 0 }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 1400, delay, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, { toValue: -14, duration, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.06, duration, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.95, duration, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: cx - size / 2,
        top: cy - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
}

function SparkDot({ x, y, color, delay }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      opacity.setValue(0);
      translateY.setValue(0);
      Animated.sequence([
        Animated.delay(delay + Math.random() * 3000),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.45, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -28, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(() => setTimeout(run, 1200 + Math.random() * 3000));
    };
    run();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

const SPARK_COLORS = [
  'rgba(204,0,0,0.3)',
  'rgba(255,107,107,0.25)',
  'rgba(78,103,235,0.22)',
  'rgba(255,159,67,0.3)',
  'rgba(124,77,255,0.22)',
  'rgba(0,200,83,0.22)',
];

export default function ParticleBackground({ intensity = 1 }) {
  const sparkCount = Math.floor(10 * intensity);
  const sparks = Array.from({ length: sparkCount }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height * 0.85,
    color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    delay: i * 220,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <FloatOrb cx={width * 0.08}  cy={height * 0.06}  color={BLOB_COLORS[0]} size={width * 0.75} duration={4400} delay={0} />
      <FloatOrb cx={width * 0.94}  cy={height * 0.28}  color={BLOB_COLORS[2]} size={width * 0.62} duration={5200} delay={400} />
      <FloatOrb cx={width * 0.12}  cy={height * 0.74}  color={BLOB_COLORS[3]} size={width * 0.56} duration={3900} delay={200} />
      <FloatOrb cx={width * 0.85}  cy={height * 0.84}  color={BLOB_COLORS[4]} size={width * 0.52} duration={4700} delay={600} />
      {sparks.map(({ id, ...props }) => <SparkDot key={id} {...props} />)}
    </View>
  );
}

const styles = StyleSheet.create({});
