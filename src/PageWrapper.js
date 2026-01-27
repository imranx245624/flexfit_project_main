import { motion } from "framer-motion";
import "./pageWrapper.css"; // IMPORTANT

const PageWrapper = ({ children }) => (
  <motion.div
    className="page-wrapper"   // IMPORTANT
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 50 }}
    transition={{ duration: 0.4 }}
  >
    {children}
  </motion.div>
);

export default PageWrapper;
