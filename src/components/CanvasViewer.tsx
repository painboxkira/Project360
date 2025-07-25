import React, { useEffect, useRef, useState } from 'react'

interface Hotspot {
  x: number
  y: number
  width: number
  height: number
  action: string
}

interface Scene {
  image: string
  hotspots: Hotspot[]
}

const CanvasViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scene, setScene] = useState<Scene | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    fetch('/scene.json')
      .then((res) => res.json())
      .then((data: Scene) => {
        setScene(data)
        const img = new Image()
        img.src = data.image
        img.onload = () => {
          setImage(img)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image || !scene) return

    canvas.width = image.width
    canvas.height = image.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)

    // Draw hotspot outlines
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
    scene.hotspots.forEach((h) => {
      ctx.strokeRect(h.x, h.y, h.width, h.height)
    })
  }, [image, scene])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !scene) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    for (const h of scene.hotspots) {
      if (
        x >= h.x &&
        x <= h.x + h.width &&
        y >= h.y &&
        y <= h.y + h.height
      ) {
        alert(h.action)
        return
      }
    }
  }

  return (
    <div>
      {!scene || !image ? (
        <p>Loading...</p>
      ) : (
        <canvas ref={canvasRef} onClick={handleClick} />
      )}
    </div>
  )
}

export default CanvasViewer
