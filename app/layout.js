import './globals.css'
export const metadata = {
  title: 'AdWiz - AI Ad Generator',
  description: 'Generate stunning ad copy in minutes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}