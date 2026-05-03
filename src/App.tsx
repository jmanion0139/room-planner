import { useRef, useState, useEffect } from 'react'
import Konva from 'konva'
import { Toolbar } from './components/Toolbar/Toolbar'
import { RoomCanvas } from './components/Canvas/RoomCanvas'
import { PieceLibrary } from './components/Sidebar/PieceLibrary'
import { CustomPieceForm } from './components/Sidebar/CustomPieceForm'
import { RoomSettings } from './components/Sidebar/RoomSettings'
import { PropertiesPanel } from './components/Properties/PropertiesPanel'
import { usePersistence } from './hooks/usePersistence'

type SidebarTab = 'pieces' | 'room'

function App() {
  usePersistence()

  const stageRef = useRef<Konva.Stage | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pieces')

  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ width, height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <Toolbar stageRef={stageRef} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-200">
            {(['pieces', 'room'] as SidebarTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 text-xs font-semibold py-2.5 capitalize tracking-wide transition-colors ${
                  sidebarTab === tab
                    ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'pieces' ? 'Pieces' : 'Room'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {sidebarTab === 'pieces' ? (
              <>
                <PieceLibrary />
                <div className="border-t border-gray-200 pt-4">
                  <CustomPieceForm />
                </div>
              </>
            ) : (
              <RoomSettings />
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main
          ref={canvasContainerRef}
          className="flex-1 overflow-hidden relative canvas-area"
        >
          <RoomCanvas
            containerWidth={canvasSize.width}
            containerHeight={canvasSize.height}
            stageRef={stageRef}
          />
        </main>

        {/* Right Properties Panel */}
        <aside className="w-56 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="px-3 py-2.5 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Properties</h2>
          </div>
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  )
}

export default App
