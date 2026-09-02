import "./globals.css";

export const metadata = {
  title: "Wedding Mission",
  description: "ADI & NITAY — 11.03.2027",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
