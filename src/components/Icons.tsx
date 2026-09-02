export function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M5 17l1.5-6h11L19 17M6.5 11l1-3h9l1 3" />
    </svg>
  );
}

export function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.82Z" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2zm0 18.13c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.19 8.19 0 0 1-1.26-4.33c0-4.53 3.69-8.22 8.26-8.22 2.2 0 4.27.86 5.83 2.42a8.17 8.17 0 0 1 2.41 5.81c0 4.53-3.69 8.21-8.24 8.21zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.36-.77-1.86-.2-.48-.41-.42-.56-.42-.14 0-.31-.02-.47-.02-.17 0-.44.06-.67.31-.23.25-.87.86-.87 2.09s.9 2.42 1.02 2.59c.12.17 1.77 2.7 4.28 3.79.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

export function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06C2 17.06 5.66 21.2 10.44 21.95V14.9H7.9v-2.84h2.54v-2.17c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.84h2.77l-.44 2.84h-2.33v7.05C18.34 21.2 22 17.06 22 12.06z" />
    </svg>
  );
}

export function MessengerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.15 2 11.28c0 2.91 1.44 5.51 3.7 7.21V22l3.38-1.86c.9.25 1.87.38 2.92.38 5.52 0 10-4.15 10-9.24C22 6.15 17.52 2 12 2zm1.02 12.44-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z" />
    </svg>
  );
}

export function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
