import type { Metadata } from "next";
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Управление файлами',
    description: 'Файлообменник с проверкой на угрозы',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
