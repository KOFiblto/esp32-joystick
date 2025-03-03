
import React, { useState, useCallback, useRef, useEffect } from "react";
import Joystick from "./Joystick";
import { motion } from "framer-motion";
import { saveJoystickPosition, getJoystickPositions } from "../utils/supabaseUtils";
import { toast } from "@/components/ui/use-toast";

const JoystickApp: React.FC = () => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [history, setHistory] = useState<[number, number][]>([]);
  const historyRef = useRef<[number, number][]>([]);
  const lastUploadTimeRef = useRef<number>(0);

  // Fetch initial history from Supabase
  useEffect(() => {
    const fetchInitialHistory = async () => {
      try {
        const positions = await getJoystickPositions();
        const formattedHistory = positions.map(pos => [pos.x, pos.y] as [number, number]);
        historyRef.current = formattedHistory;
        setHistory(formattedHistory);
        toast({
          title: "Connected to Supabase",
          description: `Loaded ${formattedHistory.length} positions from database`,
        });
      } catch (error) {
        console.error("Error fetching initial history:", error);
      }
    };

    fetchInitialHistory();
  }, []);

  // Update joystick values
  const handleJoystickChange = useCallback((newX: number, newY: number) => {
    setX(newX);
    setY(newY);
    
    // Update history (keep last 100 values)
    const newHistory = [...historyRef.current, [newX, newY] as [number, number]];
    if (newHistory.length > 100) {
      newHistory.shift();
    }
    historyRef.current = newHistory;
    setHistory(newHistory);
  }, []);

  // Set up interval to continuously read and upload joystick position
  useEffect(() => {
    const interval = setInterval(() => {
      // Only upload if we haven't uploaded in the last 50ms (to avoid flooding the database)
      const now = Date.now();
      if (now - lastUploadTimeRef.current >= 50) {
        lastUploadTimeRef.current = now;
        saveJoystickPosition(x, y);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [x, y]);

  // Functions to format coordinates for display
  const formatCoord = (value: number) => {
    return value.toString().padStart(5, ' ').replace(/ /g, '\u00A0');
  };

  // Display a subset of history items to avoid performance issues
  const displayHistory = history.slice(-10).reverse();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md mb-8 text-center"
      >
        <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary rounded-full">
          Control Interface
        </span>
        <h1 className="text-3xl font-medium tracking-tight mb-2">Precision Joystick</h1>
        <p className="text-muted-foreground text-sm">
          Move the knob to adjust coordinates (-1000 to 1000)
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          Data is saved to Supabase every 50ms
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative flex justify-center mb-12 w-full max-w-md"
      >
        <div className="w-full flex justify-center items-center">
          <Joystick onChange={handleJoystickChange} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-md p-6 rounded-xl bg-card/80 backdrop-blur-lg border border-border/50 shadow-lg text-center"
      >
        <div className="flex justify-center gap-8 mb-4">
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground mb-1">X-Axis</div>
            <div className="font-mono font-medium text-2xl tracking-tight text-foreground">
              {formatCoord(x)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Y-Axis</div>
            <div className="font-mono font-medium text-2xl tracking-tight text-foreground">
              {formatCoord(y)}
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-medium uppercase text-muted-foreground mb-2">Recent History</div>
            <div className="flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto p-2">
              {displayHistory.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex gap-1 p-1.5 rounded-md bg-muted/50 text-xs font-mono"
                  style={{
                    opacity: 0.3 + (0.7 * index / displayHistory.length)
                  }}
                >
                  [{item[0]}, {item[1]}]
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default JoystickApp;
