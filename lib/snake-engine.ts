export const GRID = 21
export const CELL = 24
export const BASE_TICK_MS = 135
export const MIN_TICK_MS = 68

export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type Status = 'idle' | 'playing' | 'paused' | 'over'

export const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function isOpposite(a: Direction, b: Direction) {
  return VECTORS[a].x + VECTORS[b].x === 0 && VECTORS[a].y + VECTORS[b].y === 0
}

/** Tick length shortens as the snake grows, so the game ramps up in difficulty. */
export function tickForScore(score: number) {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - score * 3)
}

export function createSnake(): Point[] {
  const mid = Math.floor(GRID / 2)
  // Head first, tail last.
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ]
}

export function spawnFood(snake: Point[]): Point {
  const open: Point[] = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!snake.some((s) => s.x === x && s.y === y)) open.push({ x, y })
    }
  }
  if (open.length === 0) return { x: 0, y: 0 }
  return open[Math.floor(Math.random() * open.length)]
}

export type StepResult = {
  snake: Point[]
  food: Point
  ate: boolean
  dead: boolean
}

/** Advance the simulation by one tick. Pure — returns fresh objects. */
export function step(snake: Point[], food: Point, dir: Direction): StepResult {
  const v = VECTORS[dir]
  const head = { x: snake[0].x + v.x, y: snake[0].y + v.y }

  const hitWall =
    head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID

  // The tail cell is vacated this tick (unless we grow), so it is not a collision.
  const body = snake.slice(0, -1)
  const hitSelf = body.some((s) => s.x === head.x && s.y === head.y)

  if (hitWall || hitSelf) {
    return { snake, food, ate: false, dead: true }
  }

  const ate = head.x === food.x && head.y === food.y
  const next = [head, ...(ate ? snake : snake.slice(0, -1))]

  return {
    snake: next,
    food: ate ? spawnFood(next) : food,
    ate,
    dead: false,
  }
}
