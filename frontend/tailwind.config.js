/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          void: '#030509',
          primary: '#070B14',
          secondary: '#0C1220',
          tertiary: '#121A2D',
          elevated: '#1A2438',
          hover: '#24304A',
        },
        accent: {
          nasa: '#0B3D91',
          bright: '#4A90E2',
          glow: '#6BB6FF',
          cyan: '#00D4FF',
          plasma: '#7C3AED',
          amber: '#FF9500',
          earth: '#4ADE80',
        },
        status: {
          nominal: '#10B981',
          caution: '#FBBF24',
          warning: '#F59E0B',
          critical: '#EF4444',
          emergency: '#DC2626',
          offline: '#6B7280',
        },
        vital: {
          heart: '#FF4D6D',
          spo2: '#4DA6FF',
          temp: '#FFA94D',
          motion: '#4ADE80',
          radiation: '#B873FF',
          cognitive: '#06B6D4',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        hud: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'heartbeat': 'heartbeat 1s ease-in-out infinite',
        'radar': 'radar 4s linear infinite',
        'sweep': 'sweep 2s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'drift': 'drift 200s linear infinite',
        'glow-flash': 'glow-flash 100ms ease-out',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.04)', opacity: '0.92' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        drift: {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(-100px, -100px)' },
        },
        'glow-flash': {
          '0%': { filter: 'brightness(2)' },
          '100%': { filter: 'brightness(1)' },
        },
      },
    },
  },
  plugins: [],
};
