import {Dimensions, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useLayoutEffect} from 'react';
import {
  Canvas,
  Circle,
  Path,
  Rect,
  Skia,
  useSharedValueEffect,
  useValue,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {polar2Canvas} from 'react-native-redash';
const {width, height} = Dimensions.get('window');
const ghost = require('./ghost.png');

const App = () => {
  const strokeWidth = 20;
  const center = width / 2;
  const r = (width - strokeWidth) / 2 - 40;
  const startAngle = Math.PI;
  const endAngle = Math.PI * 2;
  const x1 = center - r * Math.cos(startAngle);
  const y1 = -r * Math.sin(startAngle) + center;
  const x2 = center - r * Math.cos(endAngle);
  const y2 = -r * Math.sin(endAngle) + center;

  const backgroundPath = `M ${x1} ${y1} A ${r} ${r} 0 1 0 ${x2} ${y2}`;
  const forgrountPath = `M ${x2} ${y2} A ${r} ${r} 1 0 1 ${x1} ${y1}`;

  const skiaBackgroundPath = Skia.Path.MakeFromSVGString(backgroundPath);
  const skiaForGroundPath = Skia.Path.MakeFromSVGString(forgrountPath);

  const movableCx = useSharedValue(x2);
  const movableCy = useSharedValue(y2);
  const previousCx = useSharedValue(x2);
  const previousCy = useSharedValue(y2);
  const skiaCx = useValue(x2);
  const skiaCy = useValue(y2);

  const percentComplete = useSharedValue(0);
  const skiaPercentComplete = useValue(0);

  const gesture = Gesture.Pan()
    .onUpdate(({absoluteX, translationX, translationY}) => {
      const oldCanvasX = translationX + previousCx.value;
      const oldCanvasY = translationY + previousCy.value;
      const xPrime = oldCanvasX - center;
      const yPrime = -(oldCanvasY - center);
      const rawTheta = Math.atan2(yPrime, xPrime);
      let newTheata = 0;

      if (absoluteX < width / 2 && rawTheta < 0) {
        newTheata = Math.PI;
      } else if (absoluteX > width / 2 && rawTheta <= 0) {
        newTheata = 0;
      } else {
        newTheata = rawTheta;
      }

      const newCoodrs = polar2Canvas(
        {
          theta: newTheata,
          radius: r,
        },
        {
          x: center,
          y: center,
        },
      );
      percentComplete.value = 1 - newTheata / Math.PI;
      movableCx.value = newCoodrs.x;
      movableCy.value = newCoodrs.y;
    })
    .onEnd(() => {
      previousCx.value = movableCx.value;
      previousCy.value = movableCy.value;
    });

  useSharedValueEffect(
    () => {
      skiaCx.current = movableCx.value;
      skiaCy.current = movableCy.value;
      skiaPercentComplete.current = percentComplete.value;
    },
    movableCx,
    movableCy,
    percentComplete,
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: 200,
      width: 200,
      opacity: percentComplete.value,
    };
  });

  if (!skiaBackgroundPath || !skiaForGroundPath) {
    return <View />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.container}>
          <View style={styles.ghost}>
            <Animated.Image
              source={ghost}
              resizeMode="center"
              style={animatedStyle}
            />
          </View>
          <Canvas style={styles.canvas}>
            <Rect x={0} y={0} height={height} width={width} color="black" />
            <Path
              path={skiaBackgroundPath}
              strokeWidth={strokeWidth}
              strokeCap="round"
              color="gray"
              style="stroke"
            />
            <Path
              path={skiaForGroundPath}
              strokeWidth={strokeWidth}
              strokeCap="round"
              color="orange"
              style="stroke"
              start={0}
              end={skiaPercentComplete}
            />
            <Circle r={20} cx={skiaCx} cy={skiaCy} color="orange" />
            <Circle r={15} cx={skiaCx} cy={skiaCy} color="white" />
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  cursor: {
    backgroundColor: 'green',
  },
  ghost: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
});
