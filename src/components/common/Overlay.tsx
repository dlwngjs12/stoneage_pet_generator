import { motion } from "framer-motion";

export function Overlay({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <div className="bg-black/85 text-white px-8 py-4 rounded-2xl shadow-2xl text-lg font-semibold">
        {message}
      </div>
    </motion.div>
  );
}
