import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClawSafe – Verify Claw Skills Before Install',
  description:
    'Scan any ClawHub or OpenClaw skill for wallet drain, data exfiltration, shell injection, and other threats before you install.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
