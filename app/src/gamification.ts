export type UserProfile = {
  subjectId: string
  xp: number
  level: number
  currentStreak: number
  incorrectStreak?: number
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
  { id: 'stumble', name: 'Cú Vấp Ngã', description: 'Trả lời sai 5 câu liên tiếp.', icon: '🩹' },
  { id: 'combo_10', name: 'Nóng Máy', description: 'Đạt chuỗi Combo 10 câu đúng.', icon: '🔥' },
  { id: 'combo_30', name: 'Bất Khả Chiến Bại', description: 'Đạt chuỗi Combo 30 câu đúng.', icon: '🚀' },
  { id: 'combo_50', name: 'Thần Giao Cách Cảm', description: 'Đạt chuỗi Combo 50 câu đúng.', icon: '⚡' },
  { id: 'level_20', name: 'Thợ Săn Điểm Số', description: 'Đạt Cấp độ 20 ở môn học này.', icon: '🛠️' },
  { id: 'level_50', name: 'Kẻ Chinh Phục', description: 'Đạt Cấp độ 50 ở môn học này.', icon: '🏰' },
  { id: 'level_100', name: 'Đỉnh Cao Danh Vọng', description: 'Đạt Cấp độ 100 ở môn học này.', icon: '🏆' },
  { id: 'challenger', name: 'Kẻ Thách Thức', description: 'Đạt 80% tỉ lệ đúng trong một bài Thi thử 50 câu.', icon: '🏅' },
  { id: 'master_10', name: 'Tân Binh Thành Thạo', description: 'Thành thạo > 10% tổng số câu hỏi trong ngân hàng.', icon: '🥉' },
  { id: 'master_30', name: 'Chuyên Viên Thành Thạo', description: 'Thành thạo > 30% tổng số câu hỏi.', icon: '🥈' },
  { id: 'master_50', name: 'Chuyên Gia Thành Thạo', description: 'Thành thạo > 50% tổng số câu hỏi.', icon: '🥇' },
  { id: 'master_80', name: 'Bậc Thầy Thành Thạo', description: 'Thành thạo > 80% tổng số câu hỏi.', icon: '💎' },
  { id: 'master_100', name: 'Thần Đồng', description: 'Thành thạo 100% tổng số câu hỏi trong ngân hàng.', icon: '👑' },
]

const profileStorageKey = (subjectId: string) => `studypack:profile:${subjectId}`

export function loadProfile(subjectId: string): UserProfile {
  try {
    const raw = localStorage.getItem(profileStorageKey(subjectId))
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        subjectId, // Luôn ép subjectId theo tham số
        xp: typeof parsed.xp === 'number' && !isNaN(parsed.xp) ? parsed.xp : 0,
        level: typeof parsed.level === 'number' && !isNaN(parsed.level) ? parsed.level : 1,
        currentStreak: typeof parsed.currentStreak === 'number' && !isNaN(parsed.currentStreak) ? parsed.currentStreak : 0,
        incorrectStreak: typeof parsed.incorrectStreak === 'number' && !isNaN(parsed.incorrectStreak) ? parsed.incorrectStreak : 0,
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : []
      }
    }
  } catch {}
  return { subjectId, xp: 0, level: 1, currentStreak: 0, incorrectStreak: 0, achievements: [] }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(profileStorageKey(profile.subjectId), JSON.stringify(profile))
}

export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Huyền Thoại'
  if (level >= 50) return 'Đại Tông Sư'
  if (level >= 30) return 'Cao Thủ'
  if (level >= 20) return 'Chuyên Gia'
  if (level >= 10) return 'Học Giả'
  if (level >= 5) return 'Tân Binh'
  return 'Tập Sự'
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

export function handlePracticeAnswer(subjectId: string, isCorrect: boolean): { xpAdded: number, currentStreak: number, levelUp: boolean, profile: UserProfile, unlockedIds: string[] } {
  const profile = loadProfile(subjectId)
  let xpAdded = 0
  let newStreak = profile.currentStreak
  let newIncorrectStreak = profile.incorrectStreak ?? 0

  if (isCorrect) {
    xpAdded = 10 + newStreak
    newStreak += 1
    newIncorrectStreak = 0
  } else {
    xpAdded = 2
    newStreak = 0
    newIncorrectStreak += 1
  }

  const updatedStreakProfile = { ...profile, currentStreak: newStreak, incorrectStreak: newIncorrectStreak }
  const { profile: finalProfile, levelUp } = addXp(updatedStreakProfile, xpAdded)

  let current = finalProfile
  const unlockedIds: string[] = []

  if (isCorrect && newStreak === 1) { const r = unlockAchievement('first_blood', current); if (r.unlocked) { current = r.profile; unlockedIds.push('first_blood') } }
  if (newStreak === 10) { const r = unlockAchievement('combo_10', current); if (r.unlocked) { current = r.profile; unlockedIds.push('combo_10') } }
  if (newStreak === 30) { const r = unlockAchievement('combo_30', current); if (r.unlocked) { current = r.profile; unlockedIds.push('combo_30') } }
  if (newStreak === 50) { const r = unlockAchievement('combo_50', current); if (r.unlocked) { current = r.profile; unlockedIds.push('combo_50') } }
  if (newIncorrectStreak === 5) { const r = unlockAchievement('stumble', current); if (r.unlocked) { current = r.profile; unlockedIds.push('stumble') } }

  return { xpAdded, currentStreak: newStreak, levelUp, profile: current, unlockedIds }
}

export function unlockAchievement(id: string, currentProfile?: UserProfile, subjectId?: string): { unlocked: boolean, profile: UserProfile } {
  if (!currentProfile && !subjectId) throw new Error('Must provide currentProfile or subjectId')
  const profile = currentProfile ?? loadProfile(subjectId!)
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
  if (current.level >= 20) {
    const res = unlockAchievement('level_20', current)
    if (res.unlocked) { current = res.profile; unlockedIds.push('level_20') }
  }
  if (current.level >= 50) {
    const res = unlockAchievement('level_50', current)
    if (res.unlocked) { current = res.profile; unlockedIds.push('level_50') }
  }
  if (current.level >= 100) {
    const res = unlockAchievement('level_100', current)
    if (res.unlocked) { current = res.profile; unlockedIds.push('level_100') }
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
