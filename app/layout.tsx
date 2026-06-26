import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import AppInit from "@/components/AppInit";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TwisTop Sales OS",
  description: "Global Sales Operations — spirit + mixers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} h-full antialiased`}>
        <div className="flex h-full bg-slate-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
        <AppInit />
      </body>
    </html>
  );
}
