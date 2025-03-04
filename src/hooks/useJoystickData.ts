
import { useState, useRef, useEffect, useCallback } from "react";
import { saveJoystickPosition, getJoystickPositions } from "../utils/supabaseUtils";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useJoystickData() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [history, setHistory] = useState<[number, number][]>([]);
  const historyRef = useRef<[number, number][]>([]);
  const lastUploadTimeRef = useRef<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial history from Supabase
  useEffect(() => {
    const fetchInitialHistory = async () => {
      try {
        const positions = await getJoystickPositions();
        const formattedHistory = positions.map(pos => [pos.x, pos.y] as [number, number]);
        historyRef.current = formattedHistory;
        setHistory(formattedHistory);
        setIsConnected(true);
        toast({
          title: "Connected to Supabase",
          description: `Loaded ${formattedHistory.length} positions from database`,
        });
      } catch (error) {
        console.error("Error fetching initial history:", error);
        toast({
          title: "Connection Error",
          description: "Could not connect to database",
          variant: "destructive",
        });
      }
    };

    fetchInitialHistory();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    console.log("Setting up realtime subscription...");
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'joystick_positions',
        },
        (payload) => {
          console.log("Received realtime update:", payload);
          if (payload.new) {
            const newPos = payload.new as { x: number, y: number };
            // For updated records, we need to refresh the entire list
            getJoystickPositions().then(positions => {
              const formattedHistory = positions.map(pos => [pos.x, pos.y] as [number, number]);
              historyRef.current = formattedHistory;
              setHistory(formattedHistory);
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("Successfully subscribed to realtime updates");
        }
      });

    return () => {
      console.log("Cleaning up channel subscription");
      supabase.removeChannel(channel);
    };
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
        saveJoystickPosition(x, y)
          .then(() => {
            if (!isConnected) {
              setIsConnected(true);
            }
          })
          .catch((error) => {
            console.error("Error saving position:", error);
          });
      }
    }, 50);

    return () => clearInterval(uploadInterval);
  }, [x, y, isConnected]);
  
  return {
    x,
    y,
    history,
    isConnected,
    handleJoystickChange
  };
}
