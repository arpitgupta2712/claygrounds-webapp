/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F6D7A',  // Slate blue - refined primary color
          light: '#56A3A6',     // Teal - balanced accent color
          dark: '#2D3E50',      // Deep navy - elegant emphasis
        },
        text: {
          dark: '#2D3E50',      // Deep navy for headings
          medium: '#394F61',    // Medium slate for body text
          light: '#6C7A89',     // Subtle gray for secondary content
        },
        background: {
          DEFAULT: '#F8FAFC',   // Clean off-white for main background
          light: '#FFFFFF',     // Pure white for cards
          accent: '#F0F4F8',    // Subtle light blue for highlights
        },
        accent: {
          success: '#66BB6A',   // Green for success states
          warning: '#FFCA28',   // Amber for warnings
          error: '#EF5350',     // Soft red for errors
          info: '#42A5F5',      // Blue for information
        },
      },
      screens: {
        'sm': '640px',     // Small devices (tablets)
        'md': '768px',     // Medium devices (small laptops)
        'lg': '1024px',    // Large devices (desktops)
        'xl': '1280px',    // Extra large devices (large desktops)
        '2xl': '1536px',   // 2 Extra large devices (larger desktops)
        '3xl': '1920px',   // 3 Extra large devices (ultrawide monitors)
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}