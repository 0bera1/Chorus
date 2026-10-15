import { JoinForm } from '@/components/join-form';
import { Logo } from '@/components/logo';
import { T } from '@/lib/strings';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <Logo size={96} animated />
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-black tracking-tight md:text-6xl">{T.landing.heroTitle}</h1>
        <p className="mx-auto max-w-xl text-lg text-muted">{T.landing.heroBody}</p>
      </div>
      <JoinForm />
      <p className="text-sm text-muted">{T.landing.joinHint}</p>
    </main>
  );
}
