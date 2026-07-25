import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JurisFTP - Assistant Juridique FPT",
  description: "Assistant juridique pour les agents de la Fonction Publique Territoriale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
