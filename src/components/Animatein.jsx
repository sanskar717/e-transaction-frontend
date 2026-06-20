"use client"
import { useEffect, useRef, useState } from "react"

const variants = {
    fadeUp: { hidden: "translateY(40px)", visible: "translateY(0px)" },
    fadeDown: { hidden: "translateY(-40px)", visible: "translateY(0px)" },
    fadeLeft: { hidden: "translateX(-50px)", visible: "translateX(0px)" },
    fadeRight: { hidden: "translateX(50px)", visible: "translateX(0px)" },
    fade: { hidden: "translateY(0px)", visible: "translateY(0px)" },
    zoom: { hidden: "scale(0.85)", visible: "scale(1)" },
    flip: { hidden: "rotateX(45deg)", visible: "rotateX(0deg)" },
}

export default function AnimateIn({
    children,
    variant = "fadeUp",
    delay = 0,
    duration = 0.6,
    once = true,
    threshold = 0.15,
    className = "",
    style = {},
}) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    if (once) observer.disconnect()
                } else if (!once) {
                    setVisible(false)
                }
            },
            { threshold },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [once, threshold])

    const v = variants[variant] || variants.fadeUp

    return (
        <div
            ref={ref}
            className={className}
            style={{
                transform: visible ? v.visible : v.hidden,
                opacity: visible ? 1 : 0,
                transition: `transform ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s, opacity ${duration}s ease ${delay}s`,
                willChange: "transform, opacity",
                ...style,
            }}
        >
            {children}
        </div>
    )
}
