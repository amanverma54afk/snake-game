import { SnakeGame } from '@/components/snake-game'

export default function Page() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-8">
      <header className="flex w-full max-w-lg flex-col gap-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Snake
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Guide the snake to the food. Every bite makes it longer and a little
          faster.
        </p>
      </header>

      <SnakeGame />
    </main>
  )
}
