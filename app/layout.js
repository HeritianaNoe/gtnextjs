import "./globals.css";

export const metadata = {
  title: "Mitady Teny — lalao teny malagasy",
  description: "Lalao mitady teny amin'ny teny malagasy."
};

export default function RootLayout({ children }) {
  return (
    <html lang="mg">
      <body>{children}</body>
    </html>
  );
}
