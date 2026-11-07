import { useRef, useState } from 'react'

const VIDEO_SRC = '/videos/Dumagat.mp4'

export default function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [failed, setFailed] = useState(false)

  function start() {
    const v = videoRef.current
    if (!v) return
    setStarted(true)
    v.play().catch(() => {
      /* the controls are visible now, so the guest can press play */
    })
  }

  return (
    <section id="highlights" className="bg-sand">
      <div className="mx-auto max-w-[1240px] px-[42px] py-[100px] max-[640px]:px-[22px] max-[640px]:py-[72px]">
        <div className="mb-[42px] flex items-end justify-between gap-10 max-[640px]:mb-[30px] max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-4">
          <div className="max-w-[590px]">
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sage">See the river for yourself</span>
            <h2 className="text-[clamp(32px,3.5vw,46px)] font-bold leading-[1.14] tracking-[-.035em] text-forest">
              Dumagat highlights
            </h2>
          </div>
          <p className="max-w-[390px] text-sm leading-[1.7] text-[#67766f]">
            A quick look at the water, the cottages, and the unhurried days waiting for you.
          </p>
        </div>

        {failed ? (
          <p className="border border-dashed border-[#c9d1cb] bg-white px-6 py-10 text-center text-sm text-[#67766f]">
            The highlights video could not be loaded right now. Please check back later.
          </p>
        ) : (
          <div className="relative aspect-video overflow-hidden rounded-[10px] bg-deep shadow-[0_25px_50px_rgba(21,58,46,.25)]">
            <video
              ref={videoRef}
              src={`${VIDEO_SRC}#t=0.1`}
              preload="metadata"
              playsInline
              controls={started}
              aria-label="Dumagat River Resort highlights video"
              onError={() => setFailed(true)}
              onEnded={() => {
                if (videoRef.current) videoRef.current.currentTime = 0
                setStarted(false)
              }}
              className="h-full w-full bg-deep object-contain"
            />

            {!started && (
              <button
                type="button"
                onClick={start}
                aria-label="Play the Dumagat highlights video"
                className="group absolute inset-0 flex flex-col items-center justify-center gap-3 border-0 bg-gradient-to-t from-deep/70 via-deep/15 to-deep/30"
              >
                <span className="grid h-[76px] w-[76px] place-items-center rounded-full bg-cream/95 text-forest shadow-[0_12px_30px_rgba(0,0,0,.3)] transition-transform duration-300 group-hover:scale-105 max-[640px]:h-16 max-[640px]:w-16">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
                  </svg>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[.18em] text-white">Watch highlights</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}