import { Trophy, Ruler } from 'lucide-react'

type ScoreBoardProps = {
  score: number
  best: number
  length: number
}

export function ScoreBoard({ score, best, length }: ScoreBoardProps) {
  return (
    <div className="flex items-stretch gap-2">
      <div className="flex flex-1 flex-col justify-center rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Score
        </span>
        <span className="font-mono text-3xl font-semibold tabular-nums leading-8 text-primary">
          {String(score).padStart(3, '0')}
        </span>
      </div>

      <div className="flex flex-col justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          <Trophy aria-hidden="true" className="size-3.5" />
          Best
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums leading-none text-foreground">
          {String(best).padStart(3, '0')}
        </span>
      </div>

      <div className="flex flex-col justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          <Ruler aria-hidden="true" className="size-3.5" />
          Length
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums leading-none text-foreground">
          {String(length).padStart(3, '0')}
        </span>
      </div>
    </div>
  )
}
