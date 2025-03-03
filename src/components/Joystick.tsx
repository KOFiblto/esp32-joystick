
import React, { useState, useRef, useEffect, useMemo } from "react";

interface JoystickProps {
  onChange: (x: number, y: number) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [normalizedPosition, setNormalizedPosition] = useState({ x: 0, y: 0 });

  // Calculate the center and radius of the joystick once the component mounts
  const dimensions = useMemo(() => {
    if (!containerRef.current) return { centerX: 0, centerY: 0, radius: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const radius = rect.width / 2;
    const centerX = radius;
    const centerY = radius;
    
    return { centerX, centerY, radius };
  }, [containerRef.current?.offsetWidth]);

  // Initialize joystick to center
  useEffect(() => {
    if (containerRef.current && dimensions.centerX && dimensions.centerY) {
      setPosition({ x: dimensions.centerX, y: dimensions.centerY });
    }
  }, [dimensions.centerX, dimensions.centerY]);

  // Handle mouse/touch events
  const handleStart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    moveKnob(clientX - rect.left, clientY - rect.top);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    moveKnob(clientX - rect.left, clientY - rect.top);
  };

  const handleEnd = () => {
    setIsDragging(false);
    // Reset to center when released
    setPosition({ x: dimensions.centerX, y: dimensions.centerY });
    setNormalizedPosition({ x: 0, y: 0 });
    onChange(0, 0);
  };

  // Calculate knob position and keep it within the joystick boundary
  const moveKnob = (x: number, y: number) => {
    const { centerX, centerY, radius } = dimensions;
    
    // Calculate distance from center
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If the knob is outside the container, constrain it
    let limitedX = x;
    let limitedY = y;
    
    if (distance > radius) {
      const angle = Math.atan2(deltaY, deltaX);
      limitedX = centerX + radius * Math.cos(angle);
      limitedY = centerY + radius * Math.sin(angle);
    }
    
    setPosition({ x: limitedX, y: limitedY });
    
    // Calculate normalized values (-1000 to 1000)
    const normalizedX = Math.round(((limitedX - centerX) / radius) * 1000);
    // Invert Y so that up is positive
    const normalizedY = Math.round(((centerY - limitedY) / radius) * 1000);
    
    setNormalizedPosition({ x: normalizedX, y: normalizedY });
    onChange(normalizedX, normalizedY);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Setup and cleanup event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="joystick-container relative w-full max-w-[320px] aspect-square rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden cursor-grab mx-auto"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Center marker */}
      <div className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 -translate-x-1/2 -translate-y-1/2 z-10"></div>
      
      {/* Crosshair guides */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-400/30 dark:bg-slate-600/30"></div>
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400/30 dark:bg-slate-600/30"></div>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700 opacity-50"></div>
      </div>
      <div
        ref={knobRef}
        className={`absolute w-24 h-24 rounded-full bg-primary shadow-lg ${isDragging ? 'scale-95' : ''}`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20"></div>
          <div className="absolute text-[10px] font-mono text-primary-foreground/70">
            {normalizedPosition.x},{normalizedPosition.y}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Joystick;
