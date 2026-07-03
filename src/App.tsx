import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import chevronLeftDoodleSrc from './assets/chevron-left-doodle-v1.png'
import chevronRightDoodleSrc from './assets/chevron-right-doodle-v1.png'
import lockClosedDoodleSrc from './assets/lock-closed-doodle-v6.png'
import lockOpenDoodleSrc from './assets/lock-open-doodle-v6.png'

type Screen = 'home' | 'groups' | 'habitDetail' | 'groupDetail'
type ModalMode = 'record' | 'habit' | 'group'
type HabitDetailConcept = 'summary' | 'check' | 'week' | 'history' | 'coach'

type Habit = {
  id: number
  title: string
  category: string
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
  category: string
  isPrivate: boolean
  uploadedAt: Date
  privateKey?: string
}

type GroupMember = {
  id: number
  name: string
  status: string
  completedCount: number
  totalCount: number
  streak: number
}

const appToday = new Date()
const calendarYear = appToday.getFullYear()
const currentCalendarMonth = appToday.getMonth() + 1
const currentCalendarDay = appToday.getDate()
const todayIso = toISODate(calendarYear, currentCalendarMonth, currentCalendarDay)
const yesterday = new Date(appToday)
yesterday.setDate(appToday.getDate() - 1)
const yesterdayIso = toISODate(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate())
const mockHabitCreatedAt = toISODate(calendarYear, currentCalendarMonth, 1)

const recommendedGroups: Group[] = [
  { id: 1001, title: '여름 물마시기 챌린지', category: '건강', isPrivate: false, uploadedAt: minutesAgo(18) },
  { id: 1002, title: '퇴근 후 산책 인증', category: '운동', isPrivate: true, uploadedAt: hoursAgo(3), privateKey: 'walk' },
  { id: 1003, title: '매일 컨디션 체크', category: '기록', isPrivate: false, uploadedAt: hoursAgo(21) },
  { id: 1004, title: '밤 루틴 정리방', category: '생활', isPrivate: true, uploadedAt: daysAgo(2), privateKey: 'night' },
  { id: 1005, title: '가벼운 스트레칭 모임', category: '운동', isPrivate: false, uploadedAt: daysAgo(5) },
  { id: 1006, title: '카페인 줄이기 클럽', category: '건강', isPrivate: false, uploadedAt: hoursAgo(7) },
]

const mockHabits: Habit[] = [
  { id: 1, title: '물 8잔 마시기', category: '건강', completed: true, createdAt: mockHabitCreatedAt },
  { id: 2, title: '햇빛 피해서 산책', category: '운동', completed: false, createdAt: mockHabitCreatedAt },
  { id: 3, title: '여름 컨디션 기록', category: '기록', completed: true, createdAt: mockHabitCreatedAt },
  { id: 4, title: '카페인 줄이기', category: '건강', completed: false, createdAt: mockHabitCreatedAt },
  { id: 5, title: '가벼운 샤워', category: '생활', completed: true, createdAt: mockHabitCreatedAt },
  { id: 6, title: '취침 전 환기', category: '생활', completed: false, createdAt: mockHabitCreatedAt },
]

const mockRecords: RecordItem[] = [
  { id: 1, habitId: 1, habitTitle: '물 8잔 마시기', memo: '완료', date: todayIso },
  { id: 2, habitId: 3, habitTitle: '여름 컨디션 기록', memo: '완료', date: todayIso },
  { id: 3, habitId: 2, habitTitle: '햇빛 피해서 산책', memo: '완료', date: yesterdayIso },
]

const mockGroups: Group[] = [
  { id: 1, title: '여름 루틴 챌린지', category: '건강', isPrivate: false, uploadedAt: minutesAgo(42) },
  { id: 2, title: '조용한 컨디션 기록', category: '기록', isPrivate: true, uploadedAt: hoursAgo(9) },
]

const groupMembers: GroupMember[] = [
  { id: 1, name: '민지', status: '물마시기 완료', completedCount: 2, totalCount: 3, streak: 6 },
  { id: 2, name: '서연', status: '산책 기록 전', completedCount: 1, totalCount: 3, streak: 3 },
  { id: 3, name: '지우', status: '컨디션 기록 완료', completedCount: 3, totalCount: 3, streak: 9 },
]

type StoredAppState = {
  habits?: Array<Omit<Habit, 'createdAt'> & { createdAt?: string }>
  records?: RecordItem[]
  groups?: Array<Omit<Group, 'uploadedAt'> & { uploadedAt: string }>
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
          className={screen === 'groups' || screen === 'groupDetail' ? 'active' : ''}
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
          <img src={chevronLeftDoodleSrc} alt="" aria-hidden="true" />
        </button>
        <h1>{currentMonth}월</h1>
        <button
          type="button"
          className="month-nav-button"
          onClick={() => moveMonth(1)}
          disabled={currentMonth === currentCalendarMonth}
          aria-label="다음 달"
        >
          <img src={chevronRightDoodleSrc} alt="" aria-hidden="true" />
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
        {calendarDays.map((day) => (
          <button
            type="button"
            className={[
              'month-mini-day',
              markedDays.has(day) ? 'marked' : '',
              currentMonth === currentCalendarMonth && day === currentCalendarDay ? 'today' : '',
              currentMonth > currentCalendarMonth || (currentMonth === currentCalendarMonth && day > currentCalendarDay)
                ? 'future'
                : '',
              selectedDay === day ? 'selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              const isFuture =
                currentMonth > currentCalendarMonth || (currentMonth === currentCalendarMonth && day > currentCalendarDay)
              if (!isFuture) {
                setSelectedDay(day)
                onDateChange({ month: currentMonth, day })
              }
            }}
            key={day}
          >
            {day}
          </button>
        ))}
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
            +
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
  const [concept, setConcept] = useState<HabitDetailConcept>('summary')
  const recordCount = records.length
  const recordDates = new Set(records.map((record) => normalizeRecordDate(record.date)))
  const weekDays = getRecentDateRange(7)
  const weekDoneCount = weekDays.filter((day) => recordDates.has(day.iso)).length
  const lastRecord = [...records].sort((a, b) => b.date.localeCompare(a.date))[0]
  const todayDone = recordDates.has(todayIso)
  const completionText = todayDone ? '오늘 완료' : '오늘 미완료'
  const completionRatio = Math.round((weekDoneCount / weekDays.length) * 100)
  const conceptTabs: { id: HabitDetailConcept; label: string }[] = [
    { id: 'summary', label: '상태' },
    { id: 'check', label: '체크' },
    { id: 'week', label: '주간' },
    { id: 'history', label: '내역' },
    { id: 'coach', label: '코치' },
  ]
  const recentRows = records.slice(-4).reverse()

  return (
    <main className="content detail-content">
      <section className="habit-detail-hero compact">
        <button type="button" className="back-button" onClick={onBack} aria-label="이전 화면">
          ←
        </button>
        <div>
          <p className="eyebrow">습관 상세</p>
          <h1>{habit.title}</h1>
          <span>{habit.category}</span>
        </div>
      </section>

      <section className="detail-concept-tabs varied" aria-label="습관 상세 시안">
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

      <section className={`habit-concept-panel ${concept}`} aria-label="습관 상세 내용">
        {concept === 'summary' && (
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

        {concept === 'check' && (
          <>
            <div className="detail-check-card">
              <span>{formatISODateKorean(todayIso)}</span>
              <h2>{todayDone ? '이미 체크했어요' : '지금 체크할 수 있어요'}</h2>
              <button type="button" className="primary-action detail-primary" onClick={onRecord} disabled={todayDone}>
                {todayDone ? '완료됨' : '기록하기'}
              </button>
            </div>
            <div className="detail-next-list">
              <span>체크 후 달력과 내역에 바로 반영됩니다.</span>
              <span>중복 기록은 같은 날짜에 한 번만 저장됩니다.</span>
            </div>
          </>
        )}

        {concept === 'week' && (
          <>
            <div className="week-strip-detail">
              {weekDays.map((day) => (
                <div className={recordDates.has(day.iso) ? 'done' : ''} key={day.iso}>
                  <span>{day.label}</span>
                  <i />
                </div>
              ))}
            </div>
            <div className="detail-week-copy">
              <h2>{weekDoneCount}일 채웠어요</h2>
              <p>최근 7일 기준으로 이 습관이 얼마나 자주 돌아왔는지 보여줍니다.</p>
            </div>
          </>
        )}

        {concept === 'history' && (
          <>
            <div className="receipt-list detail-history-list">
              {(recentRows.length > 0 ? recentRows : [{ id: 0, date: todayIso, memo: '기록 없음', habitTitle: habit.title, habitId: habit.id }]).map((record) => (
                <article className="receipt-row" key={record.id}>
                  <span className="receipt-dot">{habit.title.slice(0, 1)}</span>
                  <div>
                    <strong>{formatISODateKorean(record.date)}</strong>
                    <span>{record.memo}</span>
                  </div>
                  <em>{record.id === 0 ? '-' : '완료'}</em>
                </article>
              ))}
            </div>
          </>
        )}

        {concept === 'coach' && (
          <>
            <div className="coach-card">
              <span>오늘의 코칭</span>
              <h2>{todayDone ? '오늘은 더 밀지 않아도 돼요' : '완벽함보다 체크가 먼저예요'}</h2>
              <p>{todayDone ? '내일 다시 돌아올 수 있게 부담을 낮게 유지하세요.' : '작게라도 끝낸 표시를 남기는 게 다음 방문을 만듭니다.'}</p>
            </div>
            <div className="coach-actions">
              <button type="button" onClick={onRecord} disabled={todayDone}>{todayDone ? '완료됨' : '기록'}</button>
              <button type="button" onClick={onBack}>목록</button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
function Groups({
  groups,
  habits,
  onOpenGroup,
  onCreateGroup,
}: {
  groups: Group[]
  habits: Habit[]
  onOpenGroup: (group: Group) => void
  onCreateGroup: () => void
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const joinedGroups = groups.filter((group) =>
    `${group.title} ${group.category}`.toLowerCase().includes(normalizedQuery),
  )
  const preferredKeywords = getPreferredGroupKeywords(habits)
  const filteredRecommendedGroups = getRecommendedGroups(preferredKeywords).filter((group) =>
    `${group.title} ${group.category}`.toLowerCase().includes(normalizedQuery),
  )

  return (
    <main className="content group-content">
      <section className="group-search">
        <label>
          <span className="sr-only">모임 검색</span>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="모임 이름이나 카테고리 검색"
          />
        </label>
      </section>

      <section className="section-block joined-groups-section">
        <div className="section-header">
          <div>
            <h2>참여 중인 모임</h2>
          </div>
          <button type="button" className="text-button icon-add-button" onClick={onCreateGroup} aria-label="모임 만들기">
            +
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
                <span className="keyword-badge">{group.category.slice(0, 2)}</span>
                <strong>{group.title}</strong>
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
              <VisibilityDoodle isPrivate={group.isPrivate} />
              <div className="joined-group-card-head">
                <span className="keyword-badge">{group.category.slice(0, 2)}</span>
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
                  <strong>{getGroupChallengeCount(group)}</strong>
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

function getPreferredGroupKeywords(habits: Habit[]) {
  const counts = habits.reduce<Record<string, number>>((acc, habit) => {
    acc[habit.category] = (acc[habit.category] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword)
    .slice(0, 4)
}

function getRecommendedGroups(preferredKeywords: string[]) {
  return [...recommendedGroups]
    .sort((a, b) => {
      const aScore = preferredKeywords.includes(a.category) ? preferredKeywords.length - preferredKeywords.indexOf(a.category) : 0
      const bScore = preferredKeywords.includes(b.category) ? preferredKeywords.length - preferredKeywords.indexOf(b.category) : 0
      return bScore - aScore
    })
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

function getGroupMemberCount(group: Group) {
  return (group.id % 3) + 1
}

function getGroupChallengeCount(group: Group) {
  return group.isPrivate ? 1 : group.id % 4
}

function VisibilityDoodle({ isPrivate }: { isPrivate: boolean }) {
  return (
    <img
      className="visibility-doodle"
      src={isPrivate ? lockClosedDoodleSrc : lockOpenDoodleSrc}
      alt={isPrivate ? '비공개 모임' : '공개 모임'}
      loading="eager"
      decoding="async"
    />
  )
}

function GroupDetail({
  group,
  isJoined,
  onBack,
  onJoin,
}: {
  group: Group
  isJoined: boolean
  onBack: () => void
  onJoin: () => void
}) {
  const rankedMembers = [...groupMembers].sort((a, b) => {
    const completionDiff = b.completedCount - a.completedCount
    return completionDiff === 0 ? b.streak - a.streak : completionDiff
  })

  return (
    <main className="content detail-content">
      <section className="group-detail-hero">
        <button type="button" className="back-button" onClick={onBack} aria-label="이전 화면">
          ←
        </button>
        <div>
          <div className="group-detail-title">
            <div className="group-title-row">
              <span className="keyword-badge">{group.category.slice(0, 2)}</span>
              <h1>{group.title}</h1>
            </div>
            <VisibilityDoodle isPrivate={group.isPrivate} />
          </div>
          <span>{group.category}</span>
        </div>
      </section>

      <section className="group-status-panel">
        <h2>같이 하는 멤버</h2>
        <div className="member-list">
          {groupMembers.map((member) => (
            <article className="member-row" key={member.id}>
              <div>
                <strong>{member.name}</strong>
                <span>{member.status}</span>
              </div>
              <span className="member-progress">
                {member.completedCount}/{member.totalCount}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="group-status-panel">
        <h2>멤버 랭크</h2>
        <div className="member-rank-list">
          {rankedMembers.map((member, index) => (
            <article className="member-rank-row" key={member.id}>
              <span className="rank-number">{index + 1}</span>
              <div>
                <strong>{member.name}</strong>
                <span>{member.streak}일째 이어가는 중</span>
              </div>
              <span className="rank-score">
                {member.completedCount}/{member.totalCount}
              </span>
            </article>
          ))}
        </div>
      </section>

      <button type="button" className="primary-action detail-primary" onClick={onJoin} disabled={isJoined}>
        {isJoined ? '참여 중' : '참여하기'}
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
  const [habitCategory, setHabitCategory] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [groupCategory, setGroupCategory] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [privateKey, setPrivateKey] = useState('')

  const canRecord = habitId !== ''
  const hasPrivateKey = !isPrivate || privateKey.trim().length > 0
  const canCreateHabit = habitTitle.trim().length > 0 && habitCategory.trim().length === 2
  const canCreateGroup = groupTitle.trim().length > 0 && groupCategory.trim().length === 2 && hasPrivateKey
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
        category: habitCategory.trim(),
      })
      onClose()
      return
    }

    if (tab === 'group' && canCreateGroup) {
      onCreateGroup({
        title: groupTitle.trim(),
        category: groupCategory.trim(),
        isPrivate,
        privateKey: isPrivate ? privateKey.trim() : undefined,
      })
      onClose()
    }
  }

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
              <label>
                카테고리 (2글자)
                <input
                  maxLength={2}
                  placeholder="예) 운동"
                  value={habitCategory}
                  onChange={(event) => setHabitCategory(event.target.value)}
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
              <label>
                카테고리 (2글자)
                <input
                  maxLength={2}
                  placeholder="예) 운동"
                  value={groupCategory}
                  onChange={(event) => setGroupCategory(event.target.value)}
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
                  비공개 키
                  <input
                    placeholder="비공개 키를 입력하세요"
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

function PrivateGroupGate({
  group,
  value,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  group: Group
  value: string
  error: string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="private-gate-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div>
          <span className="keyword-badge">{group.category.slice(0, 2)}</span>
          <h2>{group.title}</h2>
          <p>비공개 모임은 키를 확인한 뒤 상세를 볼 수 있어요.</p>
        </div>
        <label>
          비공개 키
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSubmit()
              }
            }}
            placeholder="비공개 키를 입력하세요"
            autoFocus
          />
        </label>
        {error !== '' && <p className="private-gate-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={onClose}>
            취소
          </button>
          <button type="button" className="submit-button" onClick={onSubmit} disabled={value.trim() === ''}>
            확인
          </button>
        </div>
      </section>
    </div>
  )
}

function App() {
  const storedState = useMemo(readStoredAppState, [])
  const [screen, setScreen] = useState<Screen>('home')
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedHabitId, setSelectedHabitId] = useState<number | undefined>()
  const [detailHabitId, setDetailHabitId] = useState<number | null>(null)
  const [detailGroup, setDetailGroup] = useState<Group | null>(null)
  const [pendingPrivateGroup, setPendingPrivateGroup] = useState<Group | null>(null)
  const [privateGroupKey, setPrivateGroupKey] = useState('')
  const [privateGroupError, setPrivateGroupError] = useState('')
  const [records, setRecords] = useState<RecordItem[]>(() =>
    normalizeStoredRecords(storedState.records),
  )
  const [habits, setHabits] = useState<Habit[]>(() =>
    normalizeStoredHabits(storedState.habits, normalizeStoredRecords(storedState.records)),
  )
  const [groups, setGroups] = useState<Group[]>(() => normalizeStoredGroups(storedState.groups))

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
  const isActiveGroupJoined = activeGroup == null ? false : groups.some((group) => group.title === activeGroup.title)

  useEffect(() => {
    const payload: StoredAppState = {
      habits,
      records,
      groups: groups.map((group) => ({
        ...group,
        uploadedAt: group.uploadedAt.toISOString(),
      })),
    }

    window.localStorage.setItem(appStorageKey, JSON.stringify(payload))
  }, [groups, habits, records])

  function moveScreen(nextScreen: Screen) {
    setScreen(nextScreen)
    if (nextScreen !== 'habitDetail') {
      setDetailHabitId(null)
    }
    if (nextScreen !== 'groupDetail') {
      setDetailGroup(null)
    }
  }

  function openHabitDetail(habitId: number) {
    setDetailHabitId(habitId)
    setScreen('habitDetail')
  }

  function openGroupDetail(group: Group) {
    const isJoined = groups.some((item) => item.title === group.title)
    if (group.isPrivate && !isJoined) {
      setPendingPrivateGroup(group)
      setPrivateGroupKey('')
      setPrivateGroupError('')
      return
    }

    setDetailGroup(group)
    setScreen('groupDetail')
  }

  function closePrivateGroupGate() {
    setPendingPrivateGroup(null)
    setPrivateGroupKey('')
    setPrivateGroupError('')
  }

  function confirmPrivateGroupKey() {
    if (pendingPrivateGroup == null) {
      return
    }

    if (pendingPrivateGroup.privateKey !== privateGroupKey.trim()) {
      setPrivateGroupError('비공개 키가 맞지 않아요.')
      return
    }

    setDetailGroup(pendingPrivateGroup)
    setScreen('groupDetail')
    closePrivateGroupGate()
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
          habits={habits}
          onOpenGroup={openGroupDetail}
          onCreateGroup={() => setModalMode('group')}
        />
      ) : screen === 'groupDetail' && activeGroup != null ? (
        <GroupDetail
          group={activeGroup}
          isJoined={isActiveGroupJoined}
          onBack={() => moveScreen('groups')}
          onJoin={() => joinGroup(activeGroup)}
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

      {pendingPrivateGroup != null && (
        <PrivateGroupGate
          group={pendingPrivateGroup}
          value={privateGroupKey}
          error={privateGroupError}
          onChange={(value) => {
            setPrivateGroupKey(value)
            setPrivateGroupError('')
          }}
          onClose={closePrivateGroupGate}
          onSubmit={confirmPrivateGroupKey}
        />
      )}
    </div>
  )
}

export default App



