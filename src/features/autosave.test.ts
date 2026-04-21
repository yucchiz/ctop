import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutosaver } from './autosave'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('autosave', () => {
  it('debounces rapid schedules into a single save', async () => {
    const save = vi.fn(async () => {})
    const autosaver = createAutosaver(save, { delay: 500 })

    autosaver.schedule('a')
    autosaver.schedule('ab')
    autosaver.schedule('abc')

    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('abc')
  })

  it('resets the debounce timer when a new schedule comes in', async () => {
    const save = vi.fn(async () => {})
    const autosaver = createAutosaver(save, { delay: 500 })

    autosaver.schedule('a')
    await vi.advanceTimersByTimeAsync(400)
    autosaver.schedule('ab')
    await vi.advanceTimersByTimeAsync(400)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('ab')
  })

  it('transitions through status: idle → pending → saving → saved', async () => {
    const statuses: string[] = []
    const save = vi.fn(async () => {})
    const autosaver = createAutosaver(save, {
      delay: 500,
      onStatusChange: (s) => statuses.push(s),
    })

    expect(autosaver.status()).toBe('idle')
    autosaver.schedule('x')
    expect(autosaver.status()).toBe('pending')

    await vi.advanceTimersByTimeAsync(500)
    await vi.runAllTimersAsync()
    expect(statuses).toEqual(['pending', 'saving', 'saved'])
  })

  it('flush runs the pending save immediately', async () => {
    const save = vi.fn(async () => {})
    const autosaver = createAutosaver(save, { delay: 500 })
    autosaver.schedule('x')
    const flushPromise = autosaver.flush()
    await vi.runAllTimersAsync()
    await flushPromise
    expect(save).toHaveBeenCalledWith('x')
  })

  it('sets status=error when save throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const statuses: string[] = []
    const save = vi.fn(async () => {
      throw new Error('boom')
    })
    const autosaver = createAutosaver(save, {
      delay: 500,
      onStatusChange: (s) => statuses.push(s),
    })
    autosaver.schedule('x')
    await vi.advanceTimersByTimeAsync(500)
    await vi.runAllTimersAsync()
    expect(statuses).toContain('error')
    consoleSpy.mockRestore()
  })
})
