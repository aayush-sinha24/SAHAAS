import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Easing } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import FIRScreen from './src/screens/FIRScreen';
import DispatchScreen from './src/screens/DispatchScreen';
import CallScreen from './src/screens/CallScreen';

const Stack = createStackNavigator();

// Premium slide from right
const forSlideFromRight = ({ current, next, layouts }) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width, 0],
    extrapolate: 'clamp',
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.85, 1],
  });
  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });
  const nextOpacity = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] })
    : 1;
  return {
    cardStyle: { transform: [{ translateX }, { scale }], opacity },
    overlayStyle: { opacity: nextOpacity },
  };
};

// Scale up for Analysis
const forScaleUp = ({ current }) => {
  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.9, 1],
  });
  return { cardStyle: { transform: [{ scale }], opacity } };
};

// Slide up for Call screen
const forSlideUp = ({ current }) => {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
    extrapolate: 'clamp',
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.85, 1],
  });
  return { cardStyle: { transform: [{ translateY }], opacity } };
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#FFFFFF' },
              gestureEnabled: true,
              transitionSpec: {
                open: {
                  animation: 'spring',
                  config: { stiffness: 240, damping: 30, mass: 0.8, restSpeedThreshold: 0.001 },
                },
                close: {
                  animation: 'spring',
                  config: { stiffness: 240, damping: 30, mass: 0.8, restSpeedThreshold: 0.001 },
                },
              },
              cardStyleInterpolator: forSlideFromRight,
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Capture" component={CaptureScreen} />
            <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
            <Stack.Screen
              name="Analysis"
              component={AnalysisScreen}
              options={{
                cardStyleInterpolator: forScaleUp,
                transitionSpec: {
                  open: { animation: 'timing', config: { duration: 500, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) } },
                  close: { animation: 'timing', config: { duration: 400, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) } },
                },
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="FIR" component={FIRScreen} />
            <Stack.Screen name="Dispatch" component={DispatchScreen} />
            <Stack.Screen
              name="Call"
              component={CallScreen}
              options={{
                cardStyleInterpolator: forSlideUp,
                gestureEnabled: false,
                transitionSpec: {
                  open: { animation: 'spring', config: { stiffness: 180, damping: 26, mass: 1 } },
                  close: { animation: 'spring', config: { stiffness: 180, damping: 26, mass: 1 } },
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
