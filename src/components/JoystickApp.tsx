
import React from "react";
import { motion } from "framer-motion";
import Joystick from "./Joystick";
import JoystickHeader from "./joystick/JoystickHeader";
import CoordinateDisplay from "./joystick/CoordinateDisplay";
import { useJoystickData } from "../hooks/useJoystickData";

const JoystickApp: React.FC = () => {
  const { x, y, history, isConnected, handleJoystickChange } = useJoystickData();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background">
      <JoystickHeader isConnected={isConnected} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative flex justify-center mb-12 w-full max-w-md"
      >
        <Joystick onChange={handleJoystickChange} />
      </motion.div>

      <CoordinateDisplay x={x} y={y} history={history} />
    </div>
  );
};

export default JoystickApp;
