import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Download,
  Dumbbell,
  FileText,
  Gamepad2,
  Heart,
  Home,
  Mail,
  Music,
  Pencil,
  Play,
  RotateCcw,
  Settings,
  Shirt,
  Sparkles,
  Square,
  Star,
  TimerReset,
  Trash2,
  Trophy,
} from 'lucide-react'
import clsx from 'clsx'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { useCountdownTimer } from './hooks/useCountdownTimer'
import {
  exportData,
  getSettings,
  resetAllData,
  saveSettings,
} from './lib/storage'
import {
  getCurrentStreakDays,
  getLongestStreakDays,
  getMostStartedTask,
  getRecentSessions,
  getStartsByWeekday,
  getStartsThisMonth,
  getStartsThisWeek,
  getTotalMinutesStarted,
} from './lib/stats'
import { useQuickPickStore } from './stores/quickPickStore'
import { useSessionStore } from './stores/sessionStore'
import { useSettingsStore } from './stores/settingsStore'
import type { QuickPick, Session } from './types'

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/history', label: 'History', icon: TimerReset },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const timerOptions = [5, 10, 15, 25]

function App() {
  useHydrateApp()

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AppShell />}>
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/premium" element={<PremiumPage />} />
      </Route>
      <Route path="/timer/:sessionId" element={<TimerPage />} />
      <Route path="/complete/:sessionId" element={<CompletePage />} />
    </Routes>
  )
}

function useHydrateApp() {
  const loadSessions = useSessionStore((state) => state.loadSessions)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const loadQuickPicks = useQuickPickStore((state) => state.loadQuickPicks)

  useEffect(() => {
    void loadSessions()
    void loadSettings()
    void loadQuickPicks()
  }, [loadQuickPicks, loadSessions, loadSettings])
}

function AppShell() {
  return (
    <div className="min-h-dvh bg-j10-bg text-j10-text">
      <main className="mx-auto min-h-dvh max-w-[430px] px-5 pb-[calc(env(safe-area-inset-bottom)+132px)] pt-[calc(env(safe-area-inset-top)+54px)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [taskTitle, setTaskTitle] = useState('')
  const [validation, setValidation] = useState('')
  const createSession = useSessionStore((state) => state.createSession)
  const settings = useSettingsStore((state) => state.settings)
  const quickPicks = useQuickPickStore((state) => state.quickPicks)

  async function startSession(title: string, category?: string) {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setValidation('Name one small thing to start.')
      return
    }

    const minutes = settings?.timerLengthMinutes ?? 10
    const session = await createSession({
      taskTitle: trimmedTitle,
      category,
      intendedDurationSeconds: minutes * 60,
    })

    navigate(`/timer/${session.id}`)
  }

  return (
    <main className="min-h-dvh bg-j10-bg bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.74),transparent_22rem)] text-j10-text">
      <div className="mx-auto flex min-h-dvh max-w-[390px] flex-col px-8 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+44px)]">
        <header className="grid grid-cols-3 items-center">
          <div />
          <h1 className="m-0 text-center text-xl font-extrabold leading-none">Just 10</h1>
          <button
            className="icon-button justify-self-end"
            type="button"
            aria-label="Open settings"
            onClick={() => navigate('/settings')}
          >
            <Settings size={21} strokeWidth={2.4} />
          </button>
        </header>

        <section className="pt-8 text-center">
          <SunCloud />
          <h2 className="mx-auto mt-7 max-w-[292px] text-[30px] font-extrabold leading-[1.08]">
            What do you want to start?
          </h2>
        </section>

        <section className="mt-5 space-y-4">
          <label className="relative block">
            <span className="sr-only">Task to start</span>
            <Pencil
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A7ADBA]"
              size={21}
              strokeWidth={2.6}
            />
            <input
              className="h-12 w-full rounded-[15px] border border-[#CFD5DF] bg-white/95 pl-12 pr-4 text-sm font-medium text-j10-text shadow-[0_7px_14px_rgba(16,32,68,0.08)] outline-none transition placeholder:text-[#9EA6B6] focus:border-j10-accent focus:ring-4 focus:ring-j10-accent-soft"
              placeholder='"Clean desk" or "Reply to email"'
              value={taskTitle}
              onChange={(event) => {
                setTaskTitle(event.target.value)
                setValidation('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void startSession(taskTitle)
                }
              }}
            />
          </label>

          {validation ? <p className="px-1 text-sm font-semibold text-j10-accent-dark">{validation}</p> : null}

          <button
            className="flex h-[52px] w-full items-center justify-center gap-5 rounded-[16px] bg-j10-accent px-5 text-base font-bold text-white shadow-[0_10px_20px_rgba(255,122,102,0.28)] transition active:scale-[0.99]"
            type="button"
            onClick={() => void startSession(taskTitle)}
          >
            <span>Start {settings?.timerLengthMinutes ?? 10} minutes</span>
            <span className="grid size-8 place-items-center rounded-full bg-white text-j10-accent" aria-hidden="true">
              <Play size={19} fill="currentColor" />
            </span>
          </button>
        </section>

        <section className="mt-7">
          <h3 className="mb-4 text-base font-extrabold">Quick picks</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickPicks.slice(0, 4).map((pick) => {
              const Icon = getQuickPickIcon(pick.icon)
              return (
                <button
                  key={pick.id}
                  className={clsx(
                    'flex min-h-[46px] items-center gap-3 rounded-[14px] border border-black/5 px-4 text-left text-sm font-bold shadow-[0_5px_12px_rgba(16,32,68,0.08)]',
                    getQuickPickClass(pick.colour),
                  )}
                  type="button"
                  onClick={() => void startSession(pick.title, pick.category)}
                >
                  <Icon size={20} strokeWidth={2.4} />
                  <span>{pick.title}</span>
                </button>
              )
            })}
          </div>
        </section>

        <p className="mb-0 mt-auto flex items-center justify-center gap-2 pt-8 text-sm font-bold text-j10-muted">
          <Heart size={20} strokeWidth={2.1} />
          <span>You only need to begin.</span>
        </p>
      </div>
    </main>
  )
}

function TimerPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const sessions = useSessionStore((state) => state.sessions)
  const completeSession = useSessionStore((state) => state.completeSession)
  const session = sessions.find((item) => item.id === sessionId)
  const hasCompletedRef = useRef(false)

  const completeCurrentSession = useMemo(() => {
    return async (actualDurationSeconds: number, status: 'completed_10' | 'stopped_early') => {
      if (!session || hasCompletedRef.current) {
        return
      }

      hasCompletedRef.current = true
      await completeSession(session.id, status, actualDurationSeconds)
      navigate(`/complete/${session.id}`)
    }
  }, [completeSession, navigate, session])

  const timer = useCountdownTimer({
    durationSeconds: session?.intendedDurationSeconds ?? 600,
    initialStartedAtMs: session ? parseISO(session.startedAt).getTime() : undefined,
    onComplete: () => {
      if (session) {
        void completeCurrentSession(session.intendedDurationSeconds, 'completed_10')
      }
    },
  })

  if (!session) {
    return <MissingSession />
  }

  const minutes = Math.floor(timer.remainingSeconds / 60)
  const seconds = timer.remainingSeconds % 60
  const durationLabel = formatDuration(session.intendedDurationSeconds)

  return (
    <main className="min-h-dvh bg-j10-bg text-j10-text">
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col px-8 pb-[calc(env(safe-area-inset-bottom)+36px)] pt-[calc(env(safe-area-inset-top)+54px)] text-center">
        <header className="grid grid-cols-3 items-center pt-2">
          <button className="icon-button justify-self-start" type="button" aria-label="Back" onClick={() => navigate('/')}>
            <ArrowLeft size={22} />
          </button>
          <div className="justify-self-center rounded-full bg-j10-blue-soft p-3 text-j10-blue">
            {renderTaskIcon(session.category)}
          </div>
          <div />
        </header>

        <h1 className="mt-6 text-2xl font-extrabold">{session.taskTitle}</h1>

        <section className="mt-9 flex justify-center">
          <ProgressRing progress={timer.progress} size={240} strokeWidth={9}>
            <div>
              <p className="text-[52px] font-extrabold tracking-tight">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </p>
              <span className="mx-auto mt-2 inline-flex items-center gap-1 rounded-full bg-j10-blue-soft px-3 py-1 text-sm font-bold text-j10-muted">
                <Clock size={15} />
                {durationLabel}
              </span>
            </div>
          </ProgressRing>
        </section>

        <p className="mt-9 text-sm font-semibold text-j10-muted">Just start. No pressure to finish.</p>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-10">
          <button
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-j10-blue-soft text-sm font-extrabold text-j10-blue"
            type="button"
            onClick={timer.isPaused ? timer.resume : timer.pause}
          >
            {timer.isPaused ? <Play size={18} fill="currentColor" /> : <TimerReset size={18} />}
            {timer.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-j10-accent-soft text-sm font-extrabold text-j10-accent-dark"
            type="button"
            onClick={() => void completeCurrentSession(Math.max(1, timer.elapsedSeconds), 'stopped_early')}
          >
            <Square size={15} fill="currentColor" />
            Stop early
          </button>
        </div>
      </div>
    </main>
  )
}

function CompletePage() {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const sessions = useSessionStore((state) => state.sessions)
  const createSession = useSessionStore((state) => state.createSession)
  const updateSession = useSessionStore((state) => state.updateSession)
  const settings = useSettingsStore((state) => state.settings)
  const session = sessions.find((item) => item.id === sessionId)

  if (!session) {
    return <MissingSession />
  }

  const currentSession = session
  const isStoppedEarly = currentSession.status === 'stopped_early'
  const actualLabel = currentSession.actualDurationSeconds < 60 ? 'Less than a minute done' : `${Math.round(currentSession.actualDurationSeconds / 60)} minutes done`

  async function doAnotherTen() {
    const nextSession = await createSession({
      taskTitle: currentSession.taskTitle,
      category: currentSession.category,
      intendedDurationSeconds: (settings?.timerLengthMinutes ?? 10) * 60,
    })
    navigate(`/timer/${nextSession.id}`)
  }

  async function markAsDone() {
    await updateSession(currentSession.id, { status: 'marked_done' })
    navigate('/history')
  }

  return (
    <main className="min-h-dvh bg-j10-bg text-j10-text">
      <div className="mx-auto flex min-h-dvh max-w-[390px] flex-col justify-center px-8 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+28px)] text-center">
        <div className="relative mx-auto mb-9 grid size-28 place-items-center rounded-full bg-j10-accent text-white shadow-[0_14px_30px_rgba(255,122,102,0.28)]">
          <Check size={68} strokeWidth={3} />
          <Sparkles className="absolute -left-8 top-3 text-j10-accent" size={18} />
          <Sparkles className="absolute -right-7 bottom-5 text-j10-blue" size={16} />
        </div>

        <h1 className="text-[26px] font-extrabold leading-tight">
          {isStoppedEarly ? 'You started. That counts.' : 'Nice. You started.'}
        </h1>
        <p className="mt-3 text-base font-bold text-j10-muted">
          {isStoppedEarly ? actualLabel : formatDuration(currentSession.intendedDurationSeconds) + ' done'}
        </p>
        {isStoppedEarly ? <p className="mt-2 text-sm font-semibold text-j10-muted">Stopping here is okay.</p> : null}

        <div className="mt-8 space-y-4">
          <button
            className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[16px] bg-j10-accent text-base font-extrabold text-white shadow-[0_10px_20px_rgba(255,122,102,0.25)]"
            type="button"
            onClick={() => navigate('/')}
          >
            <Trophy size={19} />
            Stop here
          </button>
          <button
            className="flex h-12 w-full items-center justify-center gap-3 rounded-[16px] bg-j10-blue-soft text-sm font-extrabold text-j10-blue"
            type="button"
            onClick={() => void doAnotherTen()}
          >
            <RotateCcw size={18} />
            Do another {settings?.timerLengthMinutes ?? 10}
          </button>
          <button className="h-11 px-4 text-sm font-extrabold text-j10-blue" type="button" onClick={() => void markAsDone()}>
            Mark as done
          </button>
        </div>
      </div>
    </main>
  )
}

function HistoryPage() {
  const navigate = useNavigate()
  const sessions = useSessionStore((state) => state.sessions)
  const recentSessions = getRecentSessions(sessions, 8)
  const startsThisWeek = getStartsThisWeek(sessions)
  const currentStreak = getCurrentStreakDays(sessions)
  const totalMinutes = getTotalMinutesStarted(sessions)
  const startsByWeekday = getStartsByWeekday(sessions)
  const maxBar = Math.max(1, ...startsByWeekday.map((day) => day.count))

  return (
    <section>
      <PageTitle title="Your starts" subtitle="Every start counts." />

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Sparkles size={20} />} value={startsThisWeek} label="starts this week" tone="coral" />
        <StatCard icon={<Star size={20} />} value={currentStreak} label="day streak" tone="yellow" />
        <StatCard icon={<Clock size={20} />} value={totalMinutes} label="minutes started" tone="blue" />
      </div>

      {recentSessions.length === 0 ? (
        <EmptyState onStart={() => navigate('/')} />
      ) : (
        <>
          <section className="mt-6 rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex h-24 items-end justify-between gap-2">
              {startsByWeekday.map((day, index) => (
                <div key={`${day.day}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full max-w-5 rounded-t-md bg-j10-blue/70"
                    style={{ height: day.count === 0 ? 0 : `${Math.max(14, (day.count / maxBar) * 72)}px` }}
                    aria-label={`${day.count} starts`}
                  />
                  <span className="text-[11px] font-bold text-j10-muted">{day.day}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 text-base font-extrabold">Recent</h2>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <SessionListItem key={session.id} session={session} />
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  )
}

function StatsPage() {
  const sessions = useSessionStore((state) => state.sessions)
  const hasStarts = sessions.some((session) => session.actualDurationSeconds > 0)
  const stats = [
    { label: 'Starts this week', value: getStartsThisWeek(sessions) },
    { label: 'Starts this month', value: getStartsThisMonth(sessions) },
    { label: 'Total minutes started', value: getTotalMinutesStarted(sessions) },
    { label: 'Current streak', value: `${getCurrentStreakDays(sessions)} days` },
    { label: 'Longest streak', value: `${getLongestStreakDays(sessions)} days` },
    { label: 'Most-started task', value: getMostStartedTask(sessions) },
  ]

  return (
    <section>
      <PageTitle title="Stats" subtitle="Gentle proof that you began." />
      {!hasStarts ? (
        <section className="mb-4 rounded-[22px] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-j10-blue-soft text-j10-blue">
            <BarChart3 size={22} />
          </div>
          <h2 className="text-base font-extrabold">Your starts will show up here.</h2>
          <p className="mx-auto mt-2 max-w-[260px] text-sm font-semibold leading-6 text-j10-muted">
            Start one small thing and these numbers will begin to grow.
          </p>
        </section>
      ) : null}
      <div className="space-y-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="flex min-h-16 items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <span className="text-sm font-bold text-j10-muted">{stat.label}</span>
            <strong className="text-right text-base font-extrabold text-j10-text">{stat.value}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}

function SettingsPage() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const setSettings = useSettingsStore((state) => state.setSettings)
  const clearSessions = useSessionStore((state) => state.clearSessions)
  const [exportMessage, setExportMessage] = useState('')

  async function exportJson() {
    const json = await exportData()
    await navigator.clipboard.writeText(json)
    setExportMessage('Export copied to clipboard.')
  }

  async function resetData() {
    const confirmed = window.confirm('Reset all local Just 10 data? This cannot be undone.')
    if (!confirmed) {
      return
    }

    await resetAllData()
    const nextSettings = await getSettings()
    await saveSettings(nextSettings)
    setSettings(nextSettings)
    clearSessions()
    setExportMessage('Local data reset.')
  }

  return (
    <section>
      <PageTitle title="Settings" subtitle="Keep the app low-pressure." />

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <Clock className="text-j10-muted" size={20} />
            <div>
              <h2 className="text-sm font-extrabold">Timer length</h2>
              <p className="text-xs font-semibold text-j10-muted">Choose a default start length.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {timerOptions.map((minutes) => (
              <button
                key={minutes}
                className={clsx(
                  'h-10 rounded-xl text-sm font-extrabold',
                  settings?.timerLengthMinutes === minutes
                    ? 'bg-j10-accent text-white'
                    : 'bg-j10-surface-muted text-j10-muted',
                )}
                type="button"
                onClick={() => void updateSettings({ timerLengthMinutes: minutes })}
              >
                {minutes}
              </button>
            ))}
          </div>
        </div>

        <SettingsRow icon={<Clock size={20} />} label="Reminders" value={settings?.remindersEnabled ? 'On' : 'Off'} />
        <SettingsRow icon={<Music size={20} />} label="Focus sounds" value={settings?.focusSound ?? 'off'} />
        <SettingsRow icon={<Sparkles size={20} />} label="Theme" value={settings?.theme ?? 'system'} />
      </section>

      <section className="mt-5 rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-j10-accent-soft">
        <NavLink
          to="/premium"
          className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl bg-j10-accent-soft/55 p-3"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-j10-accent shadow-sm">
            <Trophy size={22} />
          </span>
          <span>
            <span className="block text-base font-extrabold text-j10-text">Just 10 Premium</span>
            <span className="mt-0.5 block text-xs font-bold text-j10-muted">Themes, widgets, custom routines</span>
          </span>
          <span className="rounded-full bg-j10-accent px-4 py-2 text-xs font-extrabold text-white shadow-sm">
            Try
          </span>
        </NavLink>
      </section>

      <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <button className="settings-action" type="button" onClick={() => void exportJson()}>
          <Download size={19} />
          Export data
        </button>
        <button className="settings-action text-j10-accent-dark" type="button" onClick={() => void resetData()}>
          <Trash2 size={19} />
          Reset all data
        </button>
        {exportMessage ? <p className="mt-3 text-sm font-bold text-j10-muted">{exportMessage}</p> : null}
      </section>
    </section>
  )
}

function PremiumPage() {
  return (
    <section className="text-center">
      <PageTitle title="Premium" subtitle="Optional upgrades for later." />
      <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-j10-accent-soft">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-[#FFF4D8] text-j10-accent">
          <Trophy size={32} />
        </div>
        <h2 className="text-xl font-extrabold">Unlock more ways to stay consistent.</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-j10-muted">
          Payments are intentionally not implemented in this MVP. This screen is ready for future store integration.
        </p>
      </div>
    </section>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-white/95 pb-safe-bottom shadow-[0_-10px_22px_rgba(16,32,68,0.04)] backdrop-blur">
      <div className="mx-auto grid h-[72px] max-w-[430px] grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-1 text-xs font-bold',
                  isActive ? 'text-j10-accent' : 'text-j10-muted',
                )
              }
            >
              <Icon size={22} strokeWidth={2.4} />
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function SunCloud() {
  return (
    <div className="relative mx-auto h-[82px] w-[110px]" aria-hidden="true">
      <div className="sun-rays absolute left-[5px] top-[-4px] h-[82px] w-[82px]" />
      <div className="absolute left-[22px] top-3 grid size-11 place-items-center rounded-full bg-[#FFD27A] shadow-[0_7px_18px_rgba(255,180,100,0.26)]">
        <div className="relative size-6">
          <span className="absolute left-[3px] top-[5px] size-1 rounded-full bg-[#C77536]" />
          <span className="absolute right-[3px] top-[5px] size-1 rounded-full bg-[#C77536]" />
          <span className="absolute left-[5px] top-[13px] h-2 w-3.5 rounded-b-full border-b-2 border-[#C77536]" />
        </div>
      </div>
      <div className="absolute right-[9px] top-8 h-4 w-10 rounded-full bg-[#DCEAFF] before:absolute before:bottom-[7px] before:left-[7px] before:size-[18px] before:rounded-full before:bg-[#DCEAFF] after:absolute after:bottom-[7px] after:right-[7px] after:size-[13px] after:rounded-full after:bg-[#DCEAFF]" />
    </div>
  )
}

function ProgressRing({
  progress,
  size,
  strokeWidth,
  children,
}: {
  progress: number
  size: number
  strokeWidth: number
  children: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E6EDF7"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3F7CCB"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-5 grid grid-cols-[44px_1fr_44px] items-center">
      <div aria-hidden="true" />
      <div className="text-center">
        <h1 className="text-xl font-extrabold leading-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs font-bold text-j10-muted">{subtitle}</p> : null}
      </div>
      <div className="justify-self-end text-j10-muted">{action}</div>
    </header>
  )
}

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode
  value: number
  label: string
  tone: 'coral' | 'yellow' | 'blue'
}) {
  const toneClass = {
    coral: 'text-j10-accent',
    yellow: 'text-[#F2B84B]',
    blue: 'text-j10-blue',
  }[tone]

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className={toneClass}>{icon}</div>
      <strong className="mt-2 block text-2xl font-extrabold">{value}</strong>
      <span className="block text-[11px] font-bold leading-tight text-j10-muted">{label}</span>
    </article>
  )
}

function SessionListItem({ session }: { session: Session }) {
  return (
    <article className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <div className="grid size-10 place-items-center rounded-xl bg-j10-surface-muted text-j10-blue">
        {renderTaskIcon(session.category)}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-extrabold">{session.taskTitle}</h3>
        <p className="text-xs font-semibold text-j10-muted">
          {formatDistanceToNow(parseISO(session.startedAt), { addSuffix: true })}, {format(parseISO(session.startedAt), 'h:mm a')}
        </p>
      </div>
      <div className="text-sm font-extrabold text-j10-muted">{formatDuration(session.actualDurationSeconds)}</div>
      <ChevronRight className="text-j10-muted" size={18} />
    </article>
  )
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <section className="mt-6 rounded-[22px] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-extrabold">No starts yet</h2>
      <p className="mx-auto mt-2 max-w-[280px] text-sm font-semibold leading-6 text-j10-muted">
        Pick one small thing and give it 10 minutes. That is enough.
      </p>
      <button className="mt-5 h-12 rounded-2xl bg-j10-accent px-6 text-sm font-extrabold text-white" type="button" onClick={onStart}>
        Start now
      </button>
    </section>
  )
}

function SettingsRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-t border-black/5 px-4">
      <div className="text-j10-muted">{icon}</div>
      <span className="flex-1 text-sm font-extrabold">{label}</span>
      <span className="text-sm font-bold capitalize text-j10-muted">{value}</span>
      <ChevronRight className="text-j10-muted" size={18} />
    </div>
  )
}

function MissingSession() {
  return (
    <main className="min-h-dvh bg-j10-bg px-6 py-12 text-center text-j10-text">
      <h1 className="text-xl font-extrabold">Session not found</h1>
      <NavLink className="mt-4 inline-flex h-11 items-center rounded-xl bg-j10-accent px-5 font-extrabold text-white" to="/">
        Start again
      </NavLink>
    </main>
  )
}

function getQuickPickIcon(icon: QuickPick['icon']) {
  const icons = {
    home: Home,
    book: BookOpen,
    mail: Mail,
    dumbbell: Dumbbell,
    gamepad: Gamepad2,
    shirt: Shirt,
    sparkle: Sparkles,
    'file-text': FileText,
  }

  return icons[icon as keyof typeof icons] ?? Sparkles
}

function getQuickPickClass(colour?: string) {
  const classes = {
    green: 'bg-[#E8F7EF] text-[#2F7D66]',
    blue: 'bg-[#EAF2FF] text-[#2F63A8]',
    purple: 'bg-[#F1ECFF] text-[#7561A7]',
    coral: 'bg-[#FFE8DD] text-[#C66D4C]',
    warning: 'bg-[#FFF4D8] text-[#B77B2D]',
  }

  return classes[colour as keyof typeof classes] ?? classes.blue
}

function renderTaskIcon(category?: string) {
  if (category === 'study') return <BookOpen size={20} />
  if (category === 'admin') return <Mail size={20} />
  if (category === 'exercise') return <Dumbbell size={20} />
  if (category === 'creative') return <Gamepad2 size={20} />
  if (category === 'home' || category === 'clean') return <Home size={20} />
  return <Sparkles size={20} />
}

function formatDuration(seconds: number) {
  const roundedSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(roundedSeconds / 60)
  const remainingSeconds = roundedSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default App
