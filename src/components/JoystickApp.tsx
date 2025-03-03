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

  // Set up interval to continuously read joystick position (every 10ms)
  useEffect(() => {
    const readInterval = setInterval(() => {
      // This keeps updating the history every 10ms regardless of joystick movement
      handleJoystickChange(x, y);
    }, 10);

    return () => clearInterval(readInterval);
  }, [x, y, handleJoystickChange]);

  // Set up separate interval to upload to Supabase (every 50ms)
  useEffect(() => {
    const uploadInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastUploadTimeRef.current >= 50) {
        lastUploadTimeRef.current = now;
        saveJoystickPosition(x, y);
      }
    }, 50);

    return () => clearInterval(uploadInterval);
  }, [x, y]);

  // Functions to format coordinates for display
  const formatCoord = (value: number) => {
    return value.toString().padStart(5, ' ').replace(/ /g, '\u00A0');
  };

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
        className="w-full max-w-md p-6 rounded-xl bg-card/80 backdrop-blur-lg border border-border/50 shadow-lg"
      >
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-xs font-medium uppercase text-muted-foreground mb-1">X-Axis</div>
            <div className="font-mono font-medium text-2xl tracking-tight text-foreground">
              {formatCoord(x)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Y-Axis</div>
            <div className="font-mono font-medium text-2xl tracking-tight text-foreground">
              {formatCoord(y)}
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase text-muted-foreground mb-2 text-center">History (Last 100 Positions)</div>
            <div className="max-h-48 overflow-y-auto p-2 bg-muted/30 rounded-lg">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-background/80 backdrop-blur-sm">
                  <tr>
                    <th className="p-1 text-left">#</th>
                    <th className="p-1 text-right">X</th>
                    <th className="p-1 text-right">Y</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().map((item, index) => (
                    <tr key={index} className="border-t border-border/20">
                      <td className="p-1 text-muted-foreground">{history.length - index}</td>
                      <td className="p-1 text-right">{item[0]}</td>
                      <td className="p-1 text-right">{item[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default JoystickApp;
