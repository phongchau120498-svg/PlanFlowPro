/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Thay thế font sans mặc định bằng Be Vietnam Pro
        sans: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Giữ nguyên các cấu hình mở rộng khác nếu có (ví dụ màu sắc)
    },
  },
  plugins: [
    require("tailwindcss-animate"), // Nếu anh có dùng plugin animation
  ],
}