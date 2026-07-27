'use client'

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Direction } from '@/lib/snake-engine'

type DirectionPadProps = {
  onPress: (dir: Direction) => void
}

const BUTTON =
  'flex size-14 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors active:bg-primary active:text-primary-foreground'

export function DirectionPad({ onPress }: DirectionPadProps) {
  return (
    <div
      className="grid grid-cols-3 gap-2 md:hidden"
      role="group"
      aria-label="Snake direction controls"
    >
      <div />
      <button
        type="button"
        className={BUTTON}
        onPointerDown={() => onPress('up')}
        aria-label="Move up"
      >
        <ChevronUp aria-hidden="true" className="size-6" />
      </button>
      <div />

      <button
        type="button"
        className={BUTTON}
        onPointerDown={() => onPress('left')}
        aria-label="Move left"
      >
        <ChevronLeft aria-hidden="true" className="size-6" />
      </button>
      <button
        type="button"
        className={BUTTON}
        onPointerDown={() => onPress('down')}
        aria-label="Move down"
      >
        <ChevronDown aria-hidden="true" className="size-6" />
      </button>
      <button
        type="button"
        className={BUTTON}
        onPointerDown={() => onPress('right')}
        aria-label="Move right"
      >
        <ChevronRight aria-hidden="true" className="size-6" />
      </button>
    </div>
  )
}
