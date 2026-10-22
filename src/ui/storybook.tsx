import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import type { AvatarId } from '../auth/contract';

export function StorybookScene({ label }: { label: string }) {
  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={{ width: '100%', aspectRatio: 360 / 200, maxHeight: 220 }}>
      <Svg width="100%" height="100%" viewBox="0 0 360 200">
        <Ellipse cx="180" cy="20" rx="160" ry="28" fill="#F59E0B" opacity="0.25" />
        <Circle cx="300" cy="36" r="18" fill="#F59E0B" />
        <Ellipse cx="180" cy="176" rx="170" ry="28" fill="#22C55E" />
        <Ellipse cx="70" cy="150" rx="36" ry="22" fill="#9CA3AF" />
        <Circle cx="104" cy="132" r="16" fill="#D1D5DB" />
        <Path d="M112 136 C130 150 128 168 112 164" fill="#9CA3AF" />
        <Circle cx="110" cy="130" r="2" fill="#1F2937" />
        <Circle cx="210" cy="118" r="22" fill="#F59E0B" />
        <Circle cx="210" cy="104" r="16" fill="#FDE68A" />
        <Circle cx="204" cy="102" r="2" fill="#1F2937" />
        <Circle cx="216" cy="102" r="2" fill="#1F2937" />
        <Ellipse cx="250" cy="158" rx="16" ry="10" fill="#FFFFFF" />
        <Ellipse cx="236" cy="128" rx="6" ry="18" fill="#FFFFFF" />
        <Ellipse cx="264" cy="128" rx="6" ry="18" fill="#FFFFFF" />
        <Circle cx="250" cy="154" r="2" fill="#1F2937" />
        <Ellipse cx="150" cy="162" rx="22" ry="12" fill="#16A34A" />
        <Circle cx="168" cy="154" r="8" fill="#86EFAC" />
        <Circle cx="170" cy="153" r="1.5" fill="#1F2937" />
        <Circle cx="40" cy="118" r="14" fill="#92400E" />
        <Path d="M28 118 C10 100 18 150 40 132" fill="none" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
        <Circle cx="36" cy="116" r="2" fill="#1F2937" />
      </Svg>
    </View>
  );
}

export function AnimalBadge({ avatar, label }: { avatar: AvatarId; label: string }) {
  const fill = avatar === 'lion' ? '#F59E0B' : avatar === 'rabbit' ? '#FFFFFF' : avatar === 'elephant' ? '#D1D5DB' : avatar === 'turtle' ? '#22C55E' : '#92400E';
  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={{ width: 56, height: 56 }}>
      <Svg width="56" height="56" viewBox="0 0 56 56">
        <Circle cx="28" cy="28" r="26" fill="#FFF9EF" stroke="#E7E3F7" strokeWidth="2" />
        <Circle cx="28" cy="30" r="12" fill={fill} stroke="#1F2937" strokeWidth="1.5" />
        {avatar === 'rabbit' ? <Ellipse cx="20" cy="16" rx="4" ry="10" fill="#FFFFFF" stroke="#1F2937" /> : null}
        {avatar === 'rabbit' ? <Ellipse cx="30" cy="16" rx="4" ry="10" fill="#FFFFFF" stroke="#1F2937" /> : null}
        {avatar === 'elephant' ? <Path d="M36 32 C44 40 40 48 34 44" fill={fill} stroke="#1F2937" /> : null}
        {avatar === 'monkey' ? <Path d="M16 30 C8 20 14 46 24 36" fill="none" stroke={fill} strokeWidth="3" /> : null}
        <Circle cx="24" cy="28" r="1.5" fill="#1F2937" />
        <Circle cx="32" cy="28" r="1.5" fill="#1F2937" />
      </Svg>
    </View>
  );
}
