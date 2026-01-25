import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors:{
        lamaSky:"#F7F8FA",
        lamaSkyLight:"#EDEBFF",
        lamaPurple:"#574FD6",
        lamaPurpleLight:"#EDEBFF",
        lamaYellow:"#9CA3AF",
        lamaYellowLight:"#F3F4F6",
      }
    },
  },
  plugins: [],
};
export default config;
