import { describe, it, expect, beforeEach } from 'vitest'
import { calculateLevel, xpForNextLevel, addXp, checkMasteryAchievements, handlePracticeAnswer } from './gamification'

describe('Gamification Logic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('calculates level correctly', () => {
    expect(calculateLevel(0)).toBe(1)
    expect(calculateLevel(150)).toBe(2)
    expect(calculateLevel(500)).toBe(3)
  })

  it('calculates xp for next level', () => {
    expect(xpForNextLevel(1)).toBe(100)
    expect(xpForNextLevel(2)).toBe(400)
  })

  it('adds XP and triggers level up', () => {
    const profile = { xp: 0, level: 1, currentStreak: 0, achievements: [] }
    const { profile: p1, levelUp: l1 } = addXp(profile, 50)
    expect(p1.xp).toBe(50)
    expect(p1.level).toBe(1)
    expect(l1).toBe(false)

    const { profile: p2, levelUp: l2 } = addXp(p1, 60)
    expect(p2.xp).toBe(110)
    expect(p2.level).toBe(2)
    expect(l2).toBe(true)
  })

  it('handles practice answer combos and resets', () => {
    const r1 = handlePracticeAnswer(true)
    expect(r1.xpAdded).toBe(10)
    expect(r1.profile.currentStreak).toBe(1)

    const r2 = handlePracticeAnswer(true)
    expect(r2.xpAdded).toBe(11)
    expect(r2.profile.currentStreak).toBe(2)

    const r3 = handlePracticeAnswer(false)
    expect(r3.xpAdded).toBe(2)
    expect(r3.profile.currentStreak).toBe(0)
  })

  it('unlocks mastery achievements', () => {
    const profile = { xp: 0, level: 1, currentStreak: 0, achievements: [] }
    const { profile: p1, unlockedIds: u1 } = checkMasteryAchievements(1, 10, profile)
    expect(u1).toContain('master_10')
    
    const { profile: p2, unlockedIds: u2 } = checkMasteryAchievements(10, 10, p1)
    expect(u2).toContain('master_100')
    expect(p2.achievements).toContain('master_100')
  })
})
