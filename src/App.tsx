import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Lock, LockOpen, Plus, Search, UserRoundCheck } from 'lucide-react'

type Screen = 'home' | 'groups' | 'habitDetail' | 'groupDetail' | 'groupMembers'
type ModalMode = 'record' | 'habit' | 'group'
type HabitDetailConcept = 'status1' | 'status2' | 'status3' | 'status4' | 'status5'

type Habit = {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

type RecordItem = {
  id: number
  habitId: number
  habitTitle: string
  memo: string
  date: string
}

type Group = {
  id: number
  title: string
  isPrivate: boolean
  uploadedAt: Date
  privateKey?: string
}

type GroupMember = {
  id: number
  name: string
  status: string
  joinedAt: string
  avatarDataUrl?: string
}

type UserProfile = {
  id: number
  nickname: string
  createdAt: string
  avatarDataUrl?: string
}

type GroupChallengeProgress = {
  memberId: number
  completedCount: number
  totalCount: number
  note: string
}

type GroupChallenge = {
  id: number
  title: string
  summary: string
  isParticipating: boolean
  progress: GroupChallengeProgress[]
}

type GroupChallengeStore = Record<string, GroupChallenge[]>

const appToday = new Date()
const calendarYear = appToday.getFullYear()
const currentCalendarMonth = appToday.getMonth() + 1
const currentCalendarDay = appToday.getDate()
const todayIso = toISODate(calendarYear, currentCalendarMonth, currentCalendarDay)
const yesterday = new Date(appToday)
yesterday.setDate(appToday.getDate() - 1)
const yesterdayIso = toISODate(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate())
const mockHabitCreatedAt = toISODate(calendarYear, currentCalendarMonth, 1)
const currentUserId = 1

const recommendedGroups: Group[] = [
  { id: 1001, title: '여름 물마시기 챌린지', isPrivate: false, uploadedAt: minutesAgo(18) },
  { id: 1002, title: '퇴근 후 산책 인증', isPrivate: true, uploadedAt: hoursAgo(3), privateKey: 'walk' },
  { id: 1003, title: '매일 컨디션 체크', isPrivate: false, uploadedAt: hoursAgo(21) },
  { id: 1004, title: '밤 루틴 정리방', isPrivate: true, uploadedAt: daysAgo(2), privateKey: 'night' },
  { id: 1005, title: '가벼운 스트레칭 모임', isPrivate: false, uploadedAt: daysAgo(5) },
  { id: 1006, title: '카페인 줄이기 클럽', isPrivate: false, uploadedAt: hoursAgo(7) },
]

const mockHabits: Habit[] = [
  { id: 1, title: '물 8잔 마시기', completed: true, createdAt: mockHabitCreatedAt },
  { id: 2, title: '햇빛 피해서 산책', completed: false, createdAt: mockHabitCreatedAt },
  { id: 3, title: '여름 컨디션 기록', completed: true, createdAt: mockHabitCreatedAt },
  { id: 4, title: '카페인 줄이기', completed: false, createdAt: mockHabitCreatedAt },
  { id: 5, title: '가벼운 샤워', completed: true, createdAt: mockHabitCreatedAt },
  { id: 6, title: '취침 전 환기', completed: false, createdAt: mockHabitCreatedAt },
]

const mockRecords: RecordItem[] = [
  { id: 1, habitId: 1, habitTitle: '물 8잔 마시기', memo: '완료', date: todayIso },
  { id: 2, habitId: 3, habitTitle: '여름 컨디션 기록', memo: '완료', date: todayIso },
  { id: 3, habitId: 2, habitTitle: '햇빛 피해서 산책', memo: '완료', date: yesterdayIso },
]

const mockGroups: Group[] = [
  { id: 1, title: '여름 루틴 챌린지', isPrivate: false, uploadedAt: minutesAgo(42) },
  { id: 2, title: '조용한 컨디션 기록', isPrivate: true, uploadedAt: hoursAgo(9) },
]

const groupMembers: GroupMember[] = [
  { id: 1, name: '지우', status: '오늘 인증 완료', joinedAt: '2026-06-08' },
  { id: 2, name: '민지', status: '아침 체크 완료', joinedAt: '2026-06-09' },
  { id: 3, name: '서연', status: '저녁 기록 예정', joinedAt: '2026-06-10' },
  { id: 4, name: '하린', status: '물마시기 완료', joinedAt: '2026-06-11' },
  { id: 5, name: '유나', status: '컨디션 체크 완료', joinedAt: '2026-06-12' },
  { id: 6, name: '다은', status: '산책 인증 완료', joinedAt: '2026-06-12' },
  { id: 7, name: '소윤', status: '루틴 점검 완료', joinedAt: '2026-06-13' },
  { id: 8, name: '나은', status: '오후 기록 대기', joinedAt: '2026-06-14' },
  { id: 9, name: '예린', status: '체크리스트 완료', joinedAt: '2026-06-15' },
  { id: 10, name: '채원', status: '수분 보충 완료', joinedAt: '2026-06-16' },
  { id: 11, name: '수아', status: '밤 기록 예정', joinedAt: '2026-06-17' },
  { id: 12, name: '가은', status: '오늘 참여 완료', joinedAt: '2026-06-18' },
  { id: 13, name: '예서', status: '컨디션 기록 대기', joinedAt: '2026-06-19' },
  { id: 14, name: '시은', status: '산책 기록 완료', joinedAt: '2026-06-20' },
  { id: 15, name: '윤서', status: '아침 루틴 완료', joinedAt: '2026-06-21' },
]

const groupChallenges: GroupChallenge[] = [
  {
    id: 1,
    title: '물마시기',
    summary: '하루 물 8잔 인증',
    isParticipating: true,
    progress: [
      { memberId: 1, completedCount: 10, totalCount: 10, note: '오늘 인증 완료' },
      { memberId: 2, completedCount: 9, totalCount: 10, note: '아침 체크 완료' },
      { memberId: 4, completedCount: 9, totalCount: 10, note: '수분 보충 완료' },
      { memberId: 7, completedCount: 8, totalCount: 10, note: '오후 기록 완료' },
      { memberId: 10, completedCount: 8, totalCount: 10, note: '저녁 체크 예정' },
      { memberId: 5, completedCount: 7, totalCount: 10, note: '오늘 6잔 완료' },
      { memberId: 12, completedCount: 7, totalCount: 10, note: '참여 기록 완료' },
      { memberId: 6, completedCount: 6, totalCount: 10, note: '점심 체크 완료' },
      { memberId: 9, completedCount: 6, totalCount: 10, note: '저녁 기록 대기' },
      { memberId: 15, completedCount: 5, totalCount: 10, note: '아침 루틴 완료' },
      { memberId: 3, completedCount: 5, totalCount: 10, note: '저녁 기록 예정' },
      { memberId: 14, completedCount: 4, totalCount: 10, note: '오후 체크 완료' },
      { memberId: 8, completedCount: 4, totalCount: 10, note: '기록 대기' },
      { memberId: 11, completedCount: 3, totalCount: 10, note: '밤 기록 예정' },
      { memberId: 13, completedCount: 2, totalCount: 10, note: '첫 기록 완료' },
    ],
  },
  {
    id: 2,
    title: '산책 기록',
    summary: '20분 걷기 인증',
    isParticipating: false,
    progress: [
      { memberId: 6, completedCount: 10, totalCount: 10, note: '산책 인증 완료' },
      { memberId: 14, completedCount: 9, totalCount: 10, note: '저녁 산책 완료' },
      { memberId: 3, completedCount: 8, totalCount: 10, note: '기록 확인 완료' },
      { memberId: 1, completedCount: 8, totalCount: 10, note: '오늘 인증 완료' },
      { memberId: 9, completedCount: 7, totalCount: 10, note: '퇴근 후 완료' },
      { memberId: 2, completedCount: 7, totalCount: 10, note: '아침 산책 완료' },
      { memberId: 11, completedCount: 6, totalCount: 10, note: '밤 산책 예정' },
      { memberId: 5, completedCount: 6, totalCount: 10, note: '가벼운 산책 완료' },
      { memberId: 7, completedCount: 5, totalCount: 10, note: '점심 산책 완료' },
      { memberId: 15, completedCount: 5, totalCount: 10, note: '오늘 참여 완료' },
      { memberId: 10, completedCount: 4, totalCount: 10, note: '저녁 체크 예정' },
      { memberId: 4, completedCount: 4, totalCount: 10, note: '오후 기록 대기' },
      { memberId: 12, completedCount: 3, totalCount: 10, note: '참여 기록 완료' },
      { memberId: 8, completedCount: 3, totalCount: 10, note: '기록 대기' },
      { memberId: 13, completedCount: 2, totalCount: 10, note: '첫 산책 완료' },
    ],
  },
  {
    id: 3,
    title: '컨디션 기록',
    summary: '잠들기 전 상태 체크',
    isParticipating: true,
    progress: [
      { memberId: 5, completedCount: 10, totalCount: 10, note: '컨디션 체크 완료' },
      { memberId: 12, completedCount: 10, totalCount: 10, note: '오늘 참여 완료' },
      { memberId: 9, completedCount: 9, totalCount: 10, note: '체크리스트 완료' },
      { memberId: 1, completedCount: 9, totalCount: 10, note: '오늘 인증 완료' },
      { memberId: 13, completedCount: 8, totalCount: 10, note: '컨디션 기록 완료' },
      { memberId: 2, completedCount: 8, totalCount: 10, note: '아침 체크 완료' },
      { memberId: 11, completedCount: 7, totalCount: 10, note: '밤 기록 예정' },
      { memberId: 7, completedCount: 7, totalCount: 10, note: '루틴 점검 완료' },
      { memberId: 3, completedCount: 6, totalCount: 10, note: '저녁 기록 예정' },
      { memberId: 15, completedCount: 6, totalCount: 10, note: '아침 루틴 완료' },
      { memberId: 4, completedCount: 5, totalCount: 10, note: '오늘 체크 완료' },
      { memberId: 8, completedCount: 5, totalCount: 10, note: '오후 기록 대기' },
      { memberId: 6, completedCount: 4, totalCount: 10, note: '운동 후 기록 예정' },
      { memberId: 10, completedCount: 4, totalCount: 10, note: '저녁 체크 예정' },
      { memberId: 14, completedCount: 3, totalCount: 10, note: '밤 기록 대기' },
    ],
  },
  {
    id: 4,
    title: '카페인 줄이기',
    summary: '오후 2시 이후 카페인 쉬기',
    isParticipating: true,
    progress: [
      { memberId: 8, completedCount: 9, totalCount: 10, note: '오후 기록 완료' },
      { memberId: 2, completedCount: 8, totalCount: 10, note: '아침 체크 완료' },
      { memberId: 11, completedCount: 8, totalCount: 10, note: '밤 기록 예정' },
      { memberId: 1, completedCount: 7, totalCount: 10, note: '오늘 인증 완료' },
      { memberId: 4, completedCount: 7, totalCount: 10, note: '저녁 기록 완료' },
      { memberId: 13, completedCount: 6, totalCount: 10, note: '컨디션 기록 대기' },
      { memberId: 5, completedCount: 5, totalCount: 10, note: '체크 예정' },
      { memberId: 10, completedCount: 5, totalCount: 10, note: '저녁 체크 예정' },
      { memberId: 6, completedCount: 4, totalCount: 10, note: '점심 체크 완료' },
      { memberId: 15, completedCount: 4, totalCount: 10, note: '아침 루틴 완료' },
    ],
  },
  {
    id: 5,
    title: '밤 루틴',
    summary: '자기 전 정리 루틴 인증',
    isParticipating: true,
    progress: [
      { memberId: 11, completedCount: 10, totalCount: 10, note: '밤 기록 예정' },
      { memberId: 15, completedCount: 9, totalCount: 10, note: '아침 루틴 완료' },
      { memberId: 3, completedCount: 8, totalCount: 10, note: '저녁 기록 예정' },
      { memberId: 7, completedCount: 8, totalCount: 10, note: '루틴 점검 완료' },
      { memberId: 1, completedCount: 7, totalCount: 10, note: '오늘 인증 완료' },
      { memberId: 14, completedCount: 7, totalCount: 10, note: '밤 기록 대기' },
      { memberId: 9, completedCount: 6, totalCount: 10, note: '체크리스트 완료' },
      { memberId: 12, completedCount: 6, totalCount: 10, note: '오늘 참여 완료' },
      { memberId: 4, completedCount: 5, totalCount: 10, note: '정리 완료' },
      { memberId: 8, completedCount: 5, totalCount: 10, note: '오후 기록 대기' },
    ],
  },
  {
    id: 6,
    title: '스트레칭',
    summary: '가벼운 5분 스트레칭',
    isParticipating: false,
    progress: [
      { memberId: 6, completedCount: 8, totalCount: 10, note: '산책 후 완료' },
      { memberId: 14, completedCount: 8, totalCount: 10, note: '저녁 스트레칭 완료' },
      { memberId: 2, completedCount: 7, totalCount: 10, note: '아침 체크 완료' },
      { memberId: 5, completedCount: 6, totalCount: 10, note: '컨디션 체크 완료' },
      { memberId: 10, completedCount: 5, totalCount: 10, note: '저녁 체크 예정' },
      { memberId: 13, completedCount: 4, totalCount: 10, note: '첫 기록 완료' },
    ],
  },
  {
    id: 7,
    title: '아침 루틴',
    summary: '기상 후 루틴 체크',
    isParticipating: false,
    progress: [
      { memberId: 15, completedCount: 9, totalCount: 10, note: '아침 루틴 완료' },
      { memberId: 2, completedCount: 8, totalCount: 10, note: '아침 체크 완료' },
      { memberId: 7, completedCount: 7, totalCount: 10, note: '루틴 점검 완료' },
      { memberId: 1, completedCount: 6, totalCount: 10, note: '오늘 인증 완료' },
      { memberId: 5, completedCount: 5, totalCount: 10, note: '체크 예정' },
      { memberId: 9, completedCount: 4, totalCount: 10, note: '체크리스트 완료' },
    ],
  },
  {
    id: 8,
    title: '샤워 루틴',
    summary: '가벼운 샤워 기록',
    isParticipating: false,
    progress: [
      { memberId: 4, completedCount: 8, totalCount: 10, note: '저녁 기록 완료' },
      { memberId: 12, completedCount: 7, totalCount: 10, note: '오늘 참여 완료' },
      { memberId: 8, completedCount: 6, totalCount: 10, note: '오후 기록 대기' },
      { memberId: 3, completedCount: 5, totalCount: 10, note: '저녁 기록 예정' },
      { memberId: 14, completedCount: 5, totalCount: 10, note: '오후 체크 완료' },
      { memberId: 10, completedCount: 4, totalCount: 10, note: '저녁 체크 예정' },
    ],
  },
]

type StoredAppState = {
  userProfile?: UserProfile
  habits?: Array<Omit<Habit, 'createdAt'> & { createdAt?: string }>
  records?: RecordItem[]
  groups?: Array<Omit<Group, 'uploadedAt'> & { uploadedAt: string }>
  groupChallengesByGroup?: GroupChallengeStore
}

const appStorageKey = 'chally:toss-app-state:v1'

function readStoredAppState(): StoredAppState {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(appStorageKey)
    if (raw == null) {
      return {}
    }

    return JSON.parse(raw) as StoredAppState
  } catch {
    return {}
  }
}

function normalizeStoredGroups(groups: StoredAppState['groups']) {
  if (!Array.isArray(groups)) {
    return mockGroups
  }

  return groups.map((group) => ({
    ...group,
    uploadedAt: new Date(group.uploadedAt),
  }))
}

function getGroupKey(group: Pick<Group, 'title'>) {
  return group.title
}

function cloneGroupChallenges(challenges: GroupChallenge[] = groupChallenges): GroupChallenge[] {
  return challenges.map((challenge) => ({
    ...challenge,
    progress: challenge.progress.map((progress) => ({ ...progress })),
  }))
}

function normalizeStoredGroupChallengesByGroup(groupChallengesByGroup: StoredAppState['groupChallengesByGroup']) {
  if (
    groupChallengesByGroup == null ||
    typeof groupChallengesByGroup !== 'object' ||
    Array.isArray(groupChallengesByGroup)
  ) {
    return {}
  }

  return Object.entries(groupChallengesByGroup).reduce<GroupChallengeStore>((acc, [groupKey, challenges]) => {
    if (Array.isArray(challenges)) {
      acc[groupKey] = cloneGroupChallenges(challenges)
    }
    return acc
  }, {})
}

function getChallengesForGroup(groupChallengeStore: GroupChallengeStore, group: Group) {
  return groupChallengeStore[getGroupKey(group)] ?? cloneGroupChallenges()
}

function normalizeStoredUserProfile(userProfile: StoredAppState['userProfile']) {
  if (
    userProfile == null ||
    typeof userProfile.nickname !== 'string' ||
    userProfile.nickname.trim().length === 0
  ) {
    return null
  }

  return {
    id: currentUserId,
    nickname: userProfile.nickname.trim(),
    createdAt: normalizeRecordDate(userProfile.createdAt),
    avatarDataUrl: typeof userProfile.avatarDataUrl === 'string' ? userProfile.avatarDataUrl : undefined,
  }
}

function getGroupMembers(userProfile: UserProfile | null) {
  if (userProfile == null) {
    return groupMembers
  }

  return groupMembers.map((member) =>
    member.id === currentUserId
      ? {
          ...member,
          name: userProfile.nickname,
          status: '내 기록',
          avatarDataUrl: userProfile.avatarDataUrl,
        }
      : member,
  )
}

function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onEscape])
}

function normalizeStoredRecords(records: StoredAppState['records']) {
  if (!Array.isArray(records)) {
    return mockRecords
  }

  return records.map((record) => ({
    ...record,
    date: normalizeRecordDate(record.date),
  }))
}

function normalizeStoredHabits(habits: StoredAppState['habits'], records: RecordItem[]) {
  if (!Array.isArray(habits)) {
    return mockHabits
  }

  return habits.map((habit) => {
    const firstRecordDate = records
      .filter((record) => record.habitId === habit.id)
      .map((record) => normalizeRecordDate(record.date))
      .sort()[0]

    return {
      ...habit,
      createdAt: normalizeRecordDate(habit.createdAt ?? firstRecordDate ?? todayIso),
    }
  })
}

function TopBar({
  screen,
  onMove,
}: {
  screen: Screen
  onMove: (screen: Screen) => void
}) {
  return (
    <header className="top-bar">
      <div className="brand">
        <img src="/logo.svg" alt="Chally" />
      </div>
      <nav className="top-tabs" aria-label="주요 화면">
        <button
          type="button"
          className={screen === 'home' || screen === 'habitDetail' ? 'active' : ''}
          onClick={() => onMove('home')}
        >
          기록
        </button>
        <button
          type="button"
          className={screen === 'groups' || screen === 'groupDetail' || screen === 'groupMembers' ? 'active' : ''}
          onClick={() => onMove('groups')}
        >
          모임
        </button>
      </nav>
    </header>
  )
}

function MonthOverview({
  records,
  onDateChange,
}: {
  records: RecordItem[]
  onDateChange: (date: { month: number; day: number }) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(currentCalendarMonth)
  const [selectedDay, setSelectedDay] = useState<number | null>(currentCalendarDay)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const calendarDays = Array.from({ length: getDaysInMonth(calendarYear, currentMonth) }, (_, index) => index + 1)
  const calendarStartOffset = getCalendarStartOffset(calendarYear, currentMonth)
  const recordsByDay = records.reduce<Record<number, RecordItem[]>>((acc, record) => {
    if (getRecordMonth(record) !== currentMonth) {
      return acc
    }

    const day = getRecordDay(record)
    if (day == null) {
      return acc
    }

    acc[day] = [...(acc[day] ?? []), record]
    return acc
  }, {})
  const markedDays = new Set(Object.keys(recordsByDay).map(Number))

  function moveMonth(direction: -1 | 1) {
    setCurrentMonth((month) => {
      const nextMonth = Math.min(currentCalendarMonth, Math.max(1, month + direction))
      const nextSelectedDay = nextMonth === currentCalendarMonth ? currentCalendarDay : 1
      setSelectedDay(nextSelectedDay)
      onDateChange({ month: nextMonth, day: nextSelectedDay })
      return nextMonth
    })
  }

  function finishDrag(endX: number) {
    if (dragStartX == null) {
      return
    }

    const distance = endX - dragStartX
    if (Math.abs(distance) > 48) {
      moveMonth(distance > 0 ? -1 : 1)
    }
    setDragStartX(null)
  }

  return (
    <section
      className="month-overview"
      aria-label="이번 달 기록"
      onPointerDown={(event) => setDragStartX(event.clientX)}
      onPointerUp={(event) => finishDrag(event.clientX)}
      onPointerCancel={() => setDragStartX(null)}
    >
      <div className="month-overview-header">
        <button type="button" className="month-nav-button" onClick={() => moveMonth(-1)} aria-label="이전 달">
          <ChevronLeft className="ui-icon ui-icon--chevron" strokeWidth={2.2} aria-hidden="true" />
        </button>
        <h1>{currentMonth}월</h1>
        <button
          type="button"
          className="month-nav-button"
          onClick={() => moveMonth(1)}
          disabled={currentMonth === currentCalendarMonth}
          aria-label="다음 달"
        >
          <ChevronRight className="ui-icon ui-icon--chevron" strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      <div className="month-mini-weekdays" aria-hidden="true">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="month-mini-calendar">
        <span className="sr-only">기록 달력</span>
        {Array.from({ length: calendarStartOffset }, (_, index) => (
          <i className="month-mini-empty" key={`empty-${index}`} />
        ))}
        {calendarDays.map((day) => {
          const isFuture =
            currentMonth > currentCalendarMonth || (currentMonth === currentCalendarMonth && day > currentCalendarDay)

          return (
            <button
              type="button"
              className={[
                'month-mini-day',
                markedDays.has(day) ? 'marked' : '',
                currentMonth === currentCalendarMonth && day === currentCalendarDay ? 'today' : '',
                isFuture ? 'future' : '',
                selectedDay === day ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={isFuture}
              onClick={() => {
                setSelectedDay(day)
                onDateChange({ month: currentMonth, day })
              }}
              key={day}
            >
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function getRecordDay(record: RecordItem) {
  return getDateParts(record.date)?.day ?? null
}

function getRecordMonth(record: RecordItem) {
  return getDateParts(record.date)?.month ?? null
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getCalendarStartOffset(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

function toISODate(year: number, month: number, day: number) {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function getDateParts(date: string) {
  const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch != null) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    }
  }

  const koreanMatch = date.match(/(\d{4})년\s*(\d+)월\s*(\d+)일/)
  if (koreanMatch != null) {
    return {
      year: Number(koreanMatch[1]),
      month: Number(koreanMatch[2]),
      day: Number(koreanMatch[3]),
    }
  }

  return null
}

function normalizeRecordDate(date: string) {
  const parts = getDateParts(date)
  return parts == null ? date : toISODate(parts.year, parts.month, parts.day)
}

function formatISODateKorean(date: string) {
  const parts = getDateParts(date)
  return parts == null ? date : formatKoreanDate(parts.year, parts.month, parts.day)
}

function formatMemberJoinDate(date: string) {
  const parts = getDateParts(date)
  return parts == null ? date : `${parts.month}월 ${parts.day}일`
}

function getRecentDateRange(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(appToday)
    date.setDate(appToday.getDate() - (count - 1 - index))
    const month = date.getMonth() + 1
    const day = date.getDate()
    return {
      iso: toISODate(date.getFullYear(), month, day),
      label: `${month}/${day}`,
    }
  })
}

function formatKoreanDate(year: number, month: number, day: number) {
  return `${year}년 ${month}월 ${day}일`
}

function Home({
  habits,
  records,
  onOpenHabit,
  onOpenHabitDetail,
}: {
  habits: Habit[]
  records: RecordItem[]
  onOpenHabit: () => void
  onOpenHabitDetail: (habitId: number) => void
}) {
  const [selectedCalendarDate, setSelectedCalendarDate] = useState({
    month: currentCalendarMonth,
    day: currentCalendarDay,
  })
  const selectedDateRecords = records.filter(
    (record) => getRecordMonth(record) === selectedCalendarDate.month && getRecordDay(record) === selectedCalendarDate.day,
  )
  const selectedDateRecordHabitIds = new Set(selectedDateRecords.map((record) => record.habitId))
  const isSelectedToday =
    selectedCalendarDate.month === currentCalendarMonth && selectedCalendarDate.day === currentCalendarDay
  const selectedDateIso = toISODate(calendarYear, selectedCalendarDate.month, selectedCalendarDate.day)
  const orderedHabits = habits
    .filter((habit) => normalizeRecordDate(habit.createdAt) <= selectedDateIso)
    .map((habit) => ({
      ...habit,
      completed: selectedDateRecordHabitIds.has(habit.id),
    }))
    .sort((a, b) => {
      const completionDiff = isSelectedToday
        ? Number(a.completed) - Number(b.completed)
        : Number(b.completed) - Number(a.completed)
    return completionDiff === 0 ? b.id - a.id : completionDiff
    })

  return (
    <main className="content">
      <MonthOverview records={records} onDateChange={setSelectedCalendarDate} />

      <section className="section-block">
        <div className="section-header">
          <div>
            <h2>내 습관</h2>
          </div>
          <button type="button" className="text-button icon-add-button" onClick={onOpenHabit} aria-label="습관 추가">
            <Plus className="ui-icon ui-icon--plus" strokeWidth={2.3} aria-hidden="true" />
          </button>
        </div>

        {orderedHabits.length === 0 ? (
          <button type="button" className="empty-cta" onClick={onOpenHabit}>
            <strong>{habits.length === 0 ? '아직 습관이 없어요' : '이 날짜에는 습관이 없어요'}</strong>
            <span>{habits.length === 0 ? '눌러서 첫 습관을 만들어보세요' : '습관을 만든 날부터 목록에 표시됩니다'}</span>
          </button>
        ) : (
          <HabitPagedGrid habits={orderedHabits} onOpenHabitDetail={onOpenHabitDetail} />
        )}
      </section>

    </main>
  )
}

function HabitPagedGrid({
  habits,
  onOpenHabitDetail,
}: {
  habits: Habit[]
  onOpenHabitDetail: (habitId: number) => void
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const didSwipeRef = useRef(false)
  const pageSize = 3
  const pages = Array.from({ length: Math.ceil(habits.length / pageSize) }, (_, index) =>
    habits.slice(index * pageSize, index * pageSize + pageSize),
  )
  const currentPage = pages[pageIndex] ?? pages[0] ?? []

  function moveHabitPage(direction: -1 | 1) {
    setPageIndex((current) => Math.min(pages.length - 1, Math.max(0, current + direction)))
  }

  function finishHabitDrag(endX: number) {
    if (dragStartX == null) {
      return
    }

    const distance = endX - dragStartX
    if (Math.abs(distance) > 42) {
      didSwipeRef.current = true
      moveHabitPage(distance > 0 ? -1 : 1)
    }
    setDragStartX(null)
  }

  return (
    <div
      className="habit-paged-grid"
      onPointerDown={(event) => setDragStartX(event.clientX)}
      onPointerUp={(event) => finishHabitDrag(event.clientX)}
      onPointerCancel={() => setDragStartX(null)}
    >
      <div className="habit-grid-page">
        {currentPage.map((habit) => (
          <button
            type="button"
            className={habit.completed ? 'habit-grid-card done' : 'habit-grid-card'}
            onClick={() => {
              if (didSwipeRef.current) {
                didSwipeRef.current = false
                return
              }
              onOpenHabitDetail(habit.id)
            }}
            key={habit.id}
          >
            <span className="habit-status-badge">{habit.completed ? '완료' : '미완료'}</span>
            <strong>{habit.title}</strong>
          </button>
        ))}
      </div>
      {pages.length > 1 && (
        <div className="habit-page-dots" aria-label="습관 페이지">
          {pages.map((page, index) => (
            <button
              type="button"
              className={index === pageIndex ? 'active' : ''}
              onClick={() => setPageIndex(index)}
              aria-label={`${index + 1}번째 습관 묶음 보기`}
              key={`habit-page-${page[0]?.id ?? index}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HabitDetail({
  habit,
  records,
  onBack,
  onRecord,
}: {
  habit: Habit
  records: RecordItem[]
  onBack: () => void
  onRecord: () => void
}) {
  const [concept, setConcept] = useState<HabitDetailConcept>('status1')
  const recordCount = records.length
  const recordDates = new Set(records.map((record) => normalizeRecordDate(record.date)))
  const weekDays = getRecentDateRange(7)
  const weekDoneCount = weekDays.filter((day) => recordDates.has(day.iso)).length
  const lastRecord = [...records].sort((a, b) => b.date.localeCompare(a.date))[0]
  const todayDone = recordDates.has(todayIso)
  const completionText = todayDone ? '오늘 완료' : '오늘 미완료'
  const completionRatio = Math.round((weekDoneCount / weekDays.length) * 100)
  const conceptTabs: { id: HabitDetailConcept; label: string }[] = [
    { id: 'status1', label: '요약' },
    { id: 'status2', label: '흐름' },
    { id: 'status3', label: '주간' },
    { id: 'status4', label: '기록' },
    { id: 'status5', label: '다음' },
  ]
  const paceLabel = completionRatio >= 70 ? '안정적' : completionRatio >= 40 ? '유지 중' : '시작 단계'
  const lastRecordText = lastRecord == null ? '아직 기록 없음' : formatISODateKorean(lastRecord.date)

  return (
    <main className="content detail-content">
      <section className="habit-detail-hero compact">
        <button type="button" className="back-button" onClick={onBack} aria-label="이전 화면">
          <ArrowLeft className="ui-icon ui-icon--back" strokeWidth={2.1} aria-hidden="true" />
        </button>
        <div>
          <h1>{habit.title}</h1>
        </div>
      </section>

      <section className="detail-concept-tabs varied" aria-label="상태 시안">
        {conceptTabs.map((tab, index) => (
          <button
            type="button"
            className={concept === tab.id ? `active tone-${index}` : `tone-${index}`}
            onClick={() => setConcept(tab.id)}
            key={tab.id}
          >
            {tab.label}
          </button>
        ))}
      </section>

      <section className={`habit-concept-panel ${concept}`} aria-label="상태 내용">
        {concept === 'status1' && (
          <>
            <div className="detail-summary-board">
              <span className={todayDone ? 'habit-status-badge done-inline' : 'habit-status-badge'}>{completionText}</span>
              <h2>{todayDone ? '오늘 흐름을 채웠어요' : '오늘 아직 비어 있어요'}</h2>
              <p>{lastRecord == null ? '첫 기록을 남기면 이곳에 흐름이 쌓입니다.' : `최근 기록은 ${formatISODateKorean(lastRecord.date)}입니다.`}</p>
            </div>
            <div className="detail-stat-row">
              <div>
                <span>이번 주</span>
                <strong>{weekDoneCount}/7</strong>
              </div>
              <div>
                <span>전체 기록</span>
                <strong>{recordCount}회</strong>
              </div>
              <div>
                <span>페이스</span>
                <strong>{completionRatio}%</strong>
              </div>
            </div>
            <button type="button" className="primary-action detail-primary" onClick={onRecord} disabled={todayDone}>
              {todayDone ? '기록 완료' : '오늘 기록하기'}
            </button>
          </>
        )}

        {concept === 'status2' && (
          <>
            <div className="detail-summary-board status-quiet-board">
              <span className={todayDone ? 'habit-status-badge done-inline' : 'habit-status-badge'}>오늘 상태</span>
              <h2>{todayDone ? '기록이 닫혔어요' : '아직 열려 있어요'}</h2>
              <p>{formatISODateKorean(todayIso)} 기준으로 오늘 처리 상태만 먼저 보여줍니다.</p>
            </div>
            <div className="status-progress-card">
              <div>
                <span>최근 7일 완성도</span>
                <strong>{completionRatio}%</strong>
              </div>
              <div className="status-progress-track" aria-hidden="true">
                <i style={{ width: `${completionRatio}%` }} />
              </div>
              <em>{weekDoneCount}일 기록, {7 - weekDoneCount}일 비어 있음</em>
            </div>
            <div className="status-action-row">
              <button type="button" className="primary-action detail-primary" onClick={onRecord} disabled={todayDone}>
                {todayDone ? '기록 완료' : '오늘 기록하기'}
              </button>
            </div>
          </>
        )}

        {concept === 'status3' && (
          <>
            <div className="week-strip-detail status-week-strip">
              {weekDays.map((day) => (
                <div className={recordDates.has(day.iso) ? 'done' : ''} key={day.iso}>
                  <span>{day.label}</span>
                  <i />
                </div>
              ))}
            </div>
            <div className="detail-summary-board status-week-board">
              <span className={todayDone ? 'habit-status-badge done-inline' : 'habit-status-badge'}>{paceLabel}</span>
              <h2>최근 7일 중 {weekDoneCount}일</h2>
              <p>주간 흐름을 먼저 보고 오늘 기록 여부를 바로 판단하는 형태입니다.</p>
            </div>
            <div className="status-focus-grid">
              <div>
                <span>오늘</span>
                <strong>{todayDone ? '완료' : '대기'}</strong>
              </div>
              <div>
                <span>최근 기록</span>
                <strong>{lastRecordText}</strong>
              </div>
            </div>
          </>
        )}

        {concept === 'status4' && (
          <>
            <div className="detail-summary-board status-line-board">
              <span className={todayDone ? 'habit-status-badge done-inline' : 'habit-status-badge'}>기록 상태</span>
              <h2>{recordCount}번 쌓였어요</h2>
              <p>상세한 내역보다 현재 누적과 최신 상태를 압축해서 보여주는 시안입니다.</p>
            </div>
            <div className="status-check-list">
              <article>
                <span>최근 기록</span>
                <strong>{lastRecordText}</strong>
              </article>
              <article>
                <span>오늘 처리</span>
                <strong>{todayDone ? '완료' : '미완료'}</strong>
              </article>
              <article>
                <span>주간 페이스</span>
                <strong>{paceLabel}</strong>
              </article>
            </div>
          </>
        )}

        {concept === 'status5' && (
          <>
            <div className="detail-summary-board status-soft-board">
              <span className={todayDone ? 'habit-status-badge done-inline' : 'habit-status-badge'}>다음 상태</span>
              <h2>{todayDone ? '내일 다시 이어가요' : '오늘 표시만 남겨요'}</h2>
              <p>{todayDone ? '오늘 기록은 완료됐고 다음 체크만 남았습니다.' : '기록 버튼을 누르면 랭크와 달력에 바로 반영됩니다.'}</p>
            </div>
            <div className="detail-next-list status-next-list">
              <span>오늘 상태: {todayDone ? '완료' : '대기'}</span>
              <span>이번 주: {weekDoneCount}/7</span>
              <span>전체 기록: {recordCount}회</span>
            </div>
            <button type="button" className="primary-action detail-primary" onClick={onRecord} disabled={todayDone}>
              {todayDone ? '기록 완료' : '오늘 기록하기'}
            </button>
          </>
        )}
      </section>
    </main>
  )
}
function Groups({
  groups,
  onOpenGroup,
  onCreateGroup,
  getChallengeCount,
}: {
  groups: Group[]
  onOpenGroup: (group: Group) => void
  onCreateGroup: () => void
  getChallengeCount: (group: Group) => number
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const joinedGroups = groups.filter((group) =>
    group.title.toLowerCase().includes(normalizedQuery),
  )
  const filteredRecommendedGroups = getRecommendedGroups().filter((group) =>
    group.title.toLowerCase().includes(normalizedQuery),
  )

  return (
    <main className="content group-content">
      <section className="group-search">
        <label>
          <span className="sr-only">모임 검색</span>
          <Search className="ui-icon search-icon" strokeWidth={2.1} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="모임 이름 검색"
          />
        </label>
      </section>

      <section className="section-block joined-groups-section">
        <div className="section-header">
          <div>
            <h2>참여 중인 모임</h2>
          </div>
          <button type="button" className="text-button icon-add-button" onClick={onCreateGroup} aria-label="모임 만들기">
            <Plus className="ui-icon ui-icon--plus" strokeWidth={2.3} aria-hidden="true" />
          </button>
        </div>

        {joinedGroups.length === 0 ? (
          <button type="button" className="empty-cta" onClick={onCreateGroup}>
            <strong>{query.trim() === '' ? '참여 중인 모임이 없어요' : '검색된 모임이 없어요'}</strong>
            <span>{query.trim() === '' ? '직접 만들거나 추천 모임에 참여하세요' : '다른 검색어로 찾아보세요'}</span>
          </button>
        ) : (
          <div className="recommend-card-grid joined-section">
            {joinedGroups.map((group) => (
              <button
                type="button"
                className="recommend-group-card joined-style"
                onClick={() => onOpenGroup(group)}
                key={group.id}
              >
                <strong>{group.title}</strong>
                <span>{getGroupMemberCount(group)}명 · 챌린지 {getChallengeCount(group)}개</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="section-block group-recommend-section">
        <div className="section-header">
          <div>
            <h2>모임 추천</h2>
          </div>
        </div>

        <div className="joined-group-grid recommend-section">
          {filteredRecommendedGroups.map((group) => (
            <button type="button" className="joined-group-card recommended-summary" onClick={() => onOpenGroup(group)} key={group.id}>
              <div className="joined-group-card-head">
                <VisibilityIcon isPrivate={group.isPrivate} />
                <strong>{group.title}</strong>
              </div>
              <div className="joined-group-stats" aria-label="추천 모임 요약">
                <span>
                  <strong>{getGroupMemberCount(group)}</strong>
                  멤버
                </span>
                <span>
                  <strong>{formatLatestUploadTime(group.uploadedAt)}</strong>
                  최근
                </span>
                <span>
                  <strong>{getChallengeCount(group)}</strong>
                  챌린지
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function getRecommendedGroups() {
  return [...recommendedGroups]
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(0, 4)
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000)
}

function hoursAgo(hours: number) {
  return minutesAgo(hours * 60)
}

function daysAgo(days: number) {
  return hoursAgo(days * 24)
}

function formatLatestUploadTime(uploadedAt: Date) {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - uploadedAt.getTime()) / (60 * 1000)))

  if (diffMinutes < 60) {
    return `${Math.max(1, diffMinutes)}m`
  }

  if (diffMinutes < 24 * 60) {
    return `${Math.floor(diffMinutes / 60)}h`
  }

  return `${Math.floor(diffMinutes / (24 * 60))}d`
}

function getGroupMemberCount(_group: Group) {
  return groupMembers.length
}

function VisibilityIcon({ isPrivate }: { isPrivate: boolean }) {
  const Icon = isPrivate ? Lock : LockOpen

  return (
    <span className="visibility-icon-wrap">
      <Icon className="ui-icon ui-icon--lock visibility-icon" strokeWidth={2.1} aria-hidden="true" />
      <span className="sr-only">{isPrivate ? '비공개 모임' : '공개 모임'}</span>
    </span>
  )
}

function DefaultAvatar({ className = '' }: { className?: string }) {
  return (
    <span className={className === '' ? 'default-avatar' : `default-avatar ${className}`} aria-hidden="true">
      <span className="default-avatar-head" />
      <span className="default-avatar-body" />
    </span>
  )
}

function GroupDetail({
  group,
  challenges,
  members,
  onBack,
  onOpenMembers,
  onCreateChallenge,
  onJoinChallenge,
  onRecordChallenge,
}: {
  group: Group
  challenges: GroupChallenge[]
  members: GroupMember[]
  onBack: () => void
  onOpenMembers: () => void
  onCreateChallenge: (challenge: GroupChallenge) => void
  onJoinChallenge: (challengeId: number) => void
  onRecordChallenge: (challengeId: number) => void
}) {
  const initialRankableChallenge = challenges.find((challenge) => challenge.isParticipating) ?? challenges[0]
  const [selectedChallengeId, setSelectedChallengeId] = useState(initialRankableChallenge?.id ?? 0)
  const [availableChallengePage, setAvailableChallengePage] = useState(0)
  const [joinedChallengePage, setJoinedChallengePage] = useState(0)
  const [challengeSheetMode, setChallengeSheetMode] = useState<'create' | 'record' | null>(null)
  const [pendingJoinChallenge, setPendingJoinChallenge] = useState<GroupChallenge | null>(null)
  const [newChallengeTitle, setNewChallengeTitle] = useState('')
  const [newChallengeSummary, setNewChallengeSummary] = useState('')
  const [recordChallengeId, setRecordChallengeId] = useState(initialRankableChallenge?.id ?? 0)
  const [isRecordChallengeMenuOpen, setIsRecordChallengeMenuOpen] = useState(false)
  const allGroupChallenges = challenges
  const availableChallenges = allGroupChallenges.filter((challenge) => !challenge.isParticipating)
  const participatingChallenges = allGroupChallenges.filter((challenge) => challenge.isParticipating)
  const rankableChallenges = participatingChallenges.length > 0 ? participatingChallenges : allGroupChallenges
  const availableChallengePages = availableChallenges.reduce<GroupChallenge[][]>((pages, challenge, index) => {
    if (index % 3 === 0) {
      pages.push([])
    }
    pages[pages.length - 1].push(challenge)
    return pages
  }, [])
  const joinedChallengePages = participatingChallenges.reduce<GroupChallenge[][]>((pages, challenge, index) => {
    if (index % 3 === 0) {
      pages.push([])
    }
    pages[pages.length - 1].push(challenge)
    return pages
  }, [])
  const availablePageCount = Math.max(1, availableChallengePages.length)
  const activeAvailablePage = Math.min(availableChallengePage, availablePageCount - 1)
  const joinedPageCount = Math.max(1, joinedChallengePages.length)
  const activeJoinedPage = Math.min(joinedChallengePage, joinedPageCount - 1)
  const selectedChallenge = rankableChallenges.find((challenge) => challenge.id === selectedChallengeId) ?? rankableChallenges[0]
  const selectedRecordChallenge =
    participatingChallenges.find((challenge) => challenge.id === recordChallengeId) ?? participatingChallenges[0]
  const selectedChallengeProgress = selectedChallenge?.progress ?? []
  const progressByMember = new Map(selectedChallengeProgress.map((progress) => [progress.memberId, progress]))
  const membersWithProgress = members.map((member) => ({
    ...member,
    progress: progressByMember.get(member.id) ?? {
      memberId: member.id,
      completedCount: 0,
      totalCount: selectedChallengeProgress[0]?.totalCount ?? 0,
      note: member.status,
    },
  }))
  const rankedMembers = [...membersWithProgress]
    .sort((a, b) => {
      const completionDiff = b.progress.completedCount - a.progress.completedCount
      return completionDiff === 0 ? a.name.localeCompare(b.name, 'ko') : completionDiff
    })
    .slice(0, 5)

  useEffect(() => {
    if (availableChallengePage > availablePageCount - 1) {
      setAvailableChallengePage(availablePageCount - 1)
    }
  }, [availableChallengePage, availablePageCount])

  useEffect(() => {
    if (joinedChallengePage > joinedPageCount - 1) {
      setJoinedChallengePage(joinedPageCount - 1)
    }
  }, [joinedChallengePage, joinedPageCount])

  function moveJoinedChallengePage(pageIndex: number) {
    setJoinedChallengePage(pageIndex)
    const firstChallenge = joinedChallengePages[pageIndex]?.[0]
    if (firstChallenge != null) {
      setSelectedChallengeId(firstChallenge.id)
    }
  }

  function openChallengeMenu() {
    setRecordChallengeId(selectedChallenge?.id ?? participatingChallenges[0]?.id ?? 0)
    setIsRecordChallengeMenuOpen(false)
    setChallengeSheetMode('record')
  }

  function openRecordSheet() {
    setRecordChallengeId(selectedChallenge?.id ?? participatingChallenges[0]?.id ?? 0)
    setIsRecordChallengeMenuOpen(false)
    setChallengeSheetMode('record')
  }

  function closeChallengeSheet() {
    setChallengeSheetMode(null)
    setNewChallengeTitle('')
    setNewChallengeSummary('')
    setIsRecordChallengeMenuOpen(false)
  }

  function createGroupChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = newChallengeTitle.trim()
    if (title.length === 0) {
      return
    }

    const nextChallengeId = Math.max(...allGroupChallenges.map((challenge) => challenge.id), 0) + 1
    const nextChallenge: GroupChallenge = {
      id: nextChallengeId,
      title,
      summary: newChallengeSummary.trim() || '새 기록을 준비해요',
      isParticipating: false,
      progress: [],
    }

    onCreateChallenge(nextChallenge)
    setAvailableChallengePage(Math.floor(availableChallenges.length / 3))
    closeChallengeSheet()
  }

  function recordSelectedChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!participatingChallenges.some((challenge) => challenge.id === recordChallengeId)) {
      return
    }

    onRecordChallenge(recordChallengeId)
    setSelectedChallengeId(recordChallengeId)
    closeChallengeSheet()
  }

  function confirmJoinChallenge() {
    if (pendingJoinChallenge == null) {
      return
    }

    const nextJoinedIndex = allGroupChallenges
      .filter((challenge) => challenge.isParticipating || challenge.id === pendingJoinChallenge.id)
      .findIndex((challenge) => challenge.id === pendingJoinChallenge.id)

    onJoinChallenge(pendingJoinChallenge.id)
    setSelectedChallengeId(pendingJoinChallenge.id)
    setJoinedChallengePage(Math.max(0, Math.floor(nextJoinedIndex / 3)))
    setPendingJoinChallenge(null)
  }

  useEscapeKey(() => {
    if (pendingJoinChallenge != null) {
      setPendingJoinChallenge(null)
      return
    }

    closeChallengeSheet()
  }, challengeSheetMode != null || pendingJoinChallenge != null)

  return (
    <main className="content detail-content">
      <section className="group-detail-hero">
        <button type="button" className="back-button" onClick={onBack} aria-label="이전 화면">
          <ArrowLeft className="ui-icon ui-icon--back" strokeWidth={2.1} aria-hidden="true" />
        </button>
        <div>
          <div className="group-detail-title">
            <div className="group-title-row">
              <h1>{group.title}</h1>
            </div>
            <div className="member-menu-wrap">
              <button
                type="button"
                className="member-icon-button"
                onClick={onOpenMembers}
                aria-label={`멤버 ${members.length}명 보기`}
              >
                <UserRoundCheck className="ui-icon ui-icon--member" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="group-status-panel challenge-panel">
        <div className="challenge-track-section ongoing-challenge-track">
          <div className="panel-heading-row track-heading">
            <div>
              <h2>진행중인 챌린지</h2>
            </div>
            <div className="challenge-page-dots" aria-label="진행중인 챌린지 페이지">
              {Array.from({ length: availablePageCount }, (_, index) => (
                <button
                  type="button"
                  className={activeAvailablePage === index ? 'active' : ''}
                  onClick={() => setAvailableChallengePage(index)}
                  aria-label={`${index + 1}페이지`}
                  key={index}
                />
              ))}
            </div>
          </div>
          <div className="available-challenge-slider" aria-label="진행중인 챌린지">
            <div className="available-challenge-pages" style={{ transform: `translateX(-${activeAvailablePage * 100}%)` }}>
              {availableChallengePages.map((page, pageIndex) => (
                <div className="available-challenge-page" key={pageIndex}>
                  {page.map((challenge) => (
                    <button
                      type="button"
                      className="available-challenge-card"
                      onClick={() => setPendingJoinChallenge(challenge)}
                      key={challenge.id}
                    >
                      <strong>{challenge.title}</strong>
                      <span>{challenge.summary}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="challenge-track-section joined-rank-track">
          <div className="joined-rank-card" aria-label="참여중 챌린지와 멤버 랭크">
            <div className="panel-heading-row track-heading">
              <div>
                <h2>참여중</h2>
              </div>
              <div className="challenge-page-dots" aria-label="참여중 챌린지 페이지">
                {Array.from({ length: joinedPageCount }, (_, index) => (
                  <button
                    type="button"
                    className={activeJoinedPage === index ? 'active' : ''}
                    onClick={() => moveJoinedChallengePage(index)}
                    aria-label={`${index + 1}페이지`}
                    key={index}
                  />
                ))}
              </div>
            </div>
            <div className="joined-challenge-slider" aria-label="참여중인 챌린지">
              <div className="joined-challenge-pages" style={{ transform: `translateX(-${activeJoinedPage * 100}%)` }}>
                {joinedChallengePages.map((page, pageIndex) => (
                  <div className="joined-challenge-page" key={pageIndex}>
                    {page.map((challenge) => (
                      <button
                        type="button"
                        className={selectedChallenge?.id === challenge.id ? 'active' : ''}
                        onClick={() => setSelectedChallengeId(challenge.id)}
                        key={challenge.id}
                      >
                        <span className="joined-challenge-status" aria-hidden="true" />
                        <span className="joined-challenge-copy">
                          <strong>{challenge.title}</strong>
                          <small>{challenge.summary}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="joined-rank-divider" />
            <div className="panel-heading-row challenge-rank-head joined-rank-head">
              <div>
                <h2>멤버 랭크</h2>
              </div>
            </div>
            <div className="member-rank-list">
              {rankedMembers.map((member, index) => (
                <article className="member-rank-row" key={member.id}>
                  <span className={index < 3 ? 'rank-number top-rank' : 'rank-number'}>{index + 1}</span>
                  <div>
                    <strong>{member.name}</strong>
                  </div>
                  <span className="rank-score">{member.progress.completedCount}회</span>
                </article>
              ))}
            </div>
          </div>
        </div>
        <button type="button" className="challenge-fab" onClick={openChallengeMenu} aria-label="챌린지 만들기와 기록">
          <Plus className="ui-icon ui-icon--fab" strokeWidth={3} aria-hidden="true" />
        </button>
      </section>

      {challengeSheetMode != null && (
        <div
          className="modal-backdrop challenge-action-backdrop group-record-backdrop"
          role="presentation"
          onClick={closeChallengeSheet}
        >
          <section
            className="challenge-action-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="챌린지 작업"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="group-challenge-tabs" role="tablist" aria-label="챌린지 작업">
              <button
                type="button"
                role="tab"
                aria-selected={challengeSheetMode === 'record'}
                className={challengeSheetMode === 'record' ? 'active' : ''}
                onClick={openRecordSheet}
              >
                기록하기
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={challengeSheetMode === 'create'}
                className={challengeSheetMode === 'create' ? 'active' : ''}
                onClick={() => setChallengeSheetMode('create')}
              >
                챌린지 만들기
              </button>
            </div>

            {challengeSheetMode === 'create' && (
              <form className="challenge-action-form group-challenge-create-form" onSubmit={createGroupChallenge}>
                <label>
                  <span>이름</span>
                  <input
                    value={newChallengeTitle}
                    onChange={(event) => setNewChallengeTitle(event.target.value)}
                    maxLength={16}
                    placeholder="예: 저녁 산책"
                  />
                </label>
                <label>
                  <span>설명</span>
                  <input
                    value={newChallengeSummary}
                    onChange={(event) => setNewChallengeSummary(event.target.value)}
                    maxLength={24}
                    placeholder="예: 20분 걷기 인증"
                  />
                </label>
                <div className="modal-actions">
                  <button type="button" className="cancel-button" onClick={closeChallengeSheet}>
                    취소
                  </button>
                  <button type="submit" className="submit-button">
                    만들기
                  </button>
                </div>
              </form>
            )}

            {challengeSheetMode === 'record' && (
              <form className="group-record-form" onSubmit={recordSelectedChallenge}>
                <div className="group-record-field">
                  <span className="group-record-label">챌린지</span>
                  <button
                    type="button"
                    className="group-record-select"
                    onClick={() => setIsRecordChallengeMenuOpen((current) => !current)}
                    disabled={participatingChallenges.length === 0}
                  >
                    <span>{selectedRecordChallenge?.title ?? '기록할 챌린지가 없어요'}</span>
                    <span className="group-record-caret" aria-hidden="true" />
                  </button>
                  {isRecordChallengeMenuOpen && (
                    <div className="group-record-menu">
                      {participatingChallenges.map((challenge) => (
                        <button
                          type="button"
                          className={recordChallengeId === challenge.id ? 'selected' : ''}
                          onClick={() => {
                            setRecordChallengeId(challenge.id)
                            setIsRecordChallengeMenuOpen(false)
                          }}
                          key={challenge.id}
                        >
                          {challenge.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="group-record-actions">
                  <button
                    type="button"
                    className="group-record-cancel"
                    onClick={closeChallengeSheet}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="group-record-submit"
                    disabled={participatingChallenges.length === 0}
                  >
                    기록하기
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {pendingJoinChallenge != null && (
        <div className="modal-backdrop challenge-action-backdrop" role="presentation" onClick={() => setPendingJoinChallenge(null)}>
          <section
            className="private-gate-card join-gate-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="challenge-join-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2 id="challenge-join-title">{pendingJoinChallenge.title}</h2>
              <p>이 챌린지에 참여하시겠습니까?</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={() => setPendingJoinChallenge(null)}>
                취소
              </button>
              <button type="button" className="submit-button" onClick={confirmJoinChallenge}>
                참여하기
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function GroupMembersPage({
  challenges,
  members,
  onBack,
  onLeave,
}: {
  challenges: GroupChallenge[]
  members: GroupMember[]
  onBack: () => void
  onLeave: () => void
}) {
  const averageCompletedCount = Math.round(
    members.reduce((sum, member) => {
      const memberCompletedCount = challenges.reduce((total, challenge) => {
        const progress = challenge.progress.find((item) => item.memberId === member.id)
        return total + (progress?.completedCount ?? 0)
      }, 0)
      return sum + memberCompletedCount
    }, 0) / Math.max(1, members.length),
  )

  return (
    <main className="content detail-content member-detail-content">
      <section className="group-detail-hero">
        <button type="button" className="back-button" onClick={onBack} aria-label="이전 화면">
          <ArrowLeft className="ui-icon ui-icon--back" strokeWidth={2.1} aria-hidden="true" />
        </button>
        <div>
          <h1 className="member-page-title">멤버</h1>
        </div>
      </section>

      <section className="member-page-summary" aria-label="멤버 요약">
        <div>
          <span>멤버</span>
          <strong>{members.length}명</strong>
        </div>
        <div>
          <span>챌린지</span>
          <strong>{challenges.length}개</strong>
        </div>
        <div>
          <span>평균 기록</span>
          <strong>{averageCompletedCount}회</strong>
        </div>
      </section>

      <section className="member-page-list" aria-label="멤버 목록">
        {members.map((member) => (
          <article className="member-detail-card" key={member.id}>
            <span className="member-avatar" aria-hidden="true">
              {member.avatarDataUrl != null ? (
                <img src={member.avatarDataUrl} alt="" />
              ) : (
                <DefaultAvatar />
              )}
            </span>
            <div>
              <strong>{member.name}</strong>
            </div>
            <time dateTime={member.joinedAt}>{formatMemberJoinDate(member.joinedAt)}</time>
          </article>
        ))}
      </section>

      <button type="button" className="leave-group-button" onClick={onLeave}>
        탈퇴하기
      </button>
    </main>
  )
}

function AppModal({
  mode,
  habits,
  initialHabitId,
  onClose,
  onCreateHabit,
  onCreateGroup,
  onCreateRecord,
}: {
  mode: ModalMode
  habits: Habit[]
  initialHabitId?: number
  onClose: () => void
  onCreateHabit: (habit: Omit<Habit, 'id' | 'completed' | 'createdAt'>) => void
  onCreateGroup: (group: Omit<Group, 'id' | 'uploadedAt'>) => void
  onCreateRecord: (payload: { habitId: number; date: string }) => void
}) {
  const [tab, setTab] = useState<ModalMode>(mode === 'record' && habits.length === 0 ? 'habit' : mode)
  const canShowRecordTab = mode !== 'group' && habits.length > 0
  const [habitId, setHabitId] = useState(initialHabitId?.toString() ?? habits[0]?.id.toString() ?? '')
  const [recordDate, setRecordDate] = useState(todayIso)
  const [datePickerMonth, setDatePickerMonth] = useState(currentCalendarMonth)
  const [isHabitMenuOpen, setIsHabitMenuOpen] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [habitTitle, setHabitTitle] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [privateKey, setPrivateKey] = useState('')

  const canRecord = habitId !== ''
  const hasPrivateKey = !isPrivate || privateKey.trim().length > 0
  const canCreateHabit = habitTitle.trim().length > 0
  const canCreateGroup = groupTitle.trim().length > 0 && hasPrivateKey
  const selectedHabit = habits.find((habit) => habit.id.toString() === habitId)
  const dateDays = Array.from({ length: getDaysInMonth(calendarYear, datePickerMonth) }, (_, index) => index + 1)

  function moveDatePickerMonth(direction: -1 | 1) {
    setDatePickerMonth((month) => Math.min(12, Math.max(1, month + direction)))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (tab === 'record' && canRecord) {
      onCreateRecord({ habitId: Number(habitId), date: recordDate })
      onClose()
      return
    }

    if (tab === 'habit' && canCreateHabit) {
      onCreateHabit({
        title: habitTitle.trim(),
      })
      onClose()
      return
    }

    if (tab === 'group' && canCreateGroup) {
      onCreateGroup({
        title: groupTitle.trim(),
        isPrivate,
        privateKey: isPrivate ? privateKey.trim() : undefined,
      })
      onClose()
    }
  }

  useEscapeKey(onClose)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        {canShowRecordTab ? (
          <div className="modal-tabs">
            <button type="button" className={tab === 'record' ? 'active' : ''} onClick={() => setTab('record')}>
              기록하기
            </button>
            <button type="button" className={tab === 'habit' ? 'active' : ''} onClick={() => setTab('habit')}>
              습관 만들기
            </button>
          </div>
        ) : (
          <h2 className="modal-title">{mode === 'group' ? '모임 만들기' : '습관 만들기'}</h2>
        )}

        <form className="modal-form" onSubmit={submit}>
          {tab === 'record' && (
            <>
              <div className="field-block">
                <span className="field-label">습관</span>
                <button
                  type="button"
                  className="select-trigger"
                  onClick={() => {
                    setIsHabitMenuOpen((current) => !current)
                    setIsDatePickerOpen(false)
                  }}
                >
                  <span>{selectedHabit?.title ?? '습관을 선택하세요'}</span>
                  <span className="select-caret" aria-hidden="true" />
                </button>
                {isHabitMenuOpen && (
                  <div className="select-menu">
                    {habits.map((habit) => (
                      <button
                        type="button"
                        className={habit.id.toString() === habitId ? 'selected' : ''}
                        onClick={() => {
                          setHabitId(habit.id.toString())
                          setIsHabitMenuOpen(false)
                        }}
                        key={habit.id}
                      >
                        {habit.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="field-block">
                <span className="field-label">날짜</span>
                <button
                  type="button"
                  className="select-trigger"
                  onClick={() => {
                    setIsDatePickerOpen((current) => !current)
                    setIsHabitMenuOpen(false)
                  }}
                >
                  <span>{formatISODateKorean(recordDate)}</span>
                  <span className="select-caret" aria-hidden="true" />
                </button>
                {isDatePickerOpen && (
                  <div className="date-picker-panel" role="dialog" aria-modal="false">
                    <div className="date-picker-header">
                      <button type="button" onClick={() => moveDatePickerMonth(-1)} aria-label="이전 달">
                        &lt;
                      </button>
                      <strong>{calendarYear}년 {datePickerMonth}월</strong>
                      <button type="button" onClick={() => moveDatePickerMonth(1)} aria-label="다음 달">
                        &gt;
                      </button>
                    </div>
                    <div className="date-picker-weekdays" aria-hidden="true">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                    <div className="date-picker-calendar">
                      {Array.from({ length: getCalendarStartOffset(calendarYear, datePickerMonth) }, (_, index) => (
                        <span key={`empty-${index}`} />
                      ))}
                      {dateDays.map((day) => {
                        const date = toISODate(calendarYear, datePickerMonth, day)
                        return (
                          <button
                            type="button"
                            className={recordDate === date ? 'selected' : ''}
                            onClick={() => {
                              setRecordDate(date)
                              setIsDatePickerOpen(false)
                            }}
                            key={day}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={onClose}>
                  취소
                </button>
                <button type="submit" className="submit-button" disabled={!canRecord}>
                  완료하기
                </button>
              </div>
            </>
          )}

          {tab === 'habit' && (
            <>
              <label>
                제목
                <input
                  placeholder="습관 제목을 입력하세요"
                  value={habitTitle}
                  onChange={(event) => setHabitTitle(event.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={onClose}>
                  취소
                </button>
                <button type="submit" className="submit-button" disabled={!canCreateHabit}>
                  만들기
                </button>
              </div>
            </>
          )}

          {tab === 'group' && (
            <>
              <label>
                제목
                <input
                  placeholder="모임 제목을 입력하세요"
                  value={groupTitle}
                  onChange={(event) => setGroupTitle(event.target.value)}
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) => {
                    setIsPrivate(event.target.checked)
                    if (!event.target.checked) {
                      setPrivateKey('')
                    }
                  }}
                />
                비공개
              </label>
              {isPrivate && (
                <label>
                  참여 비밀번호
                  <input
                    placeholder="참여 비밀번호를 입력하세요"
                    value={privateKey}
                    onChange={(event) => setPrivateKey(event.target.value)}
                  />
                </label>
              )}
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={onClose}>
                  취소
                </button>
                <button type="submit" className="submit-button" disabled={!canCreateGroup}>
                  만들기
                </button>
              </div>
            </>
          )}
        </form>
      </section>
    </div>
  )
}

function GroupJoinGate({
  group,
  initialNickname,
  initialAvatarDataUrl,
  onClose,
  onSubmit,
}: {
  group: Group
  initialNickname: string
  initialAvatarDataUrl?: string
  onClose: () => void
  onSubmit: (nickname: string, avatarDataUrl?: string) => void
}) {
  const [nickname, setNickname] = useState(initialNickname)
  const [avatarDataUrl, setAvatarDataUrl] = useState(initialAvatarDataUrl)
  const [privateKey, setPrivateKey] = useState('')
  const [privateKeyError, setPrivateKeyError] = useState('')
  const trimmedNickname = nickname.trim()
  const trimmedPrivateKey = privateKey.trim()
  const canSubmit = trimmedNickname.length >= 2 && (!group.isPrivate || trimmedPrivateKey.length > 0)

  useEscapeKey(onClose)

  function handleAvatarChange(file: File | undefined) {
    if (file == null || !file.type.startsWith('image/')) {
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        setAvatarDataUrl(reader.result)
      }
    })
    reader.readAsDataURL(file)
  }

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    if (group.isPrivate && group.privateKey !== trimmedPrivateKey) {
      setPrivateKeyError('참여 비밀번호가 맞지 않아요.')
      return
    }

    onSubmit(trimmedNickname, avatarDataUrl)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="private-gate-card join-gate-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-join-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="join-gate-form" onSubmit={submitJoin}>
          <div className="join-gate-head">
            <h2 id="group-join-title">{group.title}</h2>
          </div>
          <label className="join-profile-picker">
            <input
              type="file"
              accept="image/*"
              aria-label="프로필 사진 변경"
              onChange={(event) => handleAvatarChange(event.target.files?.[0])}
            />
            <span className="join-avatar-button">
              {avatarDataUrl != null ? (
                <img src={avatarDataUrl} alt="" />
              ) : (
                <DefaultAvatar />
              )}
              <span className="join-camera-badge" aria-hidden="true">
                <Camera className="ui-icon" strokeWidth={2.2} />
              </span>
            </span>
          </label>
          <div className="join-field-stack">
            <label className="join-nickname-field">
              <span className="sr-only">닉네임</span>
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                maxLength={12}
                placeholder="모임에서 사용할 닉네임"
                autoFocus
              />
            </label>
            {group.isPrivate && (
              <>
                <label className="join-private-key-field">
                  <span className="sr-only">참여 비밀번호</span>
                  <input
                    value={privateKey}
                    onChange={(event) => {
                      setPrivateKey(event.target.value)
                      setPrivateKeyError('')
                    }}
                    placeholder="참여 비밀번호를 입력하세요"
                  />
                </label>
                {privateKeyError !== '' && <p className="private-gate-error">{privateKeyError}</p>}
              </>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="submit-button" disabled={!canSubmit}>
              참가
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const storedState = useMemo(readStoredAppState, [])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() =>
    normalizeStoredUserProfile(storedState.userProfile),
  )
  const [screen, setScreen] = useState<Screen>('home')
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedHabitId, setSelectedHabitId] = useState<number | undefined>()
  const [detailHabitId, setDetailHabitId] = useState<number | null>(null)
  const [detailGroup, setDetailGroup] = useState<Group | null>(null)
  const [pendingJoinGroup, setPendingJoinGroup] = useState<Group | null>(null)
  const [records, setRecords] = useState<RecordItem[]>(() =>
    normalizeStoredRecords(storedState.records),
  )
  const [habits, setHabits] = useState<Habit[]>(() =>
    normalizeStoredHabits(storedState.habits, normalizeStoredRecords(storedState.records)),
  )
  const [groups, setGroups] = useState<Group[]>(() => normalizeStoredGroups(storedState.groups))
  const [groupChallengeStore, setGroupChallengeStore] = useState<GroupChallengeStore>(() =>
    normalizeStoredGroupChallengesByGroup(storedState.groupChallengesByGroup),
  )

  const nextHabitId = useMemo(() => Math.max(0, ...habits.map((habit) => habit.id)) + 1, [habits])
  const nextRecordId = useMemo(() => Math.max(0, ...records.map((record) => record.id)) + 1, [records])
  const nextGroupId = useMemo(() => Math.max(0, ...groups.map((group) => group.id)) + 1, [groups])
  const todayRecordHabitIds = useMemo(
    () => new Set(records.filter((record) => record.date === todayIso).map((record) => record.habitId)),
    [records],
  )
  const detailHabitBase = habits.find((habit) => habit.id === detailHabitId)
  const detailHabit =
    detailHabitBase == null ? undefined : { ...detailHabitBase, completed: todayRecordHabitIds.has(detailHabitBase.id) }
  const activeGroup =
    detailGroup == null ? null : groups.find((group) => group.title === detailGroup.title) ?? detailGroup
  const activeGroupChallenges = activeGroup == null ? [] : getChallengesForGroup(groupChallengeStore, activeGroup)
  const activeGroupMembers = useMemo(() => getGroupMembers(userProfile), [userProfile])

  useEffect(() => {
    const payload: StoredAppState = {
      userProfile: userProfile ?? undefined,
      habits,
      records,
      groups: groups.map((group) => ({
        ...group,
          uploadedAt: group.uploadedAt.toISOString(),
        })),
      groupChallengesByGroup: groupChallengeStore,
    }

    window.localStorage.setItem(appStorageKey, JSON.stringify(payload))
  }, [groupChallengeStore, groups, habits, records, userProfile])

  function saveUserProfile(nickname: string, avatarDataUrl?: string) {
    setUserProfile({
      id: currentUserId,
      nickname,
      createdAt: userProfile?.createdAt ?? todayIso,
      avatarDataUrl,
    })
  }

  function moveScreen(nextScreen: Screen) {
    setScreen(nextScreen)
    if (nextScreen !== 'habitDetail') {
      setDetailHabitId(null)
    }
    if (nextScreen !== 'groupDetail' && nextScreen !== 'groupMembers') {
      setDetailGroup(null)
    }
  }

  function openHabitDetail(habitId: number) {
    setDetailHabitId(habitId)
    setScreen('habitDetail')
  }

  function openGroupDetail(group: Group) {
    const isJoined = groups.some((item) => item.title === group.title)
    if (!isJoined) {
      setPendingJoinGroup(group)
      return
    }

    setDetailGroup(group)
    setScreen('groupDetail')
  }

  function openGroupMembers() {
    setScreen('groupMembers')
  }

  function closeGroupJoinGate() {
    setPendingJoinGroup(null)
  }

  function confirmGroupJoin(nickname: string, avatarDataUrl?: string) {
    if (pendingJoinGroup == null) {
      return
    }

    saveUserProfile(nickname, avatarDataUrl)
    joinGroup(pendingJoinGroup)
    setDetailGroup(pendingJoinGroup)
    setScreen('groupDetail')
    closeGroupJoinGate()
  }

  function openRecord(habitId?: number) {
    setSelectedHabitId(habitId)
    setModalMode(habits.length === 0 ? 'habit' : 'record')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedHabitId(undefined)
  }

  function createHabit(habit: Omit<Habit, 'id' | 'completed' | 'createdAt'>) {
    setHabits((current) => [...current, { ...habit, id: nextHabitId, completed: false, createdAt: todayIso }])
  }

  function createGroup(group: Omit<Group, 'id' | 'uploadedAt'>) {
    setGroups((current) => [...current, { ...group, id: nextGroupId, uploadedAt: new Date() }])
  }

  function joinGroup(group: Group) {
    setGroups((current) => {
      if (current.some((item) => item.title === group.title)) {
        return current
      }
      return [...current, { ...group, id: nextGroupId }]
    })
  }

  function leaveActiveGroup() {
    if (activeGroup == null) {
      return
    }

    setGroups((current) => current.filter((group) => group.title !== activeGroup.title))
    setDetailGroup(null)
    setScreen('groups')
  }

  function updateGroupChallenges(group: Group, updater: (challenges: GroupChallenge[]) => GroupChallenge[]) {
    setGroupChallengeStore((current) => {
      const groupKey = getGroupKey(group)
      const currentChallenges = getChallengesForGroup(current, group)

      return {
        ...current,
        [groupKey]: updater(currentChallenges),
      }
    })
  }

  function createGroupChallenge(group: Group, challenge: GroupChallenge) {
    updateGroupChallenges(group, (currentChallenges) => [...currentChallenges, challenge])
  }

  function joinGroupChallenge(group: Group, challengeId: number) {
    updateGroupChallenges(group, (currentChallenges) =>
      currentChallenges.map((challenge) => {
        if (challenge.id !== challengeId) {
          return challenge
        }

        const hasCurrentUserProgress = challenge.progress.some((progress) => progress.memberId === currentUserId)

        return {
          ...challenge,
          isParticipating: true,
          progress: hasCurrentUserProgress
            ? challenge.progress
            : [
                {
                  memberId: currentUserId,
                  completedCount: 0,
                  totalCount: challenge.progress[0]?.totalCount ?? 10,
                  note: '참여 시작',
                },
                ...challenge.progress,
              ],
        }
      }),
    )
  }

  function recordGroupChallenge(group: Group, challengeId: number) {
    updateGroupChallenges(group, (currentChallenges) =>
      currentChallenges.map((challenge) => {
        if (challenge.id !== challengeId) {
          return challenge
        }

        const existingProgress = challenge.progress.find((progress) => progress.memberId === currentUserId)
        const nextCompletedCount = (existingProgress?.completedCount ?? 0) + 1
        const nextProgress: GroupChallengeProgress = {
          memberId: currentUserId,
          completedCount: nextCompletedCount,
          totalCount: Math.max(existingProgress?.totalCount ?? challenge.progress[0]?.totalCount ?? 10, nextCompletedCount),
          note: '기록 완료',
        }

        return {
          ...challenge,
          isParticipating: true,
          progress: [
            nextProgress,
            ...challenge.progress.filter((progress) => progress.memberId !== currentUserId),
          ],
        }
      }),
    )
  }

  function createRecord(payload: { habitId: number; date: string }) {
    const habit = habits.find((item) => item.id === payload.habitId)
    if (habit == null) {
      return
    }

    const normalizedDate = normalizeRecordDate(payload.date)
    setRecords((current) => {
      if (current.some((record) => record.habitId === payload.habitId && record.date === normalizedDate)) {
        return current
      }

      return [
        ...current,
        {
          id: nextRecordId,
          habitId: payload.habitId,
          habitTitle: habit.title,
          memo: '완료',
          date: normalizedDate,
        },
      ]
    })
  }

  return (
    <div className="phone-app">
      <TopBar screen={screen} onMove={moveScreen} />

      {screen === 'groups' ? (
        <Groups
          groups={groups}
          onOpenGroup={openGroupDetail}
          onCreateGroup={() => setModalMode('group')}
          getChallengeCount={(group) => getChallengesForGroup(groupChallengeStore, group).length}
        />
      ) : screen === 'groupMembers' && activeGroup != null ? (
        <GroupMembersPage
          challenges={activeGroupChallenges}
          members={activeGroupMembers}
          onBack={() => moveScreen('groupDetail')}
          onLeave={leaveActiveGroup}
        />
      ) : screen === 'groupDetail' && activeGroup != null ? (
        <GroupDetail
          group={activeGroup}
          challenges={activeGroupChallenges}
          members={activeGroupMembers}
          onBack={() => moveScreen('groups')}
          onOpenMembers={openGroupMembers}
          onCreateChallenge={(challenge) => createGroupChallenge(activeGroup, challenge)}
          onJoinChallenge={(challengeId) => joinGroupChallenge(activeGroup, challengeId)}
          onRecordChallenge={(challengeId) => recordGroupChallenge(activeGroup, challengeId)}
        />
      ) : screen === 'habitDetail' && detailHabit != null ? (
        <HabitDetail
          habit={detailHabit}
          records={records.filter((record) => record.habitId === detailHabit.id)}
          onBack={() => moveScreen('home')}
          onRecord={() => openRecord(detailHabit.id)}
        />
      ) : (
        <Home
          habits={habits}
          records={records}
          onOpenHabit={() => setModalMode('habit')}
          onOpenHabitDetail={openHabitDetail}
        />
      )}

      {modalMode != null && (
        <AppModal
          mode={modalMode}
          habits={habits}
          initialHabitId={selectedHabitId}
          onClose={closeModal}
          onCreateHabit={createHabit}
          onCreateGroup={createGroup}
          onCreateRecord={createRecord}
        />
      )}

      {pendingJoinGroup != null && (
        <GroupJoinGate
          group={pendingJoinGroup}
          initialNickname={userProfile?.nickname ?? ''}
          initialAvatarDataUrl={userProfile?.avatarDataUrl}
          onClose={closeGroupJoinGate}
          onSubmit={confirmGroupJoin}
        />
      )}
    </div>
  )
}

export default App
