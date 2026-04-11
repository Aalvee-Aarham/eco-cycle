import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function PageWrapper({ children, className = '' }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mx-auto max-w-7xl px-4 py-8 ${className}`}
      >
        {children}
      </motion.main>
    </div>
  );
}
