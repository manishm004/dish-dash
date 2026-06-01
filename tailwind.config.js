/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors:{
        primary: '#f0fff0',
        secondary: '#000066',
        color1: '#adff2f',//
        color2: '#7fffd4',//cyan
        color3: '#f0ffff'//lightblue
      }
    },
  },
  plugins: [],
}