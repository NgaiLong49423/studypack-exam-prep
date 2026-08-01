export type UserProfile = {
  xp: number
  level: number
  currentStreak: number
  achievements: string[]
}

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', name: 'First Blood', description: 'Lần đầu tiên trả lời đúng một câu hỏi.', icon: '🩸' },
  { id: 'starter', name: 'Khởi Động', description: 'Đạt Level 2.', icon: '🔥' },
  { id: 'bookworm', name: 'Mọt Sách', description: 'Đạt Level 10.', icon: '🤓' },
  { id: 'challenger', name: 'Kẻ Thách Thức', description: 'Đạt 80% tỉ lệ đúng trong một bài Thi thử 50 câu.', icon: '🏅' },
  { id: 'master_10', name: 'Tân Binh Thành Thạo', description: 'Thành thạo > 10% tổng số câu hỏi trong ngân hàng.', icon: '🥉' },
  { id: 'master_30', name: 'Chuyên Viên Thành Thạo', description: 'Thành thạo > 30% tổng số câu hỏi.', icon: '🥈' },
  { id: 'master_50', name: 'Chuyên Gia Thành Thạo', description: 'Thành thạo > 50% tổng số câu hỏi.', icon: '🥇' },
  { id: 'master_80', name: 'Bậc Thầy Thành Thạo', description: 'Thành thạo > 80% tổng số câu hỏi.', icon: '💎' },
  { id: 'master_100', name: 'Thần Đồng', description: 'Thành thạo 100% tổng số câu hỏi trong ngân hàng.', icon: '👑' },
]

const STORAGE_KEY = 'studypack:gamification:v1'

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as UserProfile
  } catch {}
  return { xp: 0, level: 1, currentStreak: 0, achievements: [] }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

export function xpForNextLevel(level: number): number {
  return Math.pow(level, 2) * 100
}

export function addXp(profile: UserProfile, amount: number): { profile: UserProfile, levelUp: boolean } {
  const newXp = profile.xp + amount
  const newLevel = calculateLevel(newXp)
  const levelUp = newLevel > profile.level
  
  const updatedProfile = { ...profile, xp: newXp, level: newLevel }
  saveProfile(updatedProfile)
  return { profile: updatedProfile, levelUp }
}

export function handlePracticeAnswer(isCorrect: boolean): { xpAdded: number, currentStreak: number, levelUp: boolean, profile: UserProfile } {
  const profile = loadProfile()
  let xpAdded = 0
  let newStreak = profile.currentStreak

  if (isCorrect) {
    xpAdded = 10 + newStreak
    newStreak += 1
  } else {
    xpAdded = 2
    newStreak = 0
  }

  const updatedStreakProfile = { ...profile, currentStreak: newStreak }
  const { profile: finalProfile, levelUp } = addXp(updatedStreakProfile, xpAdded)

  return { xpAdded, currentStreak: newStreak, levelUp, profile: finalProfile }
}

export function unlockAchievement(id: string, currentProfile?: UserProfile): { unlocked: boolean, profile: UserProfile } {
  const profile = currentProfile ?? loadProfile()
  if (profile.achievements.includes(id)) {
    return { unlocked: false, profile }
  }
  
  const newProfile = { ...profile, achievements: [...profile.achievements, id] }
  saveProfile(newProfile)
  return { unlocked: true, profile: newProfile }
}

export function checkLevelAchievements(profile: UserProfile): { profile: UserProfile, unlockedIds: string[] } {
  let current = profile
  const unlockedIds: string[] = []
  if (current.level >= 2) {
    const res = unlockAchievement('starter', current)
    if (res.unlocked) { current = res.profile; unlockedIds.push('starter') }
  }
  if (current.level >= 10) {
    const res = unlockAchievement('bookworm', current)
    if (res.unlocked) { current = res.profile; unlockedIds.push('bookworm') }
  }
  return { profile: current, unlockedIds }
}

export function checkMasteryAchievements(masteredCount: number, totalCount: number, profile: UserProfile): { profile: UserProfile, unlockedIds: string[] } {
  let current = profile
  const unlockedIds: string[] = []
  if (totalCount === 0) return { profile: current, unlockedIds }
  
  const percent = (masteredCount / totalCount) * 100
  const thresholds = [
    { id: 'master_10', min: 10 },
    { id: 'master_30', min: 30 },
    { id: 'master_50', min: 50 },
    { id: 'master_80', min: 80 },
    { id: 'master_100', min: 100 }
  ]
  
  thresholds.forEach(({ id, min }) => {
    if (percent >= min) {
      const res = unlockAchievement(id, current)
      if (res.unlocked) { current = res.profile; unlockedIds.push(id) }
    }
  })
  return { profile: current, unlockedIds }
}

export function checkExamAchievements(correctCount: number, totalCount: number, isMock: boolean, profile: UserProfile): { profile: UserProfile, unlockedIds: string[] } {
  let current = profile
  const unlockedIds: string[] = []
  if (isMock && totalCount >= 50 && (correctCount / totalCount) >= 0.8) {
    const res = unlockAchievement('challenger', current)
    if (res.unlocked) { current = res.profile; unlockedIds.push('challenger') }
  }
  return { profile: current, unlockedIds }
}
