import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "InterviewMatrix - AI-Powered Interview Platform",
  description: "Master your interview skills with AI-powered mock interviews, real-time feedback, and personalized learning paths. Prepare smarter, perform better.",
  keywords: ["interview preparation", "AI interview", "mock interview", "coding interview", "behavioral interview", "technical interview"],
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={`${inter.variable} antialiased font-sans`}
          suppressHydrationWarning
        >
          <Providers>
            {children}
            {modal}
          </Providers>
        </body>
      </html>
  );
}
