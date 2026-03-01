import dynamic from 'next/dynamic'

const GameScene = dynamic(() => import('./GameScene'), { ssr: false })

export default function GamePage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <GameScene />
    </div>
  )
}
