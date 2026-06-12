import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'App-Download',
  description: 'TankLotse für iOS und Android.',
};

export default function AppPage() {
  return (
    <section className="container-tk py-16 max-w-3xl">
      <h1 className="text-3xl font-bold">App-Download</h1>
      <p className="mt-3 text-brand-700 dark:text-brand-100">
        TankLotse erscheint im App Store und im Google Play Store. Nach Veröffentlichung findest du hier die
        offiziellen Links.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-100 dark:border-brand-700 p-6">
          <div className="font-semibold">iOS (Apple App Store)</div>
          <p className="mt-2 text-sm">Erforderlich: iOS 15 oder neuer.</p>
          <p className="mt-4 text-xs text-brand-700/70 dark:text-brand-100/70">
            Link wird nach App-Store-Freigabe ergänzt.
          </p>
        </div>
        <div className="rounded-xl border border-brand-100 dark:border-brand-700 p-6">
          <div className="font-semibold">Android (Google Play)</div>
          <p className="mt-2 text-sm">Erforderlich: Android 8 oder neuer.</p>
          <p className="mt-4 text-xs text-brand-700/70 dark:text-brand-100/70">
            Link wird nach Play-Freigabe ergänzt.
          </p>
        </div>
      </div>
    </section>
  );
}
