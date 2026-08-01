import { describe, it, expect, beforeEach } from 'vitest'
import { calculateLevel, getLevelTitle, xpForNextLevel, addXp, checkMasteryAchievements, checkLevelAchievements, handlePracticeAnswer, checkExamAchievements } from './gamification'

describe('Gamification Logic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('calculates level and titles correctly', () => {
    expect(calculateLevel(0)).toBe(1)
    expect(calculateLevel(150)).toBe(2)
    expect(calculateLevel(500)).toBe(3)
    
    expect(getLevelTitle(1)).toBe('Tập Sự')
    expect(getLevelTitle(5)).toBe('Tân Binh')
    expect(getLevelTitle(100)).toBe('Huyền Thoại')
  })

  it('calculates xp for next level', () => {
    expect(xpForNextLevel(1)).toBe(100)
    expect(xpForNextLevel(2)).toBe(400)
  })

  it('adds XP and triggers level up', () => {
    const profile = { subjectId: 'test-subject', xp: 0, level: 1, currentStreak: 0, achievements: [] }
    const { profile: p1, levelUp: l1 } = addXp(profile, 50)
    expect(p1.xp).toBe(50)
    expect(p1.level).toBe(1)
    expect(l1).toBe(false)

    const { profile: p2, levelUp: l2 } = addXp(p1, 60)
    expect(p2.xp).toBe(110)
    expect(p2.level).toBe(2)
    expect(l2).toBe(true)
  })

  it('handles practice answer combos, resets and stumble achievement', () => {
    const r1 = handlePracticeAnswer('test-subject', true)
    expect(r1.xpAdded).toBe(10)
    expect(r1.profile.currentStreak).toBe(1)
    expect(r1.unlockedIds).toContain('first_blood')

    // Simulate streak of 9 more to get combo_10
    let comboResult
    for(let i = 0; i < 9; i++) {
      comboResult = handlePracticeAnswer('test-subject', true)
    }
    expect(comboResult?.profile.currentStreak).toBe(10)
    expect(comboResult?.unlockedIds).toContain('combo_10')

    const r3 = handlePracticeAnswer('test-subject', false)
    expect(r3.xpAdded).toBe(2)
    expect(r3.profile.currentStreak).toBe(0)
    expect(r3.profile.incorrectStreak).toBe(1)
    
    // Simulate 4 more incorrect to get stumble
    let stumbleResult
    for(let i = 0; i < 4; i++) {
      stumbleResult = handlePracticeAnswer('test-subject', false)
    }
    expect(stumbleResult?.profile.incorrectStreak).toBe(5)
    expect(stumbleResult?.unlockedIds).toContain('stumble')
  })

  it('unlocks mastery achievements', () => {
    const profile = { subjectId: 'test-subject', xp: 0, level: 1, currentStreak: 0, achievements: [] }
    const { profile: p1, unlockedIds: u1 } = checkMasteryAchievements(1, 10, profile)
    expect(u1).toContain('master_10')
    
    const { profile: p2, unlockedIds: u2 } = checkMasteryAchievements(10, 10, p1)
    expect(u2).toContain('master_100')
    expect(p2.achievements).toContain('master_100')
  })
  
  it('unlocks level achievements', () => {
    const profile = { subjectId: 'test-subject', xp: 0, level: 20, currentStreak: 0, achievements: [] }
    const { unlockedIds: u1 } = checkLevelAchievements(profile)
    expect(u1).toContain('level_20')
  })

  it('integration flow: completing practice block unlocks level 20', () => {
    // Level 20 requires (19^2)*100 = 36100 xp
    let profile = { subjectId: 'test-subject', xp: 36050, level: 19, currentStreak: 0, achievements: [] }
    const { profile: newProfile, levelUp } = addXp(profile, 50)
    expect(levelUp).toBe(true)
    expect(newProfile.level).toBe(20)

    const { unlockedIds } = checkLevelAchievements(newProfile)
    expect(unlockedIds).toContain('level_20')
  })

  it('integration flow: completing exam unlocks level 50 and exam achievements', () => {
    // Level 50 requires (49^2)*100 = 240100 xp
    let profile = { subjectId: 'test-subject', xp: 240050, level: 49, currentStreak: 0, achievements: [] }
    const { profile: newProfile, levelUp } = addXp(profile, 50)
    expect(levelUp).toBe(true)
    expect(newProfile.level).toBe(50)

    const { profile: levelAchProfile, unlockedIds: levelIds } = checkLevelAchievements(newProfile)
    expect(levelIds).toContain('level_50')

    const { unlockedIds: examIds } = checkExamAchievements(40, 50, true, levelAchProfile)
    expect(examIds).toContain('challenger')
    expect([...levelIds, ...examIds]).toContain('level_50')
    expect([...levelIds, ...examIds]).toContain('challenger')
  })
})
