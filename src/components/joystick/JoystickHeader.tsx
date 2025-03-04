
import React from "react";
import { motion } from "framer-motion";

interface JoystickHeaderProps {
  isConnected: boolean;
}

const JoystickHeader: React.FC<JoystickHeaderProps> = ({ isConnected }) => {
  return (
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
        {isConnected ? (
          "Connected to Supabase with realtime sync"
        ) : (
          "Attempting to connect to database..."
        )}
      </p>
    </motion.div>
  );
};

export default JoystickHeader;
