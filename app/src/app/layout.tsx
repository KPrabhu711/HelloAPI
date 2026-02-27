import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApiProvider } from "@/context/ApiContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HelloAPI — Interactive API Learning Platform",
  description:
    "Turn API documentation into a working quickstart and interactive endpoint playground. Explore, learn, and integrate APIs faster.",
  keywords: ["API", "developer tools", "API playground", "OpenAPI", "quickstart", "SDK generator"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ApiProvider>{children}</ApiProvider>
      </body>
    </html>
  );
}
