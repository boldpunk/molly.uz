import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["400", "500", "600"],
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Molly Home — мебель для дома",
  description:
    "Molly Home — производитель комфортной мебели для дома. Современные технологии, лояльный бренд.",
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-navy">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
