import type { Metadata } from "next";
import "pdfjs-dist/web/pdf_viewer.css";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/common/Toast";

export const metadata: Metadata = {
  title: "BookShelf - Your Personal Digital Library",
  description: "Manage and read your PDF book collection with notes, themes, and read-aloud features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
