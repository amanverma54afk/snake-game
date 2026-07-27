'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScoreBoard } from '@/components/score-board'
import { DirectionPad } from '@/components/direction-pad'
import {
  CELL,
  GRID,
  createSnake,
  isOpposite,
  spawnFood,
  step,
  tickForScore,
  VECTORS,
  type Direction,
  type Point,
  type Status,
} from '@/lib/snake-engine'

const SIZE = GRID * CELL

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
}

type GameState = {
  snake: Point[]
  prev: Point[]
  food: Point
  dir: Direction
  queue: Direction[]
  score: number
  status: Status
  acc: number
  last: number
  tick: number
  pop: { x: number; y: number; at: number } | null
}

function initialState(): GameState {
  const snake = createSnake()
  return {
    snake,
    prev: snake,
    food: spawnFood(snake),
    dir: 'right',
    queue: [],
    score: 0,
    status: 'idle',
    acc: 0,
    last: 0,
    tick: tickForScore(0),
    pop: null,
  }
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState>(initialState())

  const [status, setStatus] = useState<Status>('idle')
  const [score, setScore] = useState(0)
  const [length, setLength] = useState(3)
  const [best, setBest] = useState(0)

  /** Reset to a fresh board and begin playing immediately. */
  const start = useCallback(() => {
    const fresh = initialState()
    fresh.status = 'playing'
    gameRef.current = fresh
    setStatus('playing')
    setScore(0)
    setLength(fresh.snake.length)
  }, [])

  const togglePause = useCallback(() => {
    const g = gameRef.current
    if (g.status === 'playing') {
      g.status = 'paused'
      setStatus('paused')
    } else if (g.status === 'paused') {
      g.acc = 0
      g.status = 'playing'
      setStatus('playing')
    }
  }, [])

  const enqueue = useCallback(
    (dir: Direction) => {
      const g = gameRef.current
      if (g.status === 'idle' || g.status === 'over') {
        start()
        gameRef.current.queue = isOpposite(dir, 'right') ? [] : [dir]
        return
      }
      if (g.status !== 'playing') return

      const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir
      if (dir === last || isOpposite(dir, last)) return
      if (g.queue.length < 2) g.queue.push(dir)
    },
    [start],
  )

  // Keyboard controls
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const dir = KEY_TO_DIR[e.key]
      if (dir) {
        e.preventDefault()
        enqueue(dir)
        return
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        const s = gameRef.current.status
        if (s === 'idle' || s === 'over') start()
        else togglePause()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enqueue, start, togglePause])

  // Pause when the tab or window loses focus so the snake never dies unattended.
  useEffect(() => {
    function onBlur() {
      const g = gameRef.current
      if (g.status === 'playing') {
        g.status = 'paused'
        setStatus('paused')
      }
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  // Game loop + renderer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    const styles = getComputedStyle(document.documentElement)
    const token = (name: string, fallback: string) =>
      styles.getPropertyValue(name).trim() || fallback

    const colors = {
      board: token('--card', '#22262b'),
      grid: 'rgba(255, 255, 255, 0.05)',
      snake: token('--primary', '#a3e635'),
      food: token('--accent', '#f0a92b'),
      dead: token('--destructive', '#e5484d'),
      head: token('--primary-foreground', '#1c2617'),
    }

    let raf = 0

    function advance() {
      const g = gameRef.current
      const dir = g.queue.length ? (g.queue.shift() as Direction) : g.dir
      g.dir = dir

      const result = step(g.snake, g.food, dir)

      if (result.dead) {
        g.status = 'over'
        setStatus('over')
        setBest((b) => Math.max(b, g.score))
        return
      }

      g.prev = g.snake
      g.snake = result.snake
      g.food = result.food

      if (result.ate) {
        g.pop = { x: g.prev[0].x, y: g.prev[0].y, at: performance.now() }
        g.score += 1
        g.tick = tickForScore(g.score)
        setScore(g.score)
        setLength(g.snake.length)
        setBest((b) => Math.max(b, g.score))
      }
    }

    function draw(progress: number, time: number) {
      const g = gameRef.current
      const t = g.status === 'playing' ? Math.min(progress, 1) : 1

      // Board
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.fillStyle = colors.board
      ctx.fillRect(0, 0, SIZE, SIZE)

      // Grid dots
      ctx.fillStyle = colors.grid
      for (let y = 1; y < GRID; y++) {
        for (let x = 1; x < GRID; x++) {
          ctx.beginPath()
          ctx.arc(x * CELL, y * CELL, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Food (gentle pulse)
      const pulse = 1 + Math.sin(time / 260) * 0.09
      const fx = g.food.x * CELL + CELL / 2
      const fy = g.food.y * CELL + CELL / 2
      ctx.save()
      ctx.shadowColor = colors.food
      ctx.shadowBlur = 14
      ctx.fillStyle = colors.food
      ctx.beginPath()
      ctx.arc(fx, fy, CELL * 0.3 * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Ring that expands where food was just eaten
      if (g.pop) {
        const age = (time - g.pop.at) / 340
        if (age >= 1) {
          g.pop = null
        } else {
          ctx.strokeStyle = colors.food
          ctx.globalAlpha = 1 - age
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(
            g.pop.x * CELL + CELL / 2,
            g.pop.y * CELL + CELL / 2,
            CELL * (0.3 + age * 0.75),
            0,
            Math.PI * 2,
          )
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }

      // Interpolate every segment from where it was to where it is now
      const pts = g.snake.map((seg, i) => {
        const from = g.prev[i] ?? g.prev[g.prev.length - 1]
        return {
          x: (from.x + (seg.x - from.x) * t) * CELL + CELL / 2,
          y: (from.y + (seg.y - from.y) * t) * CELL + CELL / 2,
        }
      })

      const bodyColor = g.status === 'over' ? colors.dead : colors.snake

      // Body drawn as one continuous rounded stroke
      ctx.strokeStyle = bodyColor
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = CELL * 0.72
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()

      // Tapered tail tip
      if (pts.length > 1) {
        const tail = pts[pts.length - 1]
        ctx.fillStyle = colors.board
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        ctx.arc(tail.x, tail.y, CELL * 0.18, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Head + eyes
      const head = pts[0]
      ctx.fillStyle = bodyColor
      ctx.beginPath()
      ctx.arc(head.x, head.y, CELL * 0.4, 0, Math.PI * 2)
      ctx.fill()

      const v = VECTORS[g.dir]
      const perp = { x: -v.y, y: v.x }
      ctx.fillStyle = colors.head
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.arc(
          head.x + v.x * CELL * 0.14 + perp.x * side * CELL * 0.16,
          head.y + v.y * CELL * 0.14 + perp.y * side * CELL * 0.16,
          CELL * 0.075,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
    }

    function frame(time: number) {
      const g = gameRef.current
      if (!g.last) g.last = time
      const delta = Math.min(time - g.last, 250)
      g.last = time

      if (g.status === 'playing') {
        g.acc += delta
        while (g.acc >= g.tick && gameRef.current.status === 'playing') {
          g.acc -= g.tick
          advance()
        }
      } else {
        g.acc = 0
      }

      draw(g.acc / g.tick, time)
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Swipe controls
  const swipeRef = useRef<{ x: number; y: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    swipeRef.current = { x: e.clientX, y: e.clientY }
  }

  function onPointerUp(e: React.PointerEvent) {
    const origin = swipeRef.current
    swipeRef.current = null
    if (!origin) return

    const dx = e.clientX - origin.x
    const dy = e.clientY - origin.y
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
      if (status === 'idle' || status === 'over') start()
      return
    }
    enqueue(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? 'right'
          : 'left'
        : dy > 0
          ? 'down'
          : 'up',
    )
  }

  const overlay =
    status === 'idle'
      ? {
          title: 'Snake',
          body: 'Eat the food, grow longer, and don\u2019t hit the walls or yourself.',
          action: 'Start game',
        }
      : status === 'over'
        ? {
            title: 'Game over',
            body: `You scored ${score} and grew to ${length} segments.`,
            action: 'Play again',
          }
        : status === 'paused'
          ? { title: 'Paused', body: 'Take your time.', action: 'Resume' }
          : null

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <ScoreBoard score={score} best={best} length={length} />

      <div
        className="relative aspect-square w-full touch-none overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ imageRendering: 'auto' }}
          aria-label={`Snake game board. Score ${score}. Snake length ${length}.`}
          role="img"
        />

        {overlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/85 px-6 text-center backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-balance">
                {overlay.title}
              </h2>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
                {overlay.body}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => (status === 'paused' ? togglePause() : start())}
            >
              {status === 'paused' ? (
                <Play aria-hidden="true" />
              ) : status === 'over' ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <Play aria-hidden="true" />
              )}
              {overlay.action}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="hidden text-xs leading-relaxed text-muted-foreground md:block">
          <span className="font-mono text-foreground">↑ ↓ ← →</span> or{' '}
          <span className="font-mono text-foreground">WASD</span> to steer ·{' '}
          <span className="font-mono text-foreground">Space</span> to pause
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground md:hidden">
          Swipe the board or use the pad
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={togglePause}
            disabled={status !== 'playing' && status !== 'paused'}
          >
            {status === 'paused' ? (
              <Play aria-hidden="true" />
            ) : (
              <Pause aria-hidden="true" />
            )}
            {status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="secondary" size="lg" onClick={start}>
            <RotateCcw aria-hidden="true" />
            Restart
          </Button>
        </div>
      </div>

      <div className="flex justify-center pt-1">
        <DirectionPad onPress={enqueue} />
      </div>
    </div>
  )
}
