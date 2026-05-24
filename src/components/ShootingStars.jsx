"use client"
import { useRef, useEffect } from "react"

export default function ShootingStars() {
    const canvasRef = useRef(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        let W = (canvas.width = window.innerWidth)
        let H = (canvas.height = window.innerHeight)
        const resize = () => {
            W = canvas.width = window.innerWidth
            H = canvas.height = window.innerHeight
        }
        window.addEventListener("resize", resize)

        const stars = Array.from({ length: 220 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            a: Math.random() * 0.9 + 0.1,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.03 + 0.01,
            rot: Math.random() * Math.PI * 2,
        }))

        const meteorColors = [
            "hsl(0,100%,65%)",
            "hsl(350,100%,60%)",
            "hsl(48,100%,65%)",
            "hsl(42,100%,60%)",
            "hsl(195,100%,65%)",
            "hsl(215,100%,70%)",
        ]

        const meteors = []
        function spawnMeteor() {
            const color = meteorColors[Math.floor(Math.random() * meteorColors.length)]
            meteors.push({
                x: Math.random() * W * 1.5 - W * 0.25,
                y: -20,
                vx: (Math.random() * 4 + 3) * (Math.random() > 0.5 ? 1 : -1),
                vy: Math.random() * 5 + 4,
                len: Math.random() * 180 + 100,
                alpha: 1,
                color,
                width: Math.random() * 2 + 1,
                glowSize: Math.random() * 6 + 4,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
            })
        }

        function drawSparkle(cx, cy, outer, inner, rot) {
            ctx.beginPath()
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4 + rot
                const r = i % 2 === 0 ? outer : inner
                const x = cx + Math.cos(angle) * r
                const y = cy + Math.sin(angle) * r
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            }
            ctx.closePath()
        }

        let frame = 0
        let raf
        function draw() {
            ctx.clearRect(0, 0, W, H)
            ctx.fillStyle = "#000000"
            ctx.fillRect(0, 0, W, H)

            stars.forEach((s) => {
                s.twinkle += s.speed
                const a = s.a * (0.5 + 0.5 * Math.sin(s.twinkle))
                drawSparkle(s.x, s.y, s.r * 1.6, s.r * 0.4, s.rot)
                ctx.fillStyle = `rgba(255,255,255,${a})`
                ctx.fill()
            })

            if (frame % 35 === 0 && meteors.length < 12) spawnMeteor()

            for (let i = meteors.length - 1; i >= 0; i--) {
                const m = meteors[i]
                const angle = Math.atan2(m.vy, m.vx)
                const tailX = m.x - Math.cos(angle) * m.len
                const tailY = m.y - Math.sin(angle) * m.len

                const gr = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
                gr.addColorStop(0, "transparent")
                gr.addColorStop(
                    0.4,
                    m.color.replace("hsl(", "hsla(").replace(")", `,${m.alpha * 0.15})`),
                )
                gr.addColorStop(
                    0.8,
                    m.color.replace("hsl(", "hsla(").replace(")", `,${m.alpha * 0.6})`),
                )
                gr.addColorStop(1, m.color.replace("hsl(", "hsla(").replace(")", `,${m.alpha})`))

                ctx.beginPath()
                ctx.moveTo(tailX, tailY)
                ctx.lineTo(m.x, m.y)
                ctx.strokeStyle = gr
                ctx.lineWidth = m.width
                ctx.stroke()

                const glowGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.glowSize * 3)
                glowGrad.addColorStop(
                    0,
                    m.color.replace("hsl(", "hsla(").replace(")", `,${m.alpha * 0.8})`),
                )
                glowGrad.addColorStop(
                    0.4,
                    m.color.replace("hsl(", "hsla(").replace(")", `,${m.alpha * 0.3})`),
                )
                glowGrad.addColorStop(1, "transparent")
                ctx.beginPath()
                ctx.arc(m.x, m.y, m.glowSize * 3, 0, Math.PI * 2)
                ctx.fillStyle = glowGrad
                ctx.fill()

                m.rot += m.rotSpeed
                drawSparkle(m.x, m.y, m.width * 4.5, m.width * 1.2, m.rot)
                ctx.fillStyle = `rgba(255,255,255,${m.alpha})`
                ctx.fill()

                m.x += m.vx
                m.y += m.vy
                m.alpha -= 0.006
                if (m.alpha <= 0 || m.x < -200 || m.x > W + 200 || m.y > H + 200)
                    meteors.splice(i, 1)
            }
            frame++
            raf = requestAnimationFrame(draw)
        }
        draw()
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("resize", resize)
        }
    }, [])
    
    return (
        <canvas
            ref={canvasRef}
            style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
        />
    )
}
