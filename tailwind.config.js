module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6a3de8",
        secondary: "#1E1E2F",
        inputBg: "#2D2D44",
        inputBorder: "#6a3de8",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
