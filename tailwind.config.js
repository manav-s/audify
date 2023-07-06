/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "fade-black": {
          "0%": { color: "white" },
          "50%": { color: "black" },
          "100%": { color: "white" },
        },
      },
      animation: {
        "fade-black": "fade-black 2s linear infinite",
      },
    },
  },
  variants: {},
  plugins: [],
};
