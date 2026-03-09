/**
 * HelloAPI — Centralized SVG Icon Library
 * All icons use currentColor and are 24×24 viewBox (Heroicons v2 outline style).
 * Pass `size` to scale, `className` for colour overrides.
 */

interface IconProps {
    size?: number;
    className?: string;
}

const base = (path: string, props: IconProps, fill = false) => (
    <svg
        width={props.size ?? 16}
        height={props.size ?? 16}
        viewBox="0 0 24 24"
        fill={fill ? 'currentColor' : 'none'}
        stroke={fill ? 'none' : 'currentColor'}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
        aria-hidden="true"
    >
        <path d={path} />
    </svg>
);

export const IconLightning = (p: IconProps) =>
    base('M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', p, true);

export const IconLightbulb = (p: IconProps) =>
    base('M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18', p);

export const IconPlay = (p: IconProps) =>
    base('M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z', p, true);

export const IconRocket = (p: IconProps) =>
    base('M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z', p);

export const IconBook = (p: IconProps) =>
    base('M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', p);

export const IconWarn = (p: IconProps) =>
    base('M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z', p);

export const IconClipboard = (p: IconProps) =>
    base('M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z', p);

export const IconMonitor = (p: IconProps) =>
    base('M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25', p);

export const IconCheckCircle = (p: IconProps) =>
    base('M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', p);

export const IconCog = (p: IconProps) =>
    base('M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z', p);

export const IconGlobe = (p: IconProps) =>
    base('M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418', p);

export const IconGradCap = (p: IconProps) =>
    base('M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5', p);

export const IconArrowUp = (p: IconProps) =>
    base('M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5', p);

export const IconArrowDown = (p: IconProps) =>
    base('M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3', p);

export const IconTag = (p: IconProps) =>
    base('M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z', p);

export const IconLink = (p: IconProps) =>
    base('M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244', p);

export const IconLock = (p: IconProps) =>
    base('M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z', p);

export const IconKey = (p: IconProps) =>
    base('M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z', p);

export const IconRefresh = (p: IconProps) =>
    base('M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99', p);

export const IconSparkles = (p: IconProps) =>
    base('M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z', p);

export const IconSearch = (p: IconProps) =>
    base('M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z', p);

export const IconUpload = (p: IconProps) =>
    base('M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5', p);

export const IconDocument = (p: IconProps) =>
    base('M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', p);

export const IconXCircle = (p: IconProps) =>
    base('M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z', p);

export const IconArrowLeft = (p: IconProps) =>
    base('M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18', p);

export const IconPencil = (p: IconProps) =>
    base('M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10', p);

export const IconInfo = (p: IconProps) =>
    base('M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z', p);

export const IconSun = (p: IconProps) =>
    base('M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z', p);

export const IconMoon = (p: IconProps) =>
    base('M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z', p);

export const IconCpu = (p: IconProps) =>
    base('M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z', p);

export const IconCode = (p: IconProps) =>
    base('M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5', p);

export const IconSliders = (p: IconProps) =>
    base('M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75', p);

export const IconShieldWarn = (p: IconProps) =>
    base('M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z', p);

export const IconArrowDownTray = (p: IconProps) =>
    base('M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3', p);

export const IconTerminal = (p: IconProps) =>
    base('M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z', p);

/** Python brand icon — uses official Python blue + yellow colors */
export const IconPython = ({ size = 16, className }: IconProps) => (    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path d="M11.5 3C8.5 3 6.5 4 6.5 6V9h5v1H6C4 10 2.5 11.5 2.5 14s1.5 4.5 3.5 4.5H7.5V16c0-1.7 1.3-3 3-3H16c1.7 0 3-1.3 3-3V6c0-2-2-3-4.5-3h-3zm-1.25 2a.75.75 0 110 1.5.75.75 0 010-1.5z" fill="#3572A5" />
        <path d="M12.5 21c3 0 5-1 5-3v-3h-5v-1H18c2 0 3.5-1.5 3.5-4s-1.5-4.5-3.5-4.5H16.5V9c0 1.7-1.3 3-3 3H8c-1.7 0-3 1.3-3 3V18c0 2 2 3 4.5 3h3zm1.25-2a.75.75 0 110-1.5.75.75 0 010 1.5z" fill="#FFD43B" />
    </svg>
);

/** TypeScript brand icon — TS blue square with letterforms */
export const IconTypeScript = ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#3178C6" />
        <path d="M5 8.5h6.5v1.8H9v6H7v-6H5V8.5z" fill="white" />
        <path d="M15.5 8.5c1.2 0 2.1.4 2.8 1.1l-1.2 1.3c-.4-.4-.9-.6-1.5-.6-.6 0-1 .3-1 .7 0 .5.4.8 1.5 1.1 1.4.5 2.1 1.1 2.1 2.4 0 1.5-1.2 2.5-3 2.5-1.3 0-2.3-.5-3-1.3l1.2-1.3c.4.5 1 .8 1.8.8.7 0 1.1-.3 1.1-.8 0-.5-.4-.7-1.5-1.1-1.4-.4-2.1-1.1-2.1-2.3 0-1.5 1.2-2.5 2.8-2.5z" fill="white" />
    </svg>
);

/**
 * HelloAPI LogoMark — geometric robot built from API nodes & connections.
 * Head formed by connected endpoint circles; arrow-mouth = API request direction.
 * Works on both dark and light backgrounds (indigo gradient background).
 */
export const LogoMark = ({ size = 32, className }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="HelloAPI"
        role="img"
    >
        <defs>
            <linearGradient id="lm-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>

        {/* Background */}
        <rect width="48" height="48" rx="12" fill="url(#lm-bg)" />

        {/* Antenna */}
        <line x1="24" y1="8" x2="24" y2="13.5" stroke="#c7d2fe" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="24" cy="6" r="2.2" fill="#e0e7ff" />

        {/* Head body — rounded rect */}
        <rect x="10" y="14" width="28" height="20" rx="5" fill="rgba(255,255,255,0.08)" stroke="#c7d2fe" strokeWidth="1.4" />

        {/* Left eye — outer ring */}
        <circle cx="18.5" cy="21.5" r="3.4" fill="rgba(224,231,255,0.14)" stroke="#dde1ff" strokeWidth="1.2" />
        {/* Left eye — inner pupil */}
        <circle cx="18.5" cy="21.5" r="1.4" fill="#ffffff" />

        {/* Right eye — outer ring */}
        <circle cx="29.5" cy="21.5" r="3.4" fill="rgba(224,231,255,0.14)" stroke="#dde1ff" strokeWidth="1.2" />
        {/* Right eye — inner pupil */}
        <circle cx="29.5" cy="21.5" r="1.4" fill="#ffffff" />

        {/* Eye-to-eye connection line (API link) */}
        <line x1="21.9" y1="21.5" x2="26.1" y2="21.5" stroke="#a5b4fc" strokeWidth="0.9" strokeDasharray="1.5 1" />

        {/* Mouth: → endpoint arrow */}
        <line x1="16" y1="30" x2="27.2" y2="30" stroke="#a5b4fc" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M24.5 27.5L28 30L24.5 32.5" fill="none" stroke="#a5b4fc" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Left side port — dashed line + node */}
        <line x1="5.5" y1="21.5" x2="10" y2="21.5" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="5" cy="21.5" r="1.6" fill="#818cf8" opacity="0.75" />

        {/* Right side port — dashed line + node */}
        <line x1="38" y1="21.5" x2="42.5" y2="21.5" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="43" cy="21.5" r="1.6" fill="#818cf8" opacity="0.75" />

        {/* Bottom connector stem */}
        <line x1="24" y1="34" x2="24" y2="40" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />

        {/* Bottom branch nodes */}
        <line x1="24" y1="40" x2="17" y2="44.5" stroke="#818cf8" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
        <line x1="24" y1="40" x2="31" y2="44.5" stroke="#818cf8" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
        <circle cx="24" cy="40.5" r="1.6" fill="#a5b4fc" />
        <circle cx="17" cy="44.5" r="1.4" fill="#818cf8" opacity="0.55" />
        <circle cx="31" cy="44.5" r="1.4" fill="#818cf8" opacity="0.55" />
    </svg>
);
