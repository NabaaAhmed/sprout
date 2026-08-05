import { useState } from 'react'
import { GameProvider, useGame } from './context/GameContext'
import { useAmbientSound } from './hooks/useAmbientSound'
import { useUiClickSound } from './hooks/useUiClickSound'
import { TopBar } from './components/TopBar'
import { NavTabs } from './components/NavTabs'
import { HomeScreen } from './components/HomeScreen'
import { FocusTimer } from './components/FocusTimer'
import { SessionComplete } from './components/SessionComplete'
import { Shop } from './components/Shop'
import { Journal } from './components/Journal'
import { Quiz } from './components/Quiz'
import { PetStats } from './components/PetStats'
import { SettingsModal } from './components/SettingsModal'
import { SoundPrompt } from './components/SoundPrompt'

function AppShell() {
  const { state } = useGame()
  const [tab, setTab] = useState('home')
  const [inSession, setInSession] = useState(false)
  const [completedResult, setCompletedResult] = useState(null)
  const [completedMeta, setCompletedMeta] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const { unlocked, enableNow } = useAmbientSound(state.settings.soundOn)
  useUiClickSound()

  const handleSessionComplete = (result, meta) => {
    setCompletedResult(result)
    setCompletedMeta(meta)
    setInSession(false)
  }

  const dismissCelebration = () => {
    setCompletedResult(null)
    setCompletedMeta(null)
    setTab('home')
  }

  if (inSession) {
    return <FocusTimer onComplete={handleSessionComplete} onExit={() => setInSession(false)} />
  }

  return (
    <div className="min-h-screen">
      <TopBar onOpenSettings={() => setShowSettings(true)} />

      {tab === 'home' && <HomeScreen onStartSession={() => setInSession(true)} />}
      {tab === 'shop' && <Shop />}
      {tab === 'quiz' && <Quiz />}
      {tab === 'journal' && <Journal />}
      {tab === 'stats' && <PetStats />}

      <NavTabs active={tab} onChange={setTab} />

      {!unlocked && state.settings.soundOn && <SoundPrompt onEnable={enableNow} />}

      {completedResult && (
        <SessionComplete result={completedResult} meta={completedMeta} onDone={dismissCelebration} />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  )
}
