export const metadata = {
  title: 'Receipt Reward',
  description: 'Receipt Reward System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
