import type { Metadata } from "next";
import { Golos_Text, Inter } from "next/font/google";
import "./globals.css";

const golosText = Golos_Text({
  variable: "--font-golos-text",
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
});

export const metadata: Metadata = {
  title: "Molly Home — мебель для дома",
  description:
    "Molly Home — производитель комфортной мебели для дома. Современные технологии, лояльный бренд.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${golosText.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-navy">
        {children}
      </body>
    </html>
  );
}
