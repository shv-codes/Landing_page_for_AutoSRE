import { Component, Suspense, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import type { Group, Mesh, MeshStandardMaterial, PointLight } from 'three'
import { phases } from '../content.ts'

function StaticInstrument() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <g className="instrument-spin">
        <ellipse cx="100" cy="100" rx="78" ry="78" fill="none" stroke="rgba(244,244,245,0.72)" strokeWidth="0.7" />
        <circle cx="178" cy="100" r="2.2" fill="#3ecf8e" />
      </g>
      <g className="instrument-spin-rev">
        <ellipse cx="100" cy="100" rx="54" ry="70" fill="none" stroke="rgba(244,244,245,0.35)" strokeWidth="0.6" transform="rotate(28 100 100)" />
      </g>
      <ellipse cx="100" cy="100" rx="30" ry="30" fill="none" stroke="rgba(62,207,142,0.8)" strokeWidth="0.7" />
      <circle cx="100" cy="100" r="3.2" fill="#3ecf8e" />
      <circle cx="100" cy="100" r="7" fill="none" stroke="rgba(244,244,245,0.4)" strokeWidth="0.6" />
    </svg>
  )
}

function Armillary({ onPhase }: { onPhase: (index: number) => void }) {
  const group = useRef<Group>(null)
  const traveler = useRef<Mesh>(null)
  const light = useRef<PointLight>(null)
  const mats = useRef<Array<MeshStandardMaterial | null>>([])
  const last = useRef(-1)
  const phaseRef = useRef(onPhase)
  phaseRef.current = onPhase
  const tilt = useRef({ x: 0.46, y: 0 })

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * 0.26
    const radius = 1.58
    const x = Math.cos(t) * radius
    const z = Math.sin(t) * radius
    traveler.current?.position.set(x, 0, z)
    light.current?.position.set(x, 0.12, z)

    const targetX = 0.46 + state.pointer.y * 0.08
    const targetY = state.pointer.x * 0.2
    const k = Math.min(1, delta * 2.4)
    tilt.current.x += (targetX - tilt.current.x) * k
    tilt.current.y += (targetY - tilt.current.y) * k
    if (group.current) {
      group.current.rotation.x = tilt.current.x
      group.current.rotation.y = tilt.current.y + state.clock.elapsedTime * 0.045
    }

    mats.current.forEach((material, index) => {
      if (!material) return
      const angle = (index / phases.length) * Math.PI * 2
      const deltaAngle = Math.atan2(Math.sin(t - angle), Math.cos(t - angle))
      const near = Math.abs(deltaAngle) < 0.42
      material.emissiveIntensity = near ? 1.8 : 0.04
    })

    const index = Math.floor((((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2)) * phases.length) % phases.length
    if (index !== last.current) {
      last.current = index
      phaseRef.current(index)
    }
  })

  const metal = { color: '#d5d5da', metalness: 1, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.25 } as const

  return (
    <group ref={group}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.58, 0.011, 16, 180]} />
        <meshPhysicalMaterial {...metal} />
      </mesh>
      <mesh rotation={[0.15, 0.2, 0]}>
        <torusGeometry args={[1.22, 0.008, 12, 140]} />
        <meshPhysicalMaterial color="#b7b7be" metalness={1} roughness={0.22} />
      </mesh>
      <mesh rotation={[1.05, 0.55, 0.2]}>
        <torusGeometry args={[0.78, 0.007, 12, 120]} />
        <meshPhysicalMaterial color="#8e8e96" metalness={1} roughness={0.28} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.006, 0.006, 3.15, 8]} />
        <meshStandardMaterial color="#cfcfd4" metalness={1} roughness={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.16, 48, 48]} />
        <meshPhysicalMaterial color="#121316" metalness={1} roughness={0.12} clearcoat={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.045, 24, 24]} />
        <meshStandardMaterial color="#e9fff4" emissive="#3ecf8e" emissiveIntensity={2.2} />
      </mesh>
      {phases.map((_, index) => {
        const angle = (index / phases.length) * Math.PI * 2
        return (
          <mesh key={phases[index]} position={[Math.cos(angle) * 1.58, 0, Math.sin(angle) * 1.58]}>
            <sphereGeometry args={[0.035, 20, 20]} />
            <meshStandardMaterial
              ref={(material) => {
                mats.current[index] = material
              }}
              color="#d7d7dc"
              emissive="#3ecf8e"
              emissiveIntensity={0.04}
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
        )
      })}
      <mesh ref={traveler}>
        <sphereGeometry args={[0.055, 24, 24]} />
        <meshStandardMaterial color="#f3fff8" emissive="#3ecf8e" emissiveIntensity={2.6} />
      </mesh>
      <pointLight ref={light} color="#3ecf8e" intensity={6} distance={2.6} decay={2} />
    </group>
  )
}

class WebGLBoundary extends Component<{ children: ReactNode }, { bad: boolean }> {
  state = { bad: false }
  static getDerivedStateFromError() {
    return { bad: true }
  }
  render() {
    if (this.state.bad) return <StaticInstrument />
    return this.props.children
  }
}

export function HeroVisual({ phase, onPhase }: { phase: number; onPhase: (index: number) => void }) {
  const reduced = useReducedMotion()
  return (
    <div className="relative h-[420px] sm:h-[480px] lg:h-[560px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(62,207,142,0.09),transparent_42%)]" />
      <div className="absolute inset-0" aria-hidden="true">
        {reduced ? (
          <StaticInstrument />
        ) : (
          <WebGLBoundary>
            <Suspense fallback={<StaticInstrument />}>
              <Canvas
                dpr={[1, 1.6]}
                camera={{ position: [0.15, 0.35, 5.15], fov: 30 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0)
                }}
              >
                <fog attach="fog" args={['#07080a', 6.2, 11]} />
                <ambientLight intensity={0.35} />
                <directionalLight position={[4, 5, 3]} intensity={2.5} color="#ffffff" />
                <directionalLight position={[-4, -2, -3]} intensity={0.7} color="#9aafc4" />
                <Armillary onPhase={onPhase} />
              </Canvas>
            </Suspense>
          </WebGLBoundary>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-2 flex items-center justify-between px-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Closed loop</p>
        <p className="font-mono text-[12px] text-ink">
          <span className="mr-2 inline-block size-1.5 rounded-full bg-good align-middle" />
          {phases[phase] ?? phases[0]}
        </p>
      </div>
    </div>
  )
}
