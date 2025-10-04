import React from 'react';
import { motion } from 'framer-motion';
import { 
  BiArrowBack, BiShieldQuarter, BiKey, BiLock, BiServer, BiCheck,
  BiData, BiShield, BiTime, BiCode, BiMemoryCard, BiTimer
} from 'react-icons/bi';
import { secureLog } from '../utils/secureLogger';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Timeline Component
const SecurityTimeline = () => {
  const milestones = [
    {
      version: "1.0",
      date: "Launch",
      features: [
        "Client-side AES-256 encryption",
        "Master password authentication",
        "Google OAuth integration",
        "Firestore security rules"
      ]
    },
    {
      version: "1.3",
      date: "Q4 2024",
      features: [
        "Session-based security (60-minute timeout)",
        "Inactivity detection (15 minutes)",
        "Enhanced card number masking",
        "UPI masked ID generation"
      ]
    },
    {
      version: "1.4",
      date: "January 2025",
      features: [
        "SecurePlaintext typed arrays",
        "Automatic memory zeroing",
        "Secure cleanup on unmount",
        "Production logging hardening"
      ]
    },
    {
      version: "1.5",
      date: "October 2025",
      features: [
        "Split card number storage",
        "Time-limited decryption (30s/10s)",
        "Secure clipboard auto-clear",
        "Memory wipe after operations",
        "Runtime DevTools detection"
      ]
    }
  ];

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500"></div>
      
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-8"
      >
        {milestones.map((milestone, idx) => (
          <motion.div
            key={idx}
            variants={fadeInUp}
            className="relative pl-20"
          >
            {/* Timeline dot */}
            <div className="absolute left-6 top-3 w-5 h-5 bg-indigo-500 rounded-full border-4 border-gray-900 shadow-lg shadow-indigo-500/50"></div>
            
            {/* Content card */}
            <div className="bg-gray-800/50 border border-indigo-500/30 rounded-lg p-5 hover:border-indigo-400/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-indigo-300">Version {milestone.version}</h3>
                <span className="text-sm text-gray-400">{milestone.date}</span>
              </div>
              <ul className="space-y-2">
                {milestone.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start text-sm text-gray-300">
                    <BiCheck className="text-green-400 flex-shrink-0 mt-0.5 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Continuous improvement note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-indigo-300 font-semibold">We continuously improve security based on industry best practices</p>
      </motion.div>
    </div>
  );
};

// Security Architecture Visual
const SecurityArchitecture = () => {
  const layers = [
    {
      icon: BiData,
      title: "Data Layer",
      items: [
        "Split card number storage (first 12/11 + last 4)",
        "WebCrypto API (AES-256-GCM)",
        "PBKDF2 key derivation (100,000 iterations)"
      ],
      color: "emerald"
    },
    {
      icon: BiMemoryCard,
      title: "Memory Layer",
      items: [
        "SecurePlaintext typed arrays (Uint8Array)",
        "Automatic zeroing after use",
        "Cleanup on component unmount"
      ],
      color: "blue"
    },
    {
      icon: BiTimer,
      title: "Time Layer",
      items: [
        "CVV/Expiry auto-hide: 30 seconds",
        "Clipboard auto-clear: 10 seconds",
        "Session timeout: 60 minutes"
      ],
      color: "purple"
    },
    {
      icon: BiServer,
      title: "Transport Layer",
      items: [
        "Firestore security rules (uid verification)",
        "Content Security Policy headers",
        "Long polling for reliability"
      ],
      color: "orange"
    }
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {layers.map((layer, idx) => (
        <motion.div
          key={idx}
          variants={fadeInUp}
          className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-5 hover:border-gray-600/50 transition-all duration-300"
        >
          <div className="flex items-center mb-4">
            <layer.icon className="w-8 h-8 text-indigo-400 mr-3" />
            <h3 className="text-white font-semibold text-lg">{layer.title}</h3>
          </div>
          <ul className="space-y-2">
            {layer.items.map((item, iIdx) => (
              <li key={iIdx} className="flex items-start text-sm text-gray-400">
                <BiCheck className="text-emerald-400 flex-shrink-0 mt-0.5 mr-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Technical Implementation Details
const TechnicalSpecs = () => {
  const specs = [
    {
      category: "Encryption",
      details: [
        { label: "API", value: "WebCrypto (native)" },
        { label: "Algorithm", value: "AES-256-GCM" },
        { label: "Key Derivation", value: "PBKDF2" },
        { label: "Iterations", value: "100,000" },
        { label: "Salt", value: "User-specific (UID)" }
      ]
    },
    {
      category: "Storage",
      details: [
        { label: "Card Number First", value: "Encrypted (12/11 digits)" },
        { label: "Card Number Last4", value: "Encrypted (4 digits)" },
        { label: "CVV", value: "Encrypted" },
        { label: "Expiry", value: "Encrypted" }
      ]
    },
    {
      category: "Memory Management",
      details: [
        { label: "Plaintext Type", value: "Uint8Array" },
        { label: "Zeroing", value: "Immediate post-use" },
        { label: "Cleanup", value: "Component unmount" },
        { label: "GC Support", value: "Manual + Automatic" }
      ]
    },
    {
      category: "Session Security",
      details: [
        { label: "Max Session", value: "60 minutes" },
        { label: "Inactivity Timeout", value: "15 minutes" },
        { label: "CVV Display", value: "30 seconds max" },
        { label: "Clipboard Clear", value: "10 seconds" }
      ]
    }
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {specs.map((spec, idx) => (
        <motion.div
          key={idx}
          variants={fadeInUp}
          className="bg-black/30 border border-indigo-500/20 rounded-lg p-5"
        >
          <h3 className="text-indigo-300 font-semibold text-lg mb-4 flex items-center">
            <BiCode className="mr-2" />
            {spec.category}
          </h3>
          <div className="space-y-3">
            {spec.details.map((detail, dIdx) => (
              <div key={dIdx} className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{detail.label}:</span>
                <span className="text-white font-mono text-xs bg-gray-800/50 px-2 py-1 rounded">{detail.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Data Flow Diagram
const DataFlowDiagram = () => {
  return (
    <div className="bg-black/30 border border-indigo-500/20 rounded-lg p-6">
      <h3 className="text-white font-semibold text-lg mb-6 text-center">Data Encryption Flow</h3>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Step 1 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex-1 text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BiData className="w-8 h-8 text-emerald-400" />
          </div>
          <h4 className="text-emerald-300 font-medium mb-2">Input</h4>
          <p className="text-gray-400 text-sm">Card number entered</p>
        </motion.div>

        {/* Arrow */}
        <div className="hidden md:block text-indigo-400 text-2xl">→</div>
        <div className="md:hidden text-indigo-400 text-2xl rotate-90">→</div>

        {/* Step 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex-1 text-center"
        >
          <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/50 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BiKey className="w-8 h-8 text-blue-400" />
          </div>
          <h4 className="text-blue-300 font-medium mb-2">Split</h4>
          <p className="text-gray-400 text-sm">First 12 + Last 4</p>
        </motion.div>

        {/* Arrow */}
        <div className="hidden md:block text-indigo-400 text-2xl">→</div>
        <div className="md:hidden text-indigo-400 text-2xl rotate-90">→</div>

        {/* Step 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex-1 text-center"
        >
          <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/50 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BiLock className="w-8 h-8 text-purple-400" />
          </div>
          <h4 className="text-purple-300 font-medium mb-2">Encrypt</h4>
          <p className="text-gray-400 text-sm">AES-256-GCM</p>
        </motion.div>

        {/* Arrow */}
        <div className="hidden md:block text-indigo-400 text-2xl">→</div>
        <div className="md:hidden text-indigo-400 text-2xl rotate-90">→</div>

        {/* Step 4 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex-1 text-center"
        >
          <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/50 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BiServer className="w-8 h-8 text-orange-400" />
          </div>
          <h4 className="text-orange-300 font-medium mb-2">Store</h4>
          <p className="text-gray-400 text-sm">Firebase Firestore</p>
        </motion.div>
      </div>

      {/* Code snippet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-gray-900 rounded-lg p-4 text-xs font-mono overflow-x-auto"
      >
        <pre className="text-gray-300">
<span className="text-blue-400">const</span> <span className="text-yellow-400">encryptCardNumberSplit</span> = <span className="text-purple-400">async</span> (cardNumber, masterPassword) {`=>`} {`{`}
  <span className="text-gray-500">// Split card number</span>
  <span className="text-blue-400">const</span> first = cardNumber.<span className="text-yellow-400">slice</span>(<span className="text-green-400">0</span>, <span className="text-green-400">-4</span>);
  <span className="text-blue-400">const</span> last4 = cardNumber.<span className="text-yellow-400">slice</span>(<span className="text-green-400">-4</span>);
  
  <span className="text-gray-500">// Encrypt both parts separately</span>
  <span className="text-blue-400">const</span> encFirst = <span className="text-blue-400">await</span> <span className="text-yellow-400">encryptData</span>(first, masterPassword);
  <span className="text-blue-400">const</span> encLast4 = <span className="text-blue-400">await</span> <span className="text-yellow-400">encryptData</span>(last4, masterPassword);
  
  <span className="text-blue-400">return</span> {`{`} cardNumberFirst: encFirst, cardNumberLast4: encLast4 {`}`};
{`}`};
        </pre>
      </motion.div>
    </div>
  );
};

// Main Component
const SecurityInfo = ({ setActivePage }) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white p-4 md:p-8 font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.button
          onClick={() => {
            secureLog.debug("SecurityInfo: Back button clicked");
            setActivePage('viewCards');
          }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors duration-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BiArrowBack className="text-lg" />
          <span>Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Security Information
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Transparent disclosure of security measures implemented to protect your sensitive card data
          </p>
        </motion.div>

        {/* Security Architecture */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <BiShield className="mr-3 text-indigo-400" />
            Security Architecture
          </h2>
          <SecurityArchitecture />
        </motion.section>

        {/* Data Flow */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <BiData className="mr-3 text-indigo-400" />
            Encryption Process
          </h2>
          <DataFlowDiagram />
        </motion.section>

        {/* Technical Specifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <BiCode className="mr-3 text-indigo-400" />
            Technical Specifications
          </h2>
          <TechnicalSpecs />
        </motion.section>

        {/* Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
            <BiTime className="mr-3 text-indigo-400" />
            Security Enhancement Timeline
          </h2>
          <SecurityTimeline />
        </motion.section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-center"
        >
          <p className="text-gray-300 mb-4">
            All security implementations are open to audit. We follow industry best practices and continuously update our security measures.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <motion.button
              onClick={() => {
                secureLog.debug("SecurityInfo: Privacy Policy clicked");
                setActivePage('privacy');
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-sm transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Privacy Policy
            </motion.button>
            <motion.button
              onClick={() => {
                secureLog.debug("SecurityInfo: Terms of Service clicked");
                setActivePage('terms');
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-sm transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Terms of Service
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SecurityInfo;

