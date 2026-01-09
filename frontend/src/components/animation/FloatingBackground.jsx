import { motion } from "framer-motion";
import { Leaf, Carrot, Apple, Grape } from "lucide-react"; // Assuming you have these or similar icons

const FloatingIcon = ({ Icon, delay, duration, x, y, size, color }) => (
  <motion.div
    initial={{ x: 0, y: 0, opacity: 0 }}
    animate={{ 
      x: [0, x, 0], 
      y: [0, y, 0],
      rotate: [0, 180, 360],
      opacity: [0.2, 0.5, 0.2] 
    }}
    transition={{ 
      duration: duration, 
      repeat: Infinity, 
      ease: "easeInOut",
      delay: delay 
    }}
    className={`absolute ${color} pointer-events-none blur-sm`}
    style={{ width: size, height: size }}
  >
    <Icon size="100%" />
  </motion.div>
);

export const FloatingBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <FloatingIcon Icon={Leaf} delay={0} duration={15} x={100} y={-100} size={64} color="text-green-500/20" />
      <FloatingIcon Icon={Carrot} delay={2} duration={18} x={-150} y={100} size={80} color="text-orange-500/20" />
      <FloatingIcon Icon={Apple} delay={5} duration={20} x={200} y={150} size={70} color="text-red-500/20" />
      <FloatingIcon Icon={Grape} delay={1} duration={12} x={-100} y={-150} size={50} color="text-purple-500/20" />
      
      {/* Ambient Gradient Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px]"
      />
    </div>
  );
};
