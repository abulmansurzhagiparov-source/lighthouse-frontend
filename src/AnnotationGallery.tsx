import { useEffect, useState } from 'react'

type Frame = {
  index: number
  timecode_sec: number
  objects_count: number
}

type Props = {
  baseUrl: string
  apiKey: string
  jobId: string
}

export function AnnotationGallery({ baseUrl, apiKey, jobId }: Props) {
  const [frames, setFrames] = useState<Frame[]>([])
  const [images, setImages] = useState<Record<number, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const urls: string[] = []

    setFrames([])
    setImages({})
    setError('')

    async function load() {
      try {
        const base = baseUrl.replace(/\/+$/, '')
        const headers = { 'X-API-Key': apiKey }

        const res = await fetch(
          `${base}/api/v1/jobs/${jobId}/annotations`,
          { headers, signal: controller.signal }
        )

        if (!res.ok) throw new Error(`API ${res.status}`)

        const data = await res.json() as { frames: Frame[] }
        if (controller.signal.aborted) return
        setFrames(data.frames || [])

        for (const frame of data.frames || []) {
          const response = await fetch(
            `${base}/api/v1/jobs/${jobId}/annotations/${frame.index}`,
            { headers, signal: controller.signal }
          )

          if (!response.ok) continue

          const blob = await response.blob()
          if (controller.signal.aborted) return

          const url = URL.createObjectURL(blob)
          urls.push(url)
          setImages(prev => ({ ...prev, [frame.index]: url }))
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Ошибка загрузки')
        }
      }
    }

    void load()

    return () => {
      controller.abort()
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [baseUrl, apiKey, jobId])

  return (
    <section style={{ margin: '24px 0' }}>
      <h2>AI-разметка кадров</h2>
      <p>Предсказания модели. Не являются подтверждением нарушения.</p>

      {error && <p>{error}</p>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        {frames.map(frame => (
          <div key={frame.index} style={{
            background: 'white',
            padding: 12,
            borderRadius: 12
          }}>
            {images[frame.index] ? (
              <img
                src={images[frame.index]}
                alt={`AI frame ${frame.index}`}
                style={{ width: '100%', borderRadius: 8 }}
              />
            ) : <p>Загрузка кадра...</p>}

            <strong>{frame.timecode_sec.toFixed(1)} сек</strong>
            <p>Объектов: {frame.objects_count}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
