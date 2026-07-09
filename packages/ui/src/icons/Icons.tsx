import type { SVGProps } from "react";
import type { SpeakerIconLevel } from "@starplayer/core";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Svg({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 2 L13 8 L4 14 Z" fill="currentColor" />
    </Svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
      <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
    </Svg>
  );
}

export function NextIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 2 L9 8 L2 14 Z" fill="currentColor" />
      <rect x="10.5" y="2" width="2.5" height="12" fill="currentColor" />
    </Svg>
  );
}

export function PrevIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2 L7 8 L14 14 Z" fill="currentColor" />
      <rect x="3" y="2" width="2.5" height="12" fill="currentColor" />
    </Svg>
  );
}

export function ShuffleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M2 4 H5 L11 12 H14 M11 4 H14 M2 12 H5 L7.5 8.6"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <path d="M14 4 L11.5 2 V6 Z" fill="currentColor" />
      <path d="M14 12 L11.5 10 V14 Z" fill="currentColor" />
    </Svg>
  );
}

export function RepeatIcon({ mode, ...props }: IconProps & { mode: "off" | "all" | "one" }) {
  return (
    <Svg {...props}>
      <path
        d="M3 6 V5 a2 2 0 0 1 2-2 H12 M13 10 V11 a2 2 0 0 1 -2 2 H4"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <path d="M10 1 L13 3 L10 5 Z" fill="currentColor" />
      <path d="M6 15 L3 13 L6 11 Z" fill="currentColor" />
      {mode === "one" ? (
        <text x="8" y="10" textAnchor="middle" fontSize="6" fill="currentColor" fontFamily="inherit">
          1
        </text>
      ) : null}
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 2 L11 8 L5 14" stroke="currentColor" strokeWidth="2" fill="none" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11 2 L5 8 L11 14" stroke="currentColor" strokeWidth="2" fill="none" />
    </Svg>
  );
}

export function BackArrowIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11 2 L5 8 L11 14" stroke="currentColor" strokeWidth="2" fill="none" />
    </Svg>
  );
}

export function SettingsGearIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M8 1.5 V3 M8 13 V14.5 M1.5 8 H3 M13 8 H14.5 M3.3 3.3 L4.3 4.3 M11.7 11.7 L12.7 12.7 M12.7 3.3 L11.7 4.3 M4.3 11.7 L3.3 12.7"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6.5" cy="6.5" r="4.2" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M9.5 9.5 L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </Svg>
  );
}

export function PlaylistIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="3" width="9" height="1.6" fill="currentColor" />
      <rect x="2" y="7" width="9" height="1.6" fill="currentColor" />
      <rect x="2" y="11" width="6" height="1.6" fill="currentColor" />
      <circle cx="13" cy="12.5" r="1.8" fill="currentColor" />
      <rect x="13.2" y="6" width="1.2" height="6.5" fill="currentColor" />
    </Svg>
  );
}

export function FavoritesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M8 14 C3 10.5 1.5 8 1.5 5.4 C1.5 3.4 3 2 4.8 2 C6 2 7.2 2.7 8 4 C8.8 2.7 10 2 11.2 2 C13 2 14.5 3.4 14.5 5.4 C14.5 8 13 10.5 8 14 Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function StarIcon({ filled, ...props }: IconProps & { filled: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M8 1 L9.8 5.6 L14.5 6 L11 9.2 L12 14 L8 11.4 L4 14 L5 9.2 L1.5 6 L6.2 5.6 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const SPEAKER_LEVEL_WAVES: Record<SpeakerIconLevel, number> = {
  muted: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function SpeakerIcon({ level, ...props }: IconProps & { level: SpeakerIconLevel }) {
  const waves = SPEAKER_LEVEL_WAVES[level];
  return (
    <Svg {...props}>
      <path d="M1.5 6 H4 L7.5 3 V13 L4 10 H1.5 Z" fill="currentColor" />
      {level === "muted" ? (
        <path d="M10 5.5 L14 10.5 M14 5.5 L10 10.5" stroke="currentColor" strokeWidth="1.6" />
      ) : (
        <>
          <path
            d="M10 5.8 A4 4 0 0 1 10 10.2"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
            opacity={waves >= 1 ? 1 : 0.25}
          />
          <path
            d="M11.4 4 A6.2 6.2 0 0 1 11.4 12"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
            opacity={waves >= 2 ? 1 : 0.25}
          />
          <path
            d="M12.8 2.2 A8.6 8.6 0 0 1 12.8 13.8"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
            opacity={waves >= 3 ? 1 : 0.25}
          />
        </>
      )}
    </Svg>
  );
}
