import { useRef, useState, useEffect } from 'react'
import Konva from 'konva'
import { Toolbar } from './components/Toolbar/Toolbar'
import { RoomCanvas } from './components/Canvas/RoomCanvas'
import { PieceLibrary } from './components/Sidebar/PieceLibrary'
import { CustomPieceForm } from './components/Sidebar/CustomPieceForm'
import { RoomSettings } from './components/Sidebar/RoomSettings'
import { PropertiesPanel } from './components/Properties/PropertiesPanel'
import { usePersistence } from './hooks/usePersistence'
import { useLayoutStore } from './store/layoutStore'

type SidebarTab = 'pieces' | 'room'
type MobileTab = 'pieces' | 'room' | 'properties'

const MIN_ZOOM = 0.35
const MAX_ZOOM = 10

function App() {
  usePersistence()

  const stageRef = useRef<Konva.Stage | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const initialFitDone = useRef(false)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pieces')
  const [mobileTab, setMobileTab] = useState<MobileTab>('pieces')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const {
    room,
    scale,
    viewportZoom,
    stageOffset,
    setViewportZoom,
    setStageOffset,
  } = useLayoutStore()

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

  const adjustZoomAtCanvasCenter = (nextZoom: number) => {
    const stage = stageRef.current
    if (!stage) return

    const oldZoom = viewportZoom
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
    if (clampedZoom === oldZoom) return

    const center = {
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
    }

    const worldPoint = {
      x: (center.x - stageOffset.x) / oldZoom,
      y: (center.y - stageOffset.y) / oldZoom,
    }

    const newOffset = {
      x: center.x - worldPoint.x * clampedZoom,
      y: center.y - worldPoint.y * clampedZoom,
    }

    setViewportZoom(clampedZoom)
    setStageOffset(newOffset)
  }

  const handleMobileZoomIn = () => {
    adjustZoomAtCanvasCenter(viewportZoom * 1.15)
  }

  const handleMobileZoomOut = () => {
    adjustZoomAtCanvasCenter(viewportZoom / 1.15)
  }

  const handleMobileResetView = () => {
    setViewportZoom(1)
    setStageOffset({ x: 40, y: 40 })
  }

  const handleFitToScreen = () => {
    const roomPxW = room.width * scale
    const roomPxH = room.height * scale
    if (roomPxW <= 0 || roomPxH <= 0 || canvasSize.width <= 0 || canvasSize.height <= 0) return

    const margin = 24
    const availableW = Math.max(1, canvasSize.width - margin * 2)
    const availableH = Math.max(1, canvasSize.height - margin * 2)

    const fitZoom = Math.min(availableW / roomPxW, availableH / roomPxH)
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fitZoom))

    const roomScreenW = roomPxW * clampedZoom
    const roomScreenH = roomPxH * clampedZoom

    const newOffset = {
      x: (canvasSize.width - roomScreenW) / 2,
      y: (canvasSize.height - roomScreenH) / 2,
    }

    setViewportZoom(clampedZoom)
    setStageOffset(newOffset)
  }

  // Fit room to screen once on first real canvas measurement
  useEffect(() => {
    if (initialFitDone.current) return
    if (canvasSize.width <= 0 || canvasSize.height <= 0) return
    initialFitDone.current = true
    handleFitToScreen()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height])

  return (
    <div className="flex flex-col h-screen min-h-[100dvh] bg-gray-100 overflow-hidden">
      <Toolbar stageRef={stageRef} onFitToScreen={handleFitToScreen} />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex w-72 flex-shrink-0 bg-white border-r border-gray-200 flex-col overflow-hidden">
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
          className={`flex-1 overflow-hidden relative canvas-area ${mobilePanelOpen ? 'pb-[50vh] lg:pb-0' : 'lg:pb-0'}`}
        >
          <RoomCanvas
            containerWidth={canvasSize.width}
            containerHeight={canvasSize.height}
            stageRef={stageRef}
          />

          <div className="lg:hidden absolute right-3 top-3 z-30 flex flex-col gap-2">
            <button
              onClick={handleMobileZoomIn}
              className="w-10 h-10 rounded-full bg-gray-900/90 text-white text-lg font-bold shadow-lg"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={handleMobileZoomOut}
              className="w-10 h-10 rounded-full bg-gray-900/90 text-white text-lg font-bold shadow-lg"
              title="Zoom out"
            >
              -
            </button>
            <button
              onClick={handleMobileResetView}
              className="px-2 h-9 rounded-full bg-white/95 text-xs font-semibold text-gray-700 shadow-lg border border-gray-200"
              title="Reset view"
            >
              Reset
            </button>
            <button
              onClick={handleFitToScreen}
              className="px-2 h-9 rounded-full bg-white/95 text-xs font-semibold text-gray-700 shadow-lg border border-gray-200"
              title="Fit room to screen"
            >
              Fit
            </button>
            <button
              onClick={() => setMobilePanelOpen((v) => !v)}
              className="px-2 h-9 rounded-full bg-blue-600 text-xs font-semibold text-white shadow-lg"
              title="Toggle controls"
            >
              {mobilePanelOpen ? 'Hide' : 'Controls'}
            </button>
          </div>


        </main>

        {/* Right Properties Panel */}
        <aside className="hidden lg:block w-56 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="px-3 py-2.5 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Properties</h2>
          </div>
          <PropertiesPanel />
        </aside>

        {/* Mobile bottom sheet */}
        {mobilePanelOpen && (
          <aside className="lg:hidden absolute inset-x-0 bottom-0 z-20 bg-white/98 backdrop-blur border-t border-gray-200 shadow-2xl pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={() => setMobilePanelOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 border-b border-gray-200 active:bg-gray-50"
            >
              <span className="inline-block w-10 h-1 rounded-full bg-gray-300" />
              <span className="text-sm font-semibold text-gray-600">▾ Hide Controls</span>
            </button>

            <div className="flex border-b border-gray-200">
              {(['pieces', 'room', 'properties'] as MobileTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`flex-1 text-xs font-semibold py-2.5 capitalize tracking-wide transition-colors ${
                    mobileTab === tab
                      ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-[42vh] overflow-y-auto p-3 space-y-4">
              {mobileTab === 'pieces' && (
                <>
                  <PieceLibrary />
                  <div className="border-t border-gray-200 pt-4">
                    <CustomPieceForm />
                  </div>
                </>
              )}
              {mobileTab === 'room' && <RoomSettings />}
              {mobileTab === 'properties' && <PropertiesPanel />}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default App
