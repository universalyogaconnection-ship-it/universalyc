import { useState, useEffect, useRef, memo, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import './App.css'
import logo from './assets/logo.png'

// TSL-based Earth Component (exact implementation from original)
function Earth({ position, onAnimationComplete }: { position: [number, number, number], onAnimationComplete: () => void }) {
  const earthRef = useRef<THREE.Group>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'moving' | 'complete'>('initial')
  const animationStartTime = useRef<number>(0)
  
  // High-quality Earth textures (exact from original)
  const dayTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_day_4096.jpg')
  const nightTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_night_4096.jpg')
  const bumpRoughnessCloudsTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_bump_roughness_clouds_4096.jpg')

  // Configure textures exactly like original
  useEffect(() => {
    dayTexture.colorSpace = THREE.SRGBColorSpace
    dayTexture.anisotropy = 8
    nightTexture.colorSpace = THREE.SRGBColorSpace
    nightTexture.anisotropy = 8
    bumpRoughnessCloudsTexture.anisotropy = 8
  }, [dayTexture, nightTexture, bumpRoughnessCloudsTexture])

  // Sun light (exact from original)
  const sunLight = useRef<THREE.DirectionalLight>(null)

  useEffect(() => {
    if (animationPhase === 'initial') {
      setTimeout(() => {
        setAnimationPhase('moving')
        animationStartTime.current = performance.now()
      }, 1000)
    }
  }, [animationPhase])

  useFrame((_state, delta) => {
    if (animationPhase === 'moving') {
      const duration = 6000 // 6 seconds in milliseconds
      const elapsed = performance.now() - animationStartTime.current
      const progress = Math.min(elapsed / duration, 1)
      
      // Ultra-smooth easing function - ease-in-out cubic
      const easedProgress = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      
      if (progress < 1) {
        // Smoother interpolation with better easing
        camera.position.x = THREE.MathUtils.lerp(0, 0, easedProgress)
        camera.position.y = THREE.MathUtils.lerp(5, 1.5, easedProgress)
        camera.position.z = THREE.MathUtils.lerp(8, 2.5, easedProgress)
        
        // Direct lookAt for smoother camera movement
        camera.lookAt(0, 0, 0)
        
        // Force camera matrix update for smoother rendering
        camera.updateMatrixWorld()
      } else if (animationPhase === 'moving') {
        // Smooth transition to complete phase
        setAnimationPhase('complete')
        // Delay the callback slightly to ensure smooth transition
        setTimeout(() => {
          onAnimationComplete()
        }, 100)
      }
    }

    // Rotate Earth slowly - auto rotation only
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.025
    }
  })


  return (
    <>
      {/* Enhanced Lighting System */}
      <directionalLight 
        ref={sunLight}
        color="#ffffff" 
        intensity={3} 
        position={[0, 0, 3]} 
      />
      
      {/* Additional lights for brightness */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={1} color="#ffffff" />
      <pointLight position={[0, 0, 5]} intensity={1.5} color="#ffffff" />
      
      <group 
        ref={earthRef} 
        position={position}
      >
        {/* Main Earth Sphere - Smaller Scale */}
        <mesh>
          <sphereGeometry args={[0.5, 128, 128]} />
          <meshStandardMaterial
            map={dayTexture}
            normalMap={bumpRoughnessCloudsTexture}
            roughnessMap={bumpRoughnessCloudsTexture}
            metalness={0}
            roughness={0.2}
            envMapIntensity={1.0}
          />
        </mesh>

        {/* Atmosphere - Smaller Scale */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[0.52, 64, 64]} />
          <meshBasicMaterial 
            color={0x6db8ff}
            side={THREE.BackSide} 
            transparent
            opacity={0.25}
          />
        </mesh>
      </group>
    </>
  )
}

// Ultra-Realistic Star Field Component - Using THREE.Points for Performance
function StarField({ starCount }: { clickedStars: Array<{id: number, x: number, y: number}>, starCount: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const rotationRef = useRef<number>(0)
  
  // Progressive loading to prevent freezing
  const [visibleStarCount, setVisibleStarCount] = useState(0)
  const maxRenderPerFrame = 1000 // Load this many stars per frame
  
  useFrame((state) => {
    // Progressive loading
    if (visibleStarCount < starCount) {
      const newCount = Math.min(visibleStarCount + maxRenderPerFrame, starCount)
      setVisibleStarCount(newCount)
    }
    
    // Smooth rotation
    if (pointsRef.current) {
      const currentTime = state.clock.elapsedTime
      rotationRef.current = currentTime * 0.001
      pointsRef.current.rotation.y = rotationRef.current
    }
  })

  // Generate efficient star data using BufferGeometry approach
  const generateStarData = (count: number) => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Spherical distribution for realistic starfield
      const radius = 100 + Math.random() * 1500
      const phi = Math.acos(1 - 2 * Math.random())
      const theta = 2 * Math.PI * Math.random()
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      // Realistic star colors based on temperature
      const temperature = 2000 + Math.random() * 8000
      let r, g, b
      
      if (temperature > 8000) {
        // O-type stars - Blue-white
        r = 0.6 + Math.random() * 0.2; g = 0.7 + Math.random() * 0.2; b = 0.9 + Math.random() * 0.1
      } else if (temperature > 6000) {
        // B-type stars - Blue-white
        r = 0.7 + Math.random() * 0.2; g = 0.8 + Math.random() * 0.2; b = 0.95 + Math.random() * 0.05
      } else if (temperature > 5000) {
        // A-type stars - White
        r = 0.9 + Math.random() * 0.1; g = 0.9 + Math.random() * 0.1; b = 0.9 + Math.random() * 0.1
      } else if (temperature > 4000) {
        // F-type stars - Yellow-white
        r = 0.95 + Math.random() * 0.05; g = 0.9 + Math.random() * 0.1; b = 0.7 + Math.random() * 0.2
      } else if (temperature > 3000) {
        // G-type stars - Yellow (like our Sun)
        r = 1; g = 0.8 + Math.random() * 0.2; b = 0.5 + Math.random() * 0.3
      } else if (temperature > 2500) {
        // K-type stars - Orange
        r = 1; g = 0.6 + Math.random() * 0.3; b = 0.3 + Math.random() * 0.2
      } else {
        // M-type stars - Red
        r = 1; g = 0.3 + Math.random() * 0.3; b = 0.2 + Math.random() * 0.2
      }
      
      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
      
      // Varying sizes for realism
      const sizeRand = Math.random()
      if (sizeRand < 0.7) {
        sizes[i] = 0.5 // Tiny stars (most common)
      } else if (sizeRand < 0.9) {
        sizes[i] = 1.0 // Small stars
      } else if (sizeRand < 0.98) {
        sizes[i] = 2.0 // Medium stars
      } else {
        sizes[i] = 3.0 + Math.random() * 2 // Bright stars (rare)
      }
    }
    
    return { positions, colors, sizes }
  }

  const starData = useMemo(() => generateStarData(starCount), [starCount])

  // Create and manage BufferGeometry
  const geometry = useRef<THREE.BufferGeometry | null>(null)
  
  useEffect(() => {
    if (!geometry.current) {
      geometry.current = new THREE.BufferGeometry()
    }
    return () => {
      if (geometry.current) {
        geometry.current.dispose()
      }
    }
  }, [])

  // Update geometry when visible count changes
  useEffect(() => {
    if (geometry.current && visibleStarCount > 0) {
      const effectiveCount = Math.min(visibleStarCount, starCount)
      
      // Check if buffers need resizing
      const currentPositionLength = geometry.current.attributes.position?.count || 0
      if (currentPositionLength !== effectiveCount) {
        geometry.current.setAttribute('position', new THREE.BufferAttribute(starData.positions.slice(0, effectiveCount * 3), 3))
        geometry.current.setAttribute('color', new THREE.BufferAttribute(starData.colors.slice(0, effectiveCount * 3), 3))
        geometry.current.setAttribute('size', new THREE.BufferAttribute(starData.sizes.slice(0, effectiveCount), 1))
      } else {
        // Just update the existing buffers
        const posAttr = geometry.current.attributes.position as THREE.BufferAttribute
        const colorAttr = geometry.current.attributes.color as THREE.BufferAttribute
        const sizeAttr = geometry.current.attributes.size as THREE.BufferAttribute
        
        posAttr.array.set(starData.positions.slice(0, effectiveCount * 3))
        colorAttr.array.set(starData.colors.slice(0, effectiveCount * 3))
        sizeAttr.array.set(starData.sizes.slice(0, effectiveCount))
        
        posAttr.needsUpdate = true
        colorAttr.needsUpdate = true
        sizeAttr.needsUpdate = true
      }
    }
  }, [visibleStarCount, starCount, starData])

  // Reset visible count when starCount changes
  useEffect(() => {
    setVisibleStarCount(0)
  }, [starCount])

  if (visibleStarCount === 0 || !geometry.current) return null

  return (
    <points ref={pointsRef} geometry={geometry.current}>
      <pointsMaterial 
        size={0.02}
        vertexColors={true}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  )
}

// Main Scene Component - Memoized to prevent unnecessary re-renders
const Scene = memo(({ 
  clickedStars, 
  onAnimationComplete,
  totalClicks,
}: { 
  clickedStars: Array<{id: number, x: number, y: number}>,
  onAnimationComplete: () => void,
  showUI: boolean,
  hasClicked: boolean,
  totalClicks: number,
  isAnimating: boolean,
  onButtonClick: () => void
}) => {
  return (
    <>
      <StarField clickedStars={clickedStars} starCount={totalClicks} />
      
      <Earth position={[0, -0.8, 0]} onAnimationComplete={onAnimationComplete} />
      
    </>
  )
})

function App() {
  const [hasClicked, setHasClicked] = useState(false)
  const [totalClicks, setTotalClicks] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [clickedStars, setClickedStars] = useState<Array<{id: number, x: number, y: number}>>([])
  const [showUI, setShowUI] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [buttonClickAnimation, setButtonClickAnimation] = useState<'idle' | 'shrinking' | 'light-streak' | 'counting' | 'star-glow' | 'complete'>('idle')
  const [previousCount, setPreviousCount] = useState(0)
  const [newStarPosition, setNewStarPosition] = useState<{x: number, y: number} | null>(null)
  const counterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Simulate loading progress
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(loadingInterval)
          // Delay before hiding loading screen
          setTimeout(() => {
            setIsLoading(false)
          }, 500)
          return 100
        }
        return prev + Math.random() * 15 + 5 // Random increment between 5-20
      })
    }, 100)

    return () => clearInterval(loadingInterval)
  }, [])

  useEffect(() => {
    // Load from localStorage
    const clicked = localStorage.getItem('yoga-connection-clicked')
    const clicks = localStorage.getItem('yoga-connection-total')
    const stars = localStorage.getItem('yoga-connection-stars')
    
    if (clicked === 'true') {
      setHasClicked(true)
    }
    if (clicks) {
      setTotalClicks(parseInt(clicks))
    }
    if (stars) {
      setClickedStars(JSON.parse(stars))
    }
  }, [])

  const handleAnimationComplete = () => {
    setShowUI(true)
  }

  const handleClick = () => {
    if (hasClicked || buttonClickAnimation !== 'idle') return
    
    // Start button shrinking animation
    setButtonClickAnimation('shrinking')
    setPreviousCount(totalClicks)
    
    // Phase 1: Button shrinks
    setTimeout(() => {
      setButtonClickAnimation('light-streak')
      
      // Phase 2: Light streak travels to counter
      setTimeout(() => {
        setButtonClickAnimation('counting')
        
        // Phase 3: Update counter with animation
        const newTotal = totalClicks + 1
        setTotalClicks(newTotal)
        
        // Create new star at random position
        const newStar = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100
        }
        setHasClicked(true)
        setClickedStars(prev => [...prev, newStar])
        setNewStarPosition({ x: newStar.x, y: newStar.y })
        
        // Save to localStorage
        localStorage.setItem('yoga-connection-clicked', 'true')
        localStorage.setItem('yoga-connection-total', newTotal.toString())
        localStorage.setItem('yoga-connection-stars', JSON.stringify([...clickedStars, newStar]))
        
        // Phase 4: Star glow
        setTimeout(() => {
          setButtonClickAnimation('star-glow')
          
          // Phase 5: Complete - clear star position after glow
          setTimeout(() => {
            setButtonClickAnimation('complete')
            setTimeout(() => {
              setIsAnimating(false)
              setNewStarPosition(null)
            }, 500)
          }, 1500)
        }, 800)
      }, 1000)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-montserrat">
      {/* Loading Screen */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-3xl font-light text-white"
              style={{ marginBottom: '20px' }}
            >
              Loading
            </motion.h1>
            
            {/* Progress Bar Container */}
            <div className="w-80 md:w-96 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Three.js Canvas with WebGPU (exact settings from original) */}
      <Canvas
        camera={{ position: [0, 5, 8], fov: 25 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        <Scene 
          clickedStars={clickedStars} 
          onAnimationComplete={handleAnimationComplete}
          showUI={showUI}
          hasClicked={hasClicked}
          totalClicks={totalClicks}
          isAnimating={isAnimating}
          onButtonClick={handleClick}
        />
      </Canvas>

      {/* Logo - Centered Above First Line */}
      {showUI && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 z-20"
          style={{ top: 'calc(50% - 280px)' }}
        >
          <img 
            src={logo} 
            alt="Universal Yoga Connection Logo" 
            className="h-16 md:h-24 w-auto mx-auto"
          />
        </motion.div>
      )}

      {/* Creator's Message - Beautiful Overlay */}
      {showUI && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none -mt-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="space-y-6 text-gray-200 leading-relaxed"
            >
              <motion.p
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-xs md:text-sm font-light"
              >
                The Universal Symbol of Yoga and Connection exemplifies our intention to connect in yoga with each other and the world.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="text-xs md:text-sm font-light"
              >
                This site is an instrument for uniting yoga practitioners and like minded individuals from around the world.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="text-xs md:text-sm font-medium text-white"
              >
                The symbol stands for <span style={{ color: '#D9263B' }}>Yoga</span>, <span style={{ color: '#FF9222' }}>Peace</span>, <span style={{ color: '#F3CA17' }}>Love</span>, <span style={{ color: '#1DC179' }}>Compassion</span>, <span style={{ color: '#36D1D8' }}>Forgiveness</span>, <span style={{ color: '#1C3CD5' }}>Acceptance</span>, <span style={{ color: '#7912D6' }}>Equality</span> and all that is good.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                className="text-xs md:text-sm font-light"
              >
                The Universal symbol of yoga is a <span className="text-yellow-400 font-semibold">Y</span> made from 7 circles. This is the basic template, feel free to adapt this template (layout, colours, wide lines, thin lines) however you like.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                className="text-xs md:text-sm font-light"
              >
                Help display the symbol in the world. Make a poster, make a flag, put the symbol on a T shirt…do what ever you want to promote the symbol and make others aware of this web site and our cause.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.8 }}
                className="text-xs md:text-sm font-light"
              >
                When we make the sign of peace ✌️, we make a positive connection with others in the real world.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 2.0 }}
                className="text-xs md:text-sm font-medium text-white"
              >
                We aim to be a global source of <span style={{ color: '#FF9222' }}>Peace</span>, <span style={{ color: '#F3CA17' }}>Love</span> and <span className="text-green-300 font-semibold">Positivity</span>.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 2.2 }}
                className="text-sm md:text-base text-white font-medium mb-4"
              >
                Please connect by clicking on the button below and as our numbers increase, the energy of our community grows to make the world a better place.
              </motion.p>
              <div className="flex flex-col items-center justify-center space-y-4">
                <span className="text-yellow-400 font-semibold text-xs md:text-sm">Join Our Global Community</span>
                
                {/* Join Now Button - Vercel-style with Ethereal Glow */}
                {!hasClicked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 2.5, ease: "easeOut" }}
                    className="relative mt-8"
                    style={{
                      marginTop: '10px'
                    }}
                  >
                    {/* Pulsing Shadow-Like Glow Behind Button */}
                    <motion.div
                      animate={{
                        opacity: [0.5, 0.9, 0.5],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 -z-10"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                        filter: 'blur(25px)',
                        width: '180%',
                        height: '180%',
                        left: '-40%',
                        top: '-40%'
                      }}
                    />
                    
                    {/* Rotating Glow Orb */}
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute inset-0 -z-10"
                      style={{
                        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.2) 45%, transparent 70%)',
                        filter: 'blur(20px)',
                        width: '150%',
                        height: '150%',
                        left: '-25%',
                        top: '-25%'
                      }}
                    />
                    
                    {/* Additional Soft Glow Layer */}
                    <motion.div
                      animate={{
                        opacity: [0.15, 0.35, 0.15],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                      }}
                      className="absolute inset-0 -z-10"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 65%)',
                        filter: 'blur(35px)',
                        width: '220%',
                        height: '220%',
                        left: '-60%',
                        top: '-60%'
                      }}
                    />
                    
                    {/* Vercel-style Button with Better Styling */}
                    <motion.button
                      whileHover={{ 
                        scale: hasClicked ? 1 : 1.05,
                        y: hasClicked ? 0 : -2
                      }}
                      whileTap={{ scale: hasClicked ? 1 : 0.98 }}
                      onClick={handleClick}
                      animate={{
                        scale: (buttonClickAnimation !== 'idle') ? 0 : 1,
                        opacity: (buttonClickAnimation !== 'idle') ? 0 : 1
                      }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="pointer-events-auto relative px-8 py-4 bg-white text-black text-base font-semibold rounded-full shadow-2xl transition-all duration-300 hover:shadow-white/40"
                      style={{
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
                        letterSpacing: '0.025em',
                        padding: '10px 20px'
                      }}
                    >
                      <span className="relative z-10">Connect now</span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Light Streak Animation from Button to Counter */}
      {buttonClickAnimation === 'light-streak' && (
        <motion.div
          initial={{ x: 'calc(50% - 100px)', y: 'calc(100% - 80px)' }}
          animate={{ x: 'calc(100% - 180px)', y: '24px' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute z-40 pointer-events-none"
          style={{
            width: '200px',
            height: '4px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)',
            filter: 'blur(8px)',
            opacity: buttonClickAnimation === 'light-streak' ? 1 : 0
          }}
        />
      )}

      {/* Star Glow Effect - Highlights the new star */}
      {buttonClickAnimation === 'star-glow' && newStarPosition && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 3, 1.2, 1], opacity: [0, 1, 0.8, 0] }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute z-30"
          style={{
            left: `${newStarPosition.x}%`,
            top: `${newStarPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        >
          {/* Glowing Star Core - Bigger initial size */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{
              width: '40px',
              height: '40px',
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              filter: 'blur(6px)',
              borderRadius: '50%'
            }}
          />
          
          {/* Outer Glow - Bigger initial size */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="absolute inset-0"
            style={{
              width: '120px',
              height: '120px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              filter: 'blur(12px)',
              borderRadius: '50%',
              margin: '-60px'
            }}
          />
          
          {/* Pulse Rings - Bigger initial size */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0"
            style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(255,255,255,0.8)',
              borderRadius: '50%',
              margin: '-25px',
              filter: 'blur(3px)'
            }}
          />
        </motion.div>
      )}


      {/* Counter - Top Right with Animation */}
      <div className="absolute top-6 right-6 z-20">
        <div className="text-right">
          <div className="text-2xl md:text-3xl font-bitcount text-white mb-1 relative" ref={counterRef}>
            {/* Old number that moves up */}
            {previousCount > 0 && buttonClickAnimation === 'counting' && (
              <motion.div
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {previousCount.toLocaleString()}
              </motion.div>
            )}
            
            {/* Current number */}
            <motion.div
              key={`count-${totalClicks}`}
              initial={buttonClickAnimation === 'counting' ? { y: 40, opacity: 0 } : false}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {totalClicks.toLocaleString()}
            </motion.div>
          </div>
          <div className="text-xs text-gray-500 font-montserrat">
            {'Connected'}
          </div>
        </div>
      </div>

    </div>
  )
}

export default App