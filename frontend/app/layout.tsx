import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppShell from '@/components/common/AppShell';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Apex Predators | AI MMA Arena on Monad',
  description: 'Bet on blood. AI-powered animal fighters compete in MMA-style tournaments on Monad. Only the strongest survive.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-[#0a0a0a] text-white font-sans antialiased">
        <AppShell>
          <Header />
          <main className="pt-16 min-h-screen">{children}</main>
          <Footer />
        </AppShell>
      </body>
    </html>
  );
}
