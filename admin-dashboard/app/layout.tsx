import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { AuthGate } from '@/components/AuthGate';
import { SimulationBanner } from '@/components/SimulationBanner';

export const metadata = {
  title: 'TankLotse Admin',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <SimulationBanner />
        <AuthGate>
          <Layout>{children}</Layout>
        </AuthGate>
      </body>
    </html>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
