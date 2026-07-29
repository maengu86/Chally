# 습관 수정/삭제 기능 설계

작성일: 2026-07-29
대상 브랜치: `oh`
관련 파일: `src/App.tsx`, `src/index.css`

## 배경

현재 앱에는 습관을 만드는 경로(`createHabit`, `App.tsx:2589`)만 있고, 한 번 만든 습관을 고치거나 지울 방법이 없다. 잘못 만든 습관이 영구히 남는다.

## 목표

홈과 습관 현황 화면에서 습관 카드를 길게 눌러 수정/삭제할 수 있게 한다.

## 범위 밖

- 습관 종류(습관/버릇) 변경 — 아래 "종류 잠금" 참조
- 습관 상세 화면에서의 수정/삭제 진입점 (편집 모드는 홈과 습관 현황에만 둔다)
- 삭제 취소(undo) 기능
- 기록(record) 개별 삭제

---

## 1. 진입점 — 편집 모드 토글

헤더의 편집 아이콘을 누르면 편집 모드가 켜지고, 그 상태에서 습관 카드를 탭하면 액션 시트가 열린다.

```
평소     카드 탭 → 기록하기 (또는 상세 이동)
편집 중  카드 탭 → 액션 시트 (수정하기 / 삭제하기)
```

**카드 마크업을 바꾸지 않는다.** `habit-grid-card`(`App.tsx:1018`)와 `habit-overview-card`(`App.tsx:1130`)는 둘 다 `<button>`이라, 카드 안에 별도 버튼(`⋯`, `✖`)을 넣으면 버튼 중첩이 되어 유효하지 않은 HTML이 된다. 편집 모드는 기존 `onClick`을 분기하기만 하므로 이 문제를 피한다.

### 토글 버튼 위치

| 화면 | 위치 | 기존 요소 |
|---|---|---|
| 홈 | `.section-header.habit-add-row` (`App.tsx:850`) | `습관 추가` 플러스 버튼 옆 |
| 습관 현황 | 화면 헤더 (`App.tsx:1105`) | `습관 현황` 제목 우측 |

홈은 기존 플러스 버튼과 같은 `text-button icon-add-button` 클래스를 재사용하고 아이콘만 `lucide-react`의 `Pencil`로 바꾼다. 두 버튼이 나란히 놓이도록 `.habit-add-row`에 `gap`을 준다.

홈 헤더의 플러스는 `isSelectedToday`일 때만 렌더된다(`App.tsx:849`). 편집 버튼도 같은 조건을 따른다 — 과거 날짜를 보는 중에는 편집 진입점을 노출하지 않는다.

### 편집 모드 시각 표시

편집 중이라는 걸 알 수 없으면 사용자가 기록하려다 시트를 만나게 된다. 두 가지로 표시한다.

- 편집 아이콘 버튼이 활성 상태(키컬러 배경)로 바뀐다
- 습관 카드에 키컬러 테두리가 생긴다

### 상태와 해제

편집 모드는 각 화면의 로컬 state(`isEditMode`)로 둔다. 다음 경우 자동으로 꺼진다.

- 편집 아이콘을 다시 누를 때
- 액션 시트에서 수정 또는 삭제를 완료했을 때
- 화면을 벗어날 때 (컴포넌트 언마운트로 자연 해제)

편집 중에는 카드의 `disabled` 처리(완료된 습관은 탭 불가, `App.tsx:1031`)를 풀어야 한다. 완료한 습관도 수정·삭제할 수 있어야 하기 때문이다.

---

## 2. 컴포넌트 구성

기존 `RecordConfirmModal`(`App.tsx:1926`)의 구조를 따른다 — `modal-backdrop` 래퍼, `useEscapeKey(onClose)`, `modal-actions` 푸터.

```
HabitActionSheet      제목 표시 + [수정하기] [삭제하기] [취소]
HabitDeleteConfirm    "<제목>을(를) 삭제할까요?" + [취소] [삭제]
AppModal (habit 탭)   editHabit prop으로 프리필해 재사용
```

**모달 중첩 금지**: 시트에서 "삭제하기"를 누르면 시트를 먼저 닫고 확인 모달을 연다. "수정하기"도 마찬가지로 시트를 닫고 `AppModal`을 연다.

### 상태 (App 컴포넌트)

```
habitActionTarget: Habit | null    // 액션 시트 대상
pendingDeleteHabit: Habit | null   // 삭제 확인 대상
editingHabit: Habit | null         // 수정 모달 대상
```

---

## 3. 데이터 처리

### 삭제 — 기록은 보존한다

```js
function deleteHabit(habitId) {
  setHabits((current) => current.filter((habit) => habit.id !== habitId))
  // records는 손대지 않는다
}
```

`RecordItem`은 `habitTitle`을 비정규화해 함께 들고 있다. `PastDaySummary`(`App.tsx:902`)와 `MonthReport`(`App.tsx:927`)가 `record.habitId`가 아니라 `record.habitTitle`을 직접 읽으므로, 습관이 사라져도 과거 기록은 깨지지 않고 그대로 렌더링된다.

삭제 후 기대 동작:

| 항목 | 결과 |
|---|---|
| 습관 카드 | 사라짐 |
| 등록 습관 수 | 1 감소 |
| 월간 기록한 날 / 완료 기록 | 변화 없음 |
| 과거 날짜의 기록 목록 | 그대로 표시 |

### 수정 — 제목 변경 시 기록 동기화는 필수

```js
function updateHabit(habitId, patch) {
  setHabits((current) =>
    current.map((habit) => (habit.id === habitId ? { ...habit, ...patch } : habit)),
  )

  const previousTitle = habits.find((habit) => habit.id === habitId)?.title
  if (patch.title != null && patch.title !== previousTitle) {
    setRecords((current) =>
      current.map((record) =>
        record.habitId === habitId ? { ...record, habitTitle: patch.title } : record,
      ),
    )
  }
}
```

`MonthReport`가 `habitTitle`을 키로 집계한다(`App.tsx:929`). 동기화하지 않으면 같은 습관이 옛 이름과 새 이름으로 쪼개져 "가장 자주 한 습관" 통계가 틀어진다. 선택이 아니라 정합성 요구사항이다.

### 종류 잠금

수정 모드에서는 습관/버릇 종류 탭을 비활성화한다. 기록에 `memo: '버릇' | '완료'`가 이미 기록돼 있어서(`App.tsx:2793`), 종류를 바꾸면 과거 기록의 의미가 소급해 달라진다.

수정 가능한 필드: **제목, 요일 선택, 기간**.

### AppModal 재사용

`AppModal`의 habit 탭은 현재 생성 전용이며 내부 state를 기본값으로 초기화한다. 다음을 추가한다:

- `editHabit?: Habit` prop
- `editHabit`이 있으면 `habitTitle` / `habitKind` / `isWeekdayScheduleEnabled` / `selectedWeekdays` / `habitDurationUnit` / `habitDurationCount`를 프리필
- 제출 시 `onCreateHabit` 대신 `onUpdateHabit(id, patch)` 호출
- 모달 제목과 제출 버튼 문구를 "수정"으로 전환
- 종류 탭 `disabled` 처리

---

## 4. 엣지 케이스

| 상황 | 처리 |
|---|---|
| 습관 현황에서 삭제 | 상세 화면으로 이동하지 않으므로 `detailHabitId`는 영향 없음. 리스트에서만 사라진다 |
| 마지막 페이지의 습관 삭제 | `HabitGrid`의 `pageIndex`가 범위를 벗어남 → 챌린지 슬라이더의 클램프 `useEffect` 패턴(`App.tsx:1481`)을 동일 적용 |
| 기록하기 모달의 습관 목록 | `availableRecordHabits`가 `habits` 파생이라 자동 제외됨. 추가 작업 없음 |
| 모든 습관 삭제 | 기존 빈 상태 UI(`App.tsx:877`)가 그대로 동작 |
| 수정 중 제목을 공백으로 | 기존 `canCreateHabit` 검증 재사용 — 제출 버튼 비활성화 |

---

## 5. 접근성

진입점이 실제 `<button>`이므로 키보드와 스크린리더로 도달 가능하다. 다음을 지킨다.

- 편집 토글에 `aria-pressed={isEditMode}`와 `aria-label="습관 편집"`
- 편집 모드일 때 카드의 `aria-label`을 "기록하기"에서 "수정 또는 삭제"로 바꿔 동작 변화를 알린다
- 액션 시트와 확인 모달은 `role="dialog"` + `aria-modal` + `useEscapeKey` — 기존 `RecordConfirmModal` 패턴 그대로

---

## 6. 검증

기존 프로젝트에 테스트 프레임워크가 없다. 수동 검증 항목:

1. 편집 모드가 꺼진 상태에서 카드를 탭하면 평소대로 기록/상세 이동이 된다
2. 편집 아이콘을 누르면 아이콘과 카드에 활성 표시가 나타난다
3. 편집 중 카드를 탭하면 액션 시트가 열린다 (완료된 습관 카드도 열려야 한다)
4. 편집 중에도 홈 슬라이더 좌우 스와이프가 정상 동작한다
5. 수정 또는 삭제를 마치면 편집 모드가 자동으로 꺼진다
6. 삭제 후: 카드 사라짐 / 월간 "완료 기록" 회수 유지 / 과거 날짜 기록 표시 유지
7. 제목 수정 후: 과거 기록의 제목이 함께 바뀌고, "가장 자주 한 습관"이 하나로 집계된다
8. 마지막 페이지의 습관을 지워도 홈 슬라이더가 빈 페이지에 머물지 않는다
9. `npm run build:web` 통과
