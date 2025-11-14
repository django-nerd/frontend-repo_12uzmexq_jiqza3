import { useEffect, useRef } from 'react'

// Helper: wait for a set of elements by id to exist in the DOM
function useLayerDetector(layerIds, onDetected) {
  const detectedRef = useRef(false)

  useEffect(() => {
    if (!layerIds || layerIds.length === 0) return

    const haveAll = () => layerIds.every((id) => document.getElementById(id))

    const tryDetect = () => {
      if (detectedRef.current) return
      if (haveAll()) {
        detectedRef.current = true
        onDetected(
          layerIds.reduce((acc, id) => {
            acc[id] = document.getElementById(id)
            return acc
          }, {})
        )
      }
    }

    // Initial check in case layers already present
    tryDetect()

    // Observe DOM mutations to detect when layers are pasted/added
    const observer = new MutationObserver(() => {
      tryDetect()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [layerIds, onDetected])
}

// Easing: easeOutBack approximated cubic-bezier
const easeOutBack = 'cubic-bezier(0.175, 0.885, 0.320, 1.275)'

function App() {
  // Prepare and wait for the user to paste the design layers
  useLayerDetector(
    [
      'CatsLeft',
      'CatsRight',
      'HeadingWow',
      'Subtext',
      'Cake',
      'Flame1',
      'Flame2',
      'Flame3',
      'Flame4',
      'Flame5',
      'BlowButton',
    ],
    (els) => {
      // Set initial state as soon as layers exist
      const {
        CatsLeft,
        CatsRight,
        HeadingWow,
        Subtext,
        Cake,
        Flame1,
        Flame2,
        Flame3,
        Flame4,
        Flame5,
        BlowButton,
      } = els

      // Utility functions
      const hide = (el) => {
        if (!el) return
        el.style.opacity = '0'
        el.style.transform = el.style.transform || 'translate(0,0) scale(1)'
        el.style.pointerEvents = 'none'
        el.style.visibility = 'hidden'
      }
      const show = (el) => {
        if (!el) return
        el.style.pointerEvents = ''
        el.style.visibility = 'visible'
      }

      // Initial: hide Subtext, Cake, Flames, BlowButton
      ;[Subtext, Cake, Flame1, Flame2, Flame3, Flame4, Flame5, BlowButton].forEach(
        (el) => hide(el)
      )

      // Initial positions
      if (CatsLeft) {
        CatsLeft.style.transform = 'translateY(40px)'
        CatsLeft.style.opacity = '0'
      }
      if (CatsRight) {
        CatsRight.style.transform = 'translateY(40px)'
        CatsRight.style.opacity = '0'
      }
      if (HeadingWow) {
        HeadingWow.style.transform = 'translateY(-80px) scale(0.85)'
        HeadingWow.style.opacity = '0'
      }

      // Build timeline using Web Animations API
      const animations = []

      // A) Cats pop up (easeOutBack, 0.5s), right cat delayed 0.15s
      if (CatsLeft) {
        show(CatsLeft)
        animations.push(
          CatsLeft.animate(
            [
              { transform: 'translateY(40px)', opacity: 0 },
              { transform: 'translateY(0px)', opacity: 1 },
            ],
            { duration: 500, easing: easeOutBack, fill: 'forwards' }
          )
        )
      }
      if (CatsRight) {
        show(CatsRight)
        animations.push(
          CatsRight.animate(
            [
              { transform: 'translateY(40px)', opacity: 0 },
              { transform: 'translateY(0px)', opacity: 1 },
            ],
            { duration: 500, easing: easeOutBack, fill: 'forwards', delay: 150 }
          )
        )
      }

      // B) HeadingWow drops in from top (easeOutBack, 0.45s, scale back to 1.0)
      let t = Promise.all(animations.map((a) => a.finished))
        .catch(() => {})
        .then(() => {
          if (HeadingWow) {
            show(HeadingWow)
            return HeadingWow.animate(
              [
                { transform: 'translateY(-80px) scale(0.85)', opacity: 0 },
                { transform: 'translateY(0px) scale(1)', opacity: 1 },
              ],
              { duration: 450, easing: easeOutBack, fill: 'forwards' }
            ).finished.catch(() => {})
          }
        })
        // C) Subtext fades in and moves up (0.4s)
        .then(() => {
          if (Subtext) {
            show(Subtext)
            return Subtext.animate(
              [
                { transform: 'translateY(12px)', opacity: 0 },
                { transform: 'translateY(0px)', opacity: 1 },
              ],
              { duration: 400, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'forwards' }
            ).finished.catch(() => {})
          }
        })
        // D) Cake fades and scales in (0.5s, easeOutBack)
        .then(() => {
          if (Cake) {
            show(Cake)
            return Cake.animate(
              [
                { transform: 'scale(0.9)', opacity: 0 },
                { transform: 'scale(1)', opacity: 1 },
              ],
              { duration: 500, easing: easeOutBack, fill: 'forwards' }
            ).finished.catch(() => {})
          }
        })
        // E) After 0.2s, show Flame1–Flame5
        .then(() =>
          new Promise((res) => setTimeout(res, 200)).then(() => {
            ;[Flame1, Flame2, Flame3, Flame4, Flame5].forEach((f) => {
              if (f) {
                show(f)
                f.style.opacity = '1'
                f.style.transform = 'none'
              }
            })
          })
        )
        // F) After everything settles, fade and scale in BlowButton (0.35s)
        .then(() => {
          if (BlowButton) {
            show(BlowButton)
            return BlowButton.animate(
              [
                { transform: 'scale(0.92)', opacity: 0 },
                { transform: 'scale(1)', opacity: 1 },
              ],
              { duration: 350, easing: easeOutBack, fill: 'forwards' }
            ).finished.catch(() => {})
          }
        })

      // Interaction: Hold SPACE for 3 seconds
      let spaceTimer = null
      let spaceActive = false

      const hideFlames = () => {
        ;[Flame1, Flame2, Flame3, Flame4, Flame5].forEach((f) => {
          if (!f) return
          f.style.opacity = '0'
          f.style.visibility = 'hidden'
        })
      }

      const onKeyDown = (e) => {
        if (e.code !== 'Space' || spaceActive) return
        spaceActive = true
        // Start 3s hold timer
        spaceTimer = window.setTimeout(() => {
          // Trigger action
          hideFlames()
          if (HeadingWow) {
            // Fade out
            HeadingWow.animate(
              [
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.95)' },
              ],
              { duration: 180, easing: 'ease-out', fill: 'forwards' }
            ).finished
              .catch(() => {})
              .then(() => {
                HeadingWow.textContent = 'Happy Birthday!'
                // Fade back in with small pop
                HeadingWow.animate(
                  [
                    { opacity: 0, transform: 'scale(0.96)' },
                    { opacity: 1, transform: 'scale(1.03)' },
                    { opacity: 1, transform: 'scale(1.0)' },
                  ],
                  { duration: 320, easing: easeOutBack, fill: 'forwards' }
                )
              })
          }
        }, 3000)
      }

      const onKeyUp = (e) => {
        if (e.code !== 'Space') return
        spaceActive = false
        if (spaceTimer) {
          clearTimeout(spaceTimer)
          spaceTimer = null
        }
      }

      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)

      // Clean up listeners when page changes or hot-reloads
      const cleanup = () => {
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
      }

      // Also cleanup when the timeline completes (t resolves)
      t.finally(() => {})

      // Return cleanup when React unmounts
      return cleanup
    }
  )

  // Minimal placeholder UI – we do not render anything specific.
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Paste your birthday design layers into the page to trigger the animation.
    </div>
  )
}

export default App
