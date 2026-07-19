import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

export function AnimatedCounter({ 
  value, 
  style, 
  duration = 1000 
}: { 
  value: number; 
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState("0");
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.exp) });
    
    let animationFrameId: number;
    const updateText = () => {
      const currentVal = Math.floor(progress.value * value);
      setDisplayValue(currentVal.toLocaleString());
      if (progress.value < 1) {
        animationFrameId = requestAnimationFrame(updateText);
      } else {
        setDisplayValue(value.toLocaleString());
      }
    };
    animationFrameId = requestAnimationFrame(updateText);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration, progress]);

  return <Text style={style}>{displayValue}</Text>;
}
