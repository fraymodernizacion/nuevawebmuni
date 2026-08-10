import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Municipalidad de Fray Mamerto Esquiu",
  description: "Sitio web institucional de la Municipalidad de Fray Mamerto Esquiu.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
