import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down one second at a time and calls onComplete once at zero', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useCountdown(3, onComplete))

    expect(result.current.remaining).toBe(3)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remaining).toBe(2)
    expect(onComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.remaining).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)

    // Further time passing must not call onComplete again.
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('stops ticking while paused and resumes from where it left off', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useCountdown(5, onComplete))

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remaining).toBe(4)

    act(() => {
      result.current.pause()
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.remaining).toBe(4)

    act(() => {
      result.current.resume()
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remaining).toBe(3)
  })
})
