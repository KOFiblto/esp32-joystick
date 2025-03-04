
import React from "react";
import { motion } from "framer-motion";

interface CoordinateDisplayProps {
  x: number;
  y: number;
  history: [number, number][];
}

const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ x, y, history }) => {
  // Function to format coordinates for display
  const formatCoord = (value: number) => {
    return value.toString().padStart(5, ' ').replace(/ /g, '\u00A0');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full max-w-md p-6 rounded-xl bg-card/80 backdrop-blur-lg border border-border/50 shadow-lg"
    >
      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-xs font-medium uppercase text-muted-foreground mb-1">X-Axis</div>
          <div className="font-mono font-medium text-2xl tracking-tight text-foreground text-center w-24">
            {formatCoord(x)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Y-Axis</div>
          <div className="font-mono font-medium text-2xl tracking-tight text-foreground text-center w-24">
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
  );
};

export default CoordinateDisplay;
