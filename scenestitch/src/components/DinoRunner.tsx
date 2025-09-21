'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface DinoRunnerProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function DinoRunner({ containerRef }: DinoRunnerProps) {
  const [dinoPosition, setDinoPosition] = useState({ x: 100, y: 100 });
  const [mousePosition, setMousePosition] = useState({ x: 200, y: 200 });
  const [isRunning, setIsRunning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [dotOffset, setDotOffset] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);
  const lastMoveTime = useRef<number>(0);

  // Dino running animation frames using the actual dino image
  const dinoFrames = [
    <Image key="frame1" src="/images/dino.png" alt="Dino" width={40} height={40} className="dino-frame" />,
    <Image key="frame2" src="/images/dino.png" alt="Dino" width={40} height={40} className="dino-frame" />,
    <Image key="frame3" src="/images/dino.png" alt="Dino" width={40} height={40} className="dino-frame" />,
    <Image key="frame4" src="/images/dino.png" alt="Dino" width={40} height={40} className="dino-frame" />
  ];

  const [currentFrame, setCurrentFrame] = useState(0);

  // Animate dino running
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % dinoFrames.length);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isRunning, dinoFrames.length]);

  // Track actual mouse position and update dot offset
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Only update if mouse is within the container
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          setMousePosition({ x, y });
          
          // Calculate dot offset based on mouse position (parallax effect)
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const offsetX = ((x - centerX) / centerX) * 10; // Max 10px offset
          const offsetY = ((y - centerY) / centerY) * 10; // Max 10px offset
          
          setDotOffset({ x: offsetX, y: offsetY });
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [containerRef]);

  // Dino chase logic - follows actual mouse
  useEffect(() => {
    const chaseMouse = () => {
      const now = Date.now();
      if (now - lastMoveTime.current < 50) return; // Throttle movement
      lastMoveTime.current = now;

      setDinoPosition(prev => {
        const dx = mousePosition.x - prev.x;
        const dy = mousePosition.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 60) { // Stop when close to mouse
          setIsRunning(false);
          return prev;
        }

        setIsRunning(true);
        setDirection(dx > 0 ? 'right' : 'left');

        const moveSpeed = 3; // Slightly faster for better following
        const newX = prev.x + (dx / distance) * moveSpeed;
        const newY = prev.y + (dy / distance) * moveSpeed;

        // Keep dino within bounds
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          return {
            x: Math.max(0, Math.min(newX, rect.width - 40)),
            y: Math.max(0, Math.min(newY, rect.height - 40))
          };
        }

        return { x: newX, y: newY };
      });
    };

    const interval = setInterval(chaseMouse, 16); // ~60fps
    return () => clearInterval(interval);
  }, [mousePosition, containerRef]);

  return (
    <>
      {/* Animated Dots Background */}
      <div
        className="absolute inset-0 z-0 dots-pattern-animated"
        style={{
          backgroundPosition: `${dotOffset.x}px ${dotOffset.y}px, ${dotOffset.x + 10}px ${dotOffset.y + 10}px`,
        }}
      />
      
      {/* Dino Runner - follows actual mouse */}
      <div
        className="absolute z-20 transition-all duration-100 ease-out"
        style={{
          left: dinoPosition.x,
          top: dinoPosition.y,
          transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        }}
      >
        {dinoFrames[currentFrame]}
      </div>
    </>
  );
}
