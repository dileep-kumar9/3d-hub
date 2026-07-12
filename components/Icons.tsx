import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  size?: number;
};

const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
});

export function LogoIcon({
  size = 42,
  ...props
}: Props) {
  const uniqueId = (
    props.id || "hub-logo"
  ).replace(/[^a-zA-Z0-9-_]/g, "");

  const gradientId = `${uniqueId}-gradient`;
  const innerGradientId = `${uniqueId}-inner`;
  const glowId = `${uniqueId}-glow`;
  const shadowId = `${uniqueId}-shadow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="9"
          y1="51"
          x2="54"
          y2="11"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#06D9FF" />
          <stop offset="0.34" stopColor="#2563EB" />
          <stop offset="0.65" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>

        <linearGradient
          id={innerGradientId}
          x1="20"
          y1="18"
          x2="45"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop
            offset="0.42"
            stopColor="#F5D0FE"
          />
          <stop
            offset="1"
            stopColor="#67E8F9"
          />
        </linearGradient>

        <filter
          id={glowId}
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            stdDeviation="2.8"
            result="blur"
          />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0.45
              0 1 0 0 0.10
              0 0 1 0 1
              0 0 0 0.85 0
            "
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter
          id={shadowId}
          x="-30%"
          y="-30%"
          width="160%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="4"
            floodColor="#7C3AED"
            floodOpacity="0.48"
          />
        </filter>
      </defs>

      <ellipse
        cx="31.5"
        cy="55"
        rx="18"
        ry="3.4"
        fill="#6D28D9"
        opacity="0.28"
        filter={`url(#${glowId})`}
      />

      <path
        d="M17.8 8.8
           C14.4 10.8 12.3 14.4 12.3 18.3
           V45.7
           C12.3 49.6 14.4 53.2 17.8 55.2
           C21.2 57.2 25.3 57.2 28.7 55.2
           L51.9 41.5
           C55.3 39.5 57.4 35.9 57.4 32
           C57.4 28.1 55.3 24.5 51.9 22.5
           L28.7 8.8
           C25.3 6.8 21.2 6.8 17.8 8.8Z"
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
      />

      <path
        d="M20.9 13
           C18.4 14.5 16.9 17.1 16.9 20
           V44
           C16.9 46.9 18.4 49.5 20.9 51
           C23.4 52.5 26.5 52.5 29 51
           L48.8 39.3
           C51.3 37.8 52.8 35 52.8 32
           C52.8 29 51.3 26.2 48.8 24.7
           L29 13
           C26.5 11.5 23.4 11.5 20.9 13Z"
        fill="rgba(4, 7, 24, 0.22)"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.3"
      />

      <path
        d="M25.5 20.5
           V43.5
           C25.5 45.5 27.7 46.7 29.4 45.6
           L47.4 34.1
           C49 33.1 49 30.9 47.4 29.9
           L29.4 18.4
           C27.7 17.3 25.5 18.5 25.5 20.5Z"
        fill={`url(#${innerGradientId})`}
        filter={`url(#${glowId})`}
      />

      <path
        d="M21.2 16.1
           C18.8 18.3 17.6 21.1 17.6 24.4"
        stroke="white"
        strokeWidth="1.9"
        strokeLinecap="round"
        opacity="0.72"
      />

      <path
        d="M18.8 13.4
           C16.5 15.1 14.9 17.5 14.3 20.2"
        stroke="#C4B5FD"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.62"
      />

      <circle
        cx="9.5"
        cy="19"
        r="1.1"
        fill="#8B5CF6"
      />

      <circle
        cx="54.6"
        cy="15.8"
        r="0.9"
        fill="#EC4899"
      />

      <circle
        cx="53"
        cy="48"
        r="1.2"
        fill="#06B6D4"
      />
    </svg>
  );
}

export function MenuIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({
  size = 20,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlaylistIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M4 6h10M4 11h10M4 16h6M17 13v6M14 16h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M17 5v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}


export function LibraryIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M4 5.5h5.5A2.5 2.5 0 0 1 12 8v11H6.5A2.5 2.5 0 0 1 4 16.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11h5.5a2.5 2.5 0 0 0 2.5-2.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <circle
        cx="12"
        cy="8"
        r="3.4"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5 20c.7-4.1 3-6.1 7-6.1s6.3 2 7 6.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M9.7 3.5h4.6l.7 2.1 2 .8 2-.9 2.3 4-1.7 1.4.2 2.2 1.7 1.4-2.3 4-2-.9-2 .8-.7 2.1H9.7L9 18.4l-2-.8-2 .9-2.3-4 1.7-1.4-.2-2.2-1.7-1.4 2.3-4 2 .9 2-.8.7-2.1Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.6"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function HistoryIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M4 5v5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5.3 15.4A8 8 0 1 0 5 8.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M12 8v4l2.8 1.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeartIcon({
  size = 22,
  filled = false,
  ...props
}: Props & {
  filled?: boolean;
}) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M20.7 5.7a5.2 5.2 0 0 0-7.4 0L12 7l-1.3-1.3a5.2 5.2 0 0 0-7.4 7.4L12 21l8.7-7.9a5.2 5.2 0 0 0 0-7.4Z"
        fill={
          filled
            ? "currentColor"
            : "none"
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LaterIcon({
  size = 22,
  filled = false,
  ...props
}: Props & {
  filled?: boolean;
}) {
  return (
    <svg {...base(size)} {...props}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill={
          filled
            ? "currentColor"
            : "none"
        }
        fillOpacity={
          filled ? 0.16 : 0
        }
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MusicIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M9 18V6l10-2v12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="6.5"
        cy="18"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="16.5"
        cy="16"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function HeadphonesIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M4 13v-1a8 8 0 0 1 16 0v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M4 13h3v7H5a1 1 0 0 1-1-1v-6ZM20 13h-3v7h2a1 1 0 0 0 1-1v-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="m9 7 8 5-8 5V7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function RefreshIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M4 4v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 9A7.5 7.5 0 1 1 6 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchIcon({
  size = 22,
  ...props
}: Props) {
  return (
    <svg {...base(size)} {...props}>
      <circle
        cx="11"
        cy="11"
        r="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
