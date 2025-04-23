import React from 'react';
import { motion } from 'framer-motion';
import { 
  BiArrowBack, BiUserCheck, BiLockAlt, BiShieldQuarter, 
  BiCloud, BiMobileAlt, BiKey, BiMessageAltError, 
  BiLock, BiLockOpen, BiServer, BiMobile, BiCheck,
  BiError, BiData, BiShield, BiFingerprint, BiRightArrowAlt
} from 'react-icons/bi';
import { FaGoogle, FaDatabase, FaLock, FaUnlock, FaExclamationTriangle } from 'react-icons/fa';

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

const flowArrowVariants = {
  hidden: { opacity: 0, pathLength: 0 },
  visible: { opacity: 1, pathLength: 1, transition: { duration: 1, ease: "easeInOut" } }
};

const flowNodeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// Animation for the encryption process
const EncryptionAnimation = () => {
  return (
    <div className="relative py-10 flex flex-col md:flex-row justify-center items-center w-full my-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Unencrypted data with enhanced animation */}
          <motion.div 
            className="flex flex-col items-center justify-center mb-8 md:mb-0"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={flowNodeVariants}
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/30 border border-green-500/50 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(52, 211, 153, 0.3)" }}
              animate={{ 
                boxShadow: ["0 0 0px rgba(52, 211, 153, 0)", "0 0 15px rgba(52, 211, 153, 0.5)", "0 0 0px rgba(52, 211, 153, 0)"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <BiData className="w-12 h-12 text-green-400" />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent"
                initial={{ y: 100 }}
                animate={{ y: -100 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            <span className="text-sm text-green-300 font-medium">Your Card Data</span>
            <p className="text-xs text-green-200/70 mt-1 text-center max-w-[150px]">Confidential information like card numbers, CVV, etc.</p>
          </motion.div>

          {/* Encryption process arrow - animated */}
          <div className="hidden md:flex mx-4 w-32 items-center justify-center relative">
            <motion.div 
              className="h-1 w-full bg-gray-700"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-green-500 to-indigo-500"
                variants={flowArrowVariants}
              />
            </motion.div>
            <motion.div 
              className="absolute flex flex-col items-center"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BiKey className="w-7 h-7 text-yellow-400" />
              <span className="text-xs text-yellow-300 mt-1">Master Password</span>
            </motion.div>
          </div>

          {/* Mobile version - vertical arrow */}
          <div className="md:hidden w-full flex items-center justify-center my-4">
            <div className="w-1 h-16 bg-gray-700 relative">
              <motion.div 
                className="w-full bg-gradient-to-b from-green-500 to-indigo-500"
                variants={flowArrowVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              />
              <motion.div 
                className="absolute -left-3 top-1/2 -translate-y-1/2"
                animate={{ x: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BiKey className="w-7 h-7 text-yellow-400" />
              </motion.div>
            </div>
          </div>

          {/* Locked data with animation */}
          <motion.div 
            className="flex flex-col items-center justify-center mb-8 md:mb-0"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={flowNodeVariants}
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 border border-indigo-500/50 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
            >
              <BiLock className="w-12 h-12 text-indigo-400" />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-indigo-800/10"
                animate={{ 
                  background: [
                    "linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)",
                    "linear-gradient(45deg, rgba(79, 70, 229, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)",
                    "linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            <span className="text-sm text-indigo-300 font-medium">Encrypted Data</span>
            <p className="text-xs text-indigo-200/70 mt-1 text-center max-w-[150px]">Unreadable ciphertext that's impossible to decrypt without your key</p>
          </motion.div>

          {/* Storage arrow */}
          <div className="hidden md:flex mx-4 w-32 items-center justify-center">
            <motion.div 
              className="h-1 w-full bg-gray-700"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                variants={flowArrowVariants}
              />
            </motion.div>
            <motion.div 
              className="absolute"
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BiCloud className="w-7 h-7 text-purple-400" />
            </motion.div>
          </div>

          {/* Mobile version - vertical arrow */}
          <div className="md:hidden w-full flex items-center justify-center my-4">
            <div className="w-1 h-16 bg-gray-700 relative">
              <motion.div 
                className="w-full bg-gradient-to-b from-indigo-500 to-purple-600"
                variants={flowArrowVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              />
              <motion.div 
                className="absolute -left-3 top-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BiCloud className="w-7 h-7 text-purple-400" />
              </motion.div>
            </div>
          </div>

          {/* Database with animation */}
          <motion.div 
            className="flex flex-col items-center justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={flowNodeVariants}
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-purple-800/20 border border-purple-500/50 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" }}
            >
              <FaDatabase className="w-12 h-12 text-purple-400" />
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-purple-500/20 to-transparent"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            <span className="text-sm text-purple-300 font-medium">Firebase Database</span>
            <p className="text-xs text-purple-200/70 mt-1 text-center max-w-[150px]">Secure cloud storage with strict access controls</p>
          </motion.div>
        </div>

        {/* Data flow code visualization */}
        <motion.div 
          className="mt-12 bg-black/30 rounded-lg border border-indigo-500/30 p-4 text-xs md:text-sm overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <pre className="text-gray-400 leading-relaxed">
            <code>
              <span className="text-blue-400">const</span> <span className="text-green-400">encryptCardData</span> = <span className="text-purple-400">(</span><span className="text-orange-400">cardData</span>, <span className="text-orange-400">masterPassword</span><span className="text-purple-400">)</span> {`=>`} {`{`}
                <span className="text-gray-500">// Generate encryption key from master password</span>
                <span className="text-blue-400">const</span> <span className="text-green-400">key</span> = <span className="text-yellow-400">PBKDF2</span><span className="text-purple-400">(</span>masterPassword, salt, iterations<span className="text-purple-400">)</span>;
                
                <span className="text-gray-500">// Convert sensitive data to encrypted format</span>
                <span className="text-blue-400">const</span> <span className="text-green-400">encrypted</span> = <span className="text-yellow-400">AES.encrypt</span><span className="text-purple-400">(</span>
                  <span className="text-yellow-400">JSON.stringify</span><span className="text-purple-400">(</span>cardData<span className="text-purple-400">)</span>,
                  key
                <span className="text-purple-400">)</span>;
                
                <span className="text-blue-400">return</span> encrypted.toString<span className="text-purple-400">()</span>;
              {`}`};
            </code>
          </pre>
        </motion.div>
      </div>
    </div>
  );
};

// Authentication flow diagram
const AuthenticationFlow = () => {
  return (
    <div className="flex flex-col">
      {/* Process steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        <motion.div 
          className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 rounded-xl p-5 flex flex-col items-center text-center shadow-xl shadow-blue-900/10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
          whileHover={{ 
            y: -5, 
            boxShadow: "0 20px 30px -10px rgba(30, 64, 175, 0.3)",
            transition: { duration: 0.3 }
          }}
        >
          <motion.div 
            className="w-20 h-20 bg-blue-500/30 rounded-full flex items-center justify-center mb-4 relative"
            animate={{ 
              boxShadow: [
                "0 0 0 0px rgba(59, 130, 246, 0.3)",
                "0 0 0 10px rgba(59, 130, 246, 0)",
                "0 0 0 0px rgba(59, 130, 246, 0.3)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FaGoogle className="w-10 h-10 text-blue-100" />
          </motion.div>
          <h3 className="font-bold text-lg text-blue-300 mb-2">1. Google Sign-In</h3>
          <p className="text-sm text-gray-300 mb-3">Verify your identity through Google's secure authentication system</p>
          <ul className="text-xs text-left space-y-2 text-gray-400">
            <li className="flex items-start">
              <BiCheck className="text-blue-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>No password storage on our servers</span>
            </li>
            <li className="flex items-start">
              <BiCheck className="text-blue-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>OAuth 2.0 industry standard security</span>
            </li>
            <li className="flex items-start">
              <BiCheck className="text-blue-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>Multi-factor authentication support</span>
            </li>
          </ul>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-xl p-5 flex flex-col items-center text-center shadow-xl shadow-indigo-900/10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
          whileHover={{ 
            y: -5, 
            boxShadow: "0 20px 30px -10px rgba(79, 70, 229, 0.3)",
            transition: { duration: 0.3 }
          }}
        >
          <motion.div 
            className="w-20 h-20 bg-indigo-500/30 rounded-full flex items-center justify-center mb-4 relative"
            animate={{ 
              boxShadow: [
                "0 0 0 0px rgba(99, 102, 241, 0.3)",
                "0 0 0 10px rgba(99, 102, 241, 0)",
                "0 0 0 0px rgba(99, 102, 241, 0.3)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            <BiKey className="w-10 h-10 text-indigo-100" />
          </motion.div>
          <h3 className="font-bold text-lg text-indigo-300 mb-2">2. Master Password</h3>
          <p className="text-sm text-gray-300 mb-3">Create your personal encryption key that only you know</p>
          <ul className="text-xs text-left space-y-2 text-gray-400">
            <li className="flex items-start">
              <BiCheck className="text-indigo-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>Never stored anywhere - not even on our servers</span>
            </li>
            <li className="flex items-start">
              <BiCheck className="text-indigo-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>Used to generate encryption keys via PBKDF2</span>
            </li>
            <li className="flex items-start">
              <BiCheck className="text-indigo-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>Key stretching for enhanced security</span>
            </li>
          </ul>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-purple-900/50 to-purple-800/20 rounded-xl p-5 flex flex-col items-center text-center shadow-xl shadow-purple-900/10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
          whileHover={{ 
            y: -5, 
            boxShadow: "0 20px 30px -10px rgba(126, 34, 206, 0.3)",
            transition: { duration: 0.3 }
          }}
        >
          <motion.div 
            className="w-20 h-20 bg-purple-500/30 rounded-full flex items-center justify-center mb-4 relative"
            animate={{ 
              boxShadow: [
                "0 0 0 0px rgba(139, 92, 246, 0.3)",
                "0 0 0 10px rgba(139, 92, 246, 0)",
                "0 0 0 0px rgba(139, 92, 246, 0.3)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 2 }}
          >
            <BiFingerprint className="w-10 h-10 text-purple-100" />
          </motion.div>
          <h3 className="font-bold text-lg text-purple-300 mb-2">3. Validated Access</h3>
          <p className="text-sm text-gray-300 mb-3">Your password decrypts a validation sentence to confirm your identity</p>
          <ul className="text-xs text-left space-y-2 text-gray-400">
            <li className="flex items-start">
              <BiCheck className="text-purple-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>Proves you have the correct encryption key</span>
            </li>
            <li className="flex items-start">
              <BiCheck className="text-purple-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>Prevents unauthorized access even if database is breached</span>
            </li>
            <li className="flex items-start">
              <BiCheck className="text-purple-400 flex-shrink-0 mt-0.5 mr-1" />
              <span>Built-in brute force protection</span>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Flow indicators */}
      <div className="hidden md:flex items-center justify-center gap-2 mt-4">
        <motion.div 
          className="h-0.5 w-16 bg-blue-500/50"
          initial={{ width: 0 }}
          whileInView={{ width: 64 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <BiRightArrowAlt className="text-blue-400" />
        <motion.div 
          className="h-0.5 w-16 bg-indigo-500/50"
          initial={{ width: 0 }}
          whileInView={{ width: 64 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1 }}
        />
        <BiRightArrowAlt className="text-indigo-400" />
        <motion.div 
          className="h-0.5 w-16 bg-purple-500/50"
          initial={{ width: 0 }}
          whileInView={{ width: 64 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1.5 }}
        />
      </div>

      {/* Technical diagram */}
      <motion.div 
        className="mt-8 bg-black/30 rounded-xl border border-white/10 p-5 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h4 className="text-white font-semibold mb-3 text-center">Authentication Technical Flow</h4>
        <div className="text-xs md:text-sm text-gray-400 leading-relaxed">
          <pre className="whitespace-pre-wrap break-words overflow-auto">
            <code>
{`// Authentication and Key Derivation Process
1. User signs in with Google OAuth
   └─> Establishes identity (uid) 
       └─> firebase.auth().signInWithPopup(googleProvider)

2. User provides master password
   └─> Browser computes encryption key locally
       └─> key = PBKDF2(masterPassword, uid, 100000, 256)

3. System verifies key correctness
   └─> Browser attempts to decrypt validation string
       └─> validationResult = AES.decrypt(encryptedValidation, key)
       └─> if validationResult matches expected → Access Granted
       └─> else → Access Denied (incorrect password)`}
            </code>
          </pre>
        </div>
      </motion.div>
    </div>
  );
};

// Encryption and decryption flow
const EndToEndEncryptionFlow = () => {
  return (
    <div className="relative my-10 py-6 bg-black/20 rounded-xl border border-indigo-500/20 overflow-hidden">
      <motion.div 
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 0%"],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      <h3 className="text-center text-lg font-semibold text-white mb-8">End-to-End Encryption Process</h3>
      
      <div className="flex flex-col md:flex-row items-center justify-around gap-8 px-6">
        <motion.div 
          className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/10 rounded-xl p-5 w-full md:w-80 flex flex-col items-center text-center border border-indigo-500/30 shadow-lg"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: "0 15px 30px -10px rgba(79, 70, 229, 0.2)",
            transition: { duration: 0.3 }
          }}
        >
          <div className="relative">
            <BiMobile className="w-12 h-12 text-indigo-400 mb-3" />
            <motion.div 
              className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-indigo-900 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-[8px] font-bold">1</span>
            </motion.div>
          </div>
          <h3 className="text-lg font-semibold text-indigo-300 mb-3">Your Device</h3>
          <div className="bg-black/40 rounded-lg p-3 my-3 w-full">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <BiData className="text-green-400" />
              <span className="text-sm text-green-300">Raw Card Data</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <BiKey className="text-yellow-400" />
              <span className="text-sm text-yellow-300">Master Password</span>
            </div>
          </div>
          
          <div className="space-y-2 mb-3 text-center">
            <motion.div 
              className="flex items-center justify-center gap-1 text-sm text-indigo-300"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0 }}
            >
              <FaLock className="text-indigo-400" />
              <span>Encryption</span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-center gap-1 text-sm text-indigo-300"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <BiKey className="text-yellow-400" />
              <span>Key Derivation</span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-center gap-1 text-sm text-indigo-300"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: 2 }}
            >
              <BiShield className="text-blue-400" />
              <span>Local Processing</span>
            </motion.div>
          </div>
          
          <div className="text-gray-400 text-xs mt-2">
            <p>Encryption happens entirely on your device - your raw data and password never leave your browser</p>
          </div>
        </motion.div>

        <div className="flex flex-col items-center">
          <div className="hidden md:block">
            {/* Desktop horizontal flow */}
            <motion.div 
              className="w-16 h-1 bg-gray-700 mb-1" 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                variants={flowArrowVariants}
              />
            </motion.div>
            <div className="text-xs text-center text-gray-400 mb-2">
              Encrypted Data
            </div>
            <motion.div 
              className="w-16 h-1 bg-gray-700 mt-1" 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500"
                variants={flowArrowVariants}
              />
            </motion.div>
            <div className="text-xs text-center text-gray-400 mt-2">
              Still Encrypted
            </div>
          </div>
          
          {/* Mobile vertical flow */}
          <div className="md:hidden flex flex-col items-center my-4">
            <motion.div 
              className="h-16 w-1 bg-gray-700 mb-1" 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div 
                className="w-full bg-gradient-to-b from-indigo-500 to-purple-600"
                variants={flowArrowVariants}
              />
            </motion.div>
            <div className="text-xs text-center text-gray-400 mb-4">
              Encrypted Data Flow
            </div>
          </div>
        </div>

        <motion.div 
          className="bg-gradient-to-br from-purple-900/40 to-purple-800/10 rounded-xl p-5 w-full md:w-80 flex flex-col items-center text-center border border-purple-500/30 shadow-lg"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: "0 15px 30px -10px rgba(126, 34, 206, 0.2)",
            transition: { duration: 0.3 }
          }}
        >
          <div className="relative">
            <BiServer className="w-12 h-12 text-purple-400 mb-3" />
            <motion.div 
              className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-purple-900 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <span className="text-[8px] font-bold">2</span>
            </motion.div>
          </div>
          <h3 className="text-lg font-semibold text-purple-300 mb-3">Dred Server</h3>
          <div className="bg-black/40 rounded-lg p-3 my-3 w-full">
            <div className="flex items-center gap-2 justify-center">
              <BiLock className="text-indigo-400" />
              <span className="text-sm text-indigo-300">Encrypted Data Only</span>
            </div>
            <div className="h-px bg-gray-700 my-3" />
            <div className="flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                <BiKey className="text-red-400 opacity-50" />
              </motion.div>
              <span className="text-sm text-red-300 opacity-50 ml-2">No Access to Keys</span>
            </div>
          </div>

          <div className="space-y-2 mb-3 text-center">
            <motion.div 
              className="flex items-center justify-center gap-1 text-sm text-purple-300"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            >
              <BiShield className="text-purple-400" />
              <span>Secure Storage</span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-center gap-1 text-sm text-purple-300"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
              <FaDatabase className="text-purple-400" />
              <span>Access Controls</span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-center gap-1 text-sm text-purple-300"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: 2.5 }}
            >
              <BiCloud className="text-purple-400" />
              <span>Cloud Sync</span>
            </motion.div>
          </div>
          
          <div className="text-gray-400 text-xs mt-2">
            <p>Our servers only store encrypted data - we have no ability to read your sensitive information</p>
          </div>
        </motion.div>
      </div>

      {/* Technical details section */}
      <motion.div 
        className="mt-8 mx-6 bg-black/30 rounded-lg border border-white/10 p-4 text-xs md:text-sm"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h4 className="text-white font-semibold mb-2">Technical Implementation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-indigo-300 font-medium mb-1">Encryption Algorithm</h5>
            <ul className="text-gray-400 space-y-1 pl-4">
              <li>• AES-256 in CBC mode for encryption</li>
              <li>• PBKDF2 with 100,000 iterations for key derivation</li>
              <li>• SHA-256 for integrity verification</li>
            </ul>
          </div>
          <div>
            <h5 className="text-purple-300 font-medium mb-1">Security Properties</h5>
            <ul className="text-gray-400 space-y-1 pl-4">
              <li>• Perfect forward secrecy</li>
              <li>• Zero knowledge architecture</li>
              <li>• Defense in depth with Firestore rules</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Security rules illustration
const SecurityRulesIllustration = () => {
  return (
    <div className="bg-gradient-to-br from-black/40 to-purple-900/20 rounded-xl border border-purple-500/30 p-6 my-8 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="w-full md:w-3/5">
          <h4 className="text-purple-300 text-lg font-bold mb-3 flex items-center">
            <BiShieldQuarter className="mr-2 text-purple-400" />
            Firestore Security Rules
          </h4>
          <p className="mb-4 text-sm text-gray-300">These rules are enforced at the database level, ensuring only you can access your data, even if the application logic were compromised.</p>
          
          <motion.div 
            className="overflow-hidden rounded-lg border border-purple-500/30 bg-black/50"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center bg-purple-900/50 px-3 py-2 border-b border-purple-500/30">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="ml-3 text-xs text-gray-300">firestore.rules</span>
            </div>
            
            <pre className="p-4 text-xs md:text-sm text-gray-300 overflow-x-auto">
              <code>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <span className="text-blue-400">service</span> <span className="text-purple-400">cloud.firestore</span> {'{'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {'  '}<span className="text-blue-400">match</span> <span className="text-green-400">/databases/{'{database}'}/documents</span> {'{'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {'    '}<span className="text-gray-500">// Card documents can only be accessed by their owner</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {'    '}<span className="text-blue-400">match</span> <span className="text-green-400">/cards/{'{cardId}'}</span> {'{'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {'      '}<span className="text-blue-400">allow</span> <span className="text-purple-400">read, write</span>: <span className="text-blue-400">if</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-yellow-400"
                >
                  {'        '}request.auth != null <span className="text-white">&&</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="text-yellow-400"
                >
                  {'        '}request.auth.uid == resource.data.uid;
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  {'    }{'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  {'    '}<span className="text-gray-500">// Validation strings for master password verification</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  {'    '}<span className="text-blue-400">match</span> <span className="text-green-400">/validationStrings/{'{userId}'}</span> {'{'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  {'      '}<span className="text-blue-400">allow</span> <span className="text-purple-400">read, write</span>: <span className="text-blue-400">if</span> <span className="text-yellow-400">request.auth.uid == userId;</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  {'    }{'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                >
                  {'  }{'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                >
                  {'}'}
                </motion.div>
              </code>
            </pre>
          </motion.div>
          
          <motion.div 
            className="mt-4 text-xs text-gray-400"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            These security rules ensure that even if our application code were compromised, your data would remain protected at the database level.
          </motion.div>
        </div>
        
        <div className="w-full md:w-2/5 flex flex-col items-center justify-center space-y-8">
          <motion.div 
            className="w-full bg-purple-900/20 rounded-xl border border-purple-500/30 p-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.3)" }}
          >
            <h5 className="text-white font-medium mb-3 text-center">Access Control Visualization</h5>
            
            <div className="flex justify-around">
              <div className="text-center">
                <motion.div 
                  className="relative mx-auto w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center justify-center mb-2"
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    boxShadow: ["0 0 0px rgba(52, 211, 153, 0)", "0 0 15px rgba(52, 211, 153, 0.5)", "0 0 0px rgba(52, 211, 153, 0)"],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <BiUserCheck className="w-8 h-8 text-green-400" />
                  <motion.div 
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-xs font-bold">✓</span>
                  </motion.div>
                </motion.div>
                <p className="text-green-400 text-xs">Your Account</p>
                <p className="text-green-500/70 text-xs mt-1">Access Granted</p>
              </div>
              
              <div className="text-center">
                <motion.div 
                  className="relative mx-auto w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center justify-center mb-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <BiUserCheck className="w-8 h-8 text-red-400" />
                  <motion.div 
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                    animate={{ rotate: [0, 45, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-xs font-bold">✗</span>
                  </motion.div>
                </motion.div>
                <p className="text-red-400 text-xs">Other Users</p>
                <p className="text-red-500/70 text-xs mt-1">Access Denied</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="w-full bg-indigo-900/20 rounded-xl border border-indigo-500/30 p-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.3)" }}
          >
            <h5 className="text-white font-medium mb-3 text-center">Security Implementation</h5>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <div className="bg-indigo-500/30 p-1 rounded mr-2 mt-0.5">
                  <BiShield className="text-indigo-300 w-4 h-4" />
                </div>
                <div>
                  <p className="text-indigo-300 text-xs">Defense in Depth</p>
                  <p className="text-xs text-gray-400">Multiple layers of security beyond just application code</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-indigo-500/30 p-1 rounded mr-2 mt-0.5">
                  <FaLock className="text-indigo-300 w-4 h-4" />
                </div>
                <div>
                  <p className="text-indigo-300 text-xs">Rule-Based Authorization</p>
                  <p className="text-xs text-gray-400">Access controlled by secure database rules, not just client code</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-indigo-500/30 p-1 rounded mr-2 mt-0.5">
                  <BiCheck className="text-indigo-300 w-4 h-4" />
                </div>
                <div>
                  <p className="text-indigo-300 text-xs">User ID Verification</p>
                  <p className="text-xs text-gray-400">Each document is tagged with the owner's user ID</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Account lockout visualization
const AccountLockoutVisualization = () => {
  return (
    <div className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Failure attempt */}
        <motion.div 
          className="bg-gradient-to-br from-red-900/30 to-red-800/10 rounded-xl p-5 flex flex-col items-center text-center shadow-lg border border-red-500/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
          whileHover={{ y: -5, boxShadow: "0 20px 30px -10px rgba(185, 28, 28, 0.2)" }}
        >
          <div className="relative">
            <motion.div 
              className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4"
              animate={{ 
                boxShadow: [
                  "0 0 0 0px rgba(239, 68, 68, 0.3)",
                  "0 0 0 10px rgba(239, 68, 68, 0)",
                  "0 0 0 0px rgba(239, 68, 68, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                <BiError className="w-10 h-10 text-red-400" />
              </motion.div>
            </motion.div>
            <motion.div 
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              1
            </motion.div>
          </div>
          <h3 className="font-bold text-lg text-white mb-3">Failed Attempt</h3>
          <p className="text-sm text-gray-300 mb-4">Incorrect master password triggers security measures</p>
          
          <div className="bg-black/30 rounded-lg p-3 text-left space-y-2 w-full">
            <div className="flex items-start gap-2">
              <BiLockAlt className="text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-300">First incorrect password is logged but allows immediate retry</span>
            </div>
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-300">User is notified of failed attempt</span>
            </div>
          </div>
          
          <motion.div 
            className="mt-4 text-xs text-center text-red-300"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaExclamationTriangle className="inline-block mr-1" />
            <span>Incorrect password</span>
          </motion.div>
        </motion.div>

        {/* Multiple failures */}
        <motion.div 
          className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 rounded-xl p-5 flex flex-col items-center text-center shadow-lg border border-orange-500/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
          whileHover={{ y: -5, boxShadow: "0 20px 30px -10px rgba(194, 65, 12, 0.2)" }}
        >
          <div className="relative">
            <motion.div 
              className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-4"
              animate={{ 
                boxShadow: [
                  "0 0 0 0px rgba(249, 115, 22, 0.3)",
                  "0 0 0 10px rgba(249, 115, 22, 0)",
                  "0 0 0 0px rgba(249, 115, 22, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
              >
                <FaExclamationTriangle className="w-10 h-10 text-orange-400" />
              </motion.div>
            </motion.div>
            <motion.div 
              className="absolute -top-2 -right-2 w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            >
              3
            </motion.div>
          </div>
          <h3 className="font-bold text-lg text-white mb-3">Multiple Failures</h3>
          <p className="text-sm text-gray-300 mb-4">Repeated failures trigger additional protection</p>
          
          <div className="bg-black/30 rounded-lg p-3 text-left space-y-2 w-full">
            <div className="flex items-start gap-2">
              <BiLockAlt className="text-orange-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-300">Three consecutive failures trigger enhanced protection</span>
            </div>
            <div className="flex items-start gap-2">
              <BiMessageAltError className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-300">System warns of impending lockout if failures continue</span>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2 justify-center">
            <motion.div 
              className="w-3 h-3 rounded-full bg-orange-600"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="w-3 h-3 rounded-full bg-orange-600"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="w-3 h-3 rounded-full bg-orange-600"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
        </motion.div>
        
        {/* Account locked */}
        <motion.div 
          className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-xl p-5 flex flex-col items-center text-center shadow-lg border border-purple-500/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
          whileHover={{ y: -5, boxShadow: "0 20px 30px -10px rgba(126, 34, 206, 0.2)" }}
        >
          <div className="relative">
            <motion.div 
              className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-4"
              animate={{ 
                boxShadow: [
                  "0 0 0 0px rgba(139, 92, 246, 0.3)",
                  "0 0 0 10px rgba(139, 92, 246, 0)",
                  "0 0 0 0px rgba(139, 92, 246, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <motion.div
                animate={{ scale: [1, 0.9, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <BiLockAlt className="w-10 h-10 text-purple-400" />
              </motion.div>
            </motion.div>
            <motion.div 
              className="absolute -top-2 -right-2 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
              animate={{ 
                boxShadow: ["0 0 0px rgba(139, 92, 246, 0)", "0 0 10px rgba(139, 92, 246, 0.7)", "0 0 0px rgba(139, 92, 246, 0)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BiLockAlt className="w-4 h-4" />
            </motion.div>
          </div>
          <h3 className="font-bold text-lg text-white mb-3">Account Locked</h3>
          <p className="text-sm text-gray-300 mb-4">Temporary lockout activated to prevent brute force</p>
          
          <div className="bg-black/30 rounded-lg p-3 text-left space-y-2 w-full">
            <div className="flex items-start gap-2">
              <BiLockAlt className="text-purple-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-300">Account access temporarily suspended for 15 minutes</span>
            </div>
            <div className="flex items-start gap-2">
              <BiShield className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-300">Exponential backoff for repeated lockouts (up to 24 hours)</span>
            </div>
          </div>
          
          <motion.div 
            className="mt-4 w-full bg-gray-800 rounded-full h-2 overflow-hidden"
          >
            <motion.div 
              className="h-full bg-purple-600 rounded-full"
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <div className="w-full flex justify-between mt-1 text-xs text-gray-400">
            <span>Locked</span>
            <span>15:00</span>
          </div>
        </motion.div>
      </div>
      
      {/* Additional explanation */}
      <motion.div 
        className="mt-8 bg-black/20 border border-white/10 rounded-lg p-4 text-sm"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h4 className="text-white font-semibold mb-2">Advanced Security Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-indigo-900/40 p-1.5 rounded-lg mr-3 mt-0.5">
                <BiShieldQuarter className="text-indigo-400 w-5 h-5" />
              </div>
              <div>
                <h5 className="text-indigo-300 font-medium">Brute Force Protection</h5>
                <p className="text-xs text-gray-400 mt-1">
                  Sophisticated algorithms detect and prevent repeated login attempts from the same source or using similar patterns.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-indigo-900/40 p-1.5 rounded-lg mr-3 mt-0.5">
                <BiMessageAltError className="text-indigo-400 w-5 h-5" />
              </div>
              <div>
                <h5 className="text-indigo-300 font-medium">Rate Limiting</h5>
                <p className="text-xs text-gray-400 mt-1">
                  IP-based rate limiting prevents automated attacks by restricting the number of operations that can be performed within a specific time period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Main component
const HowItWorks = ({ setActivePage }) => {
  const Section = ({ icon: Icon, title, children }) => (
    <motion.section 
      className="mb-12 p-6 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover={{ 
        boxShadow: "0 8px 32px rgba(78, 70, 236, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.15)",
        y: -5,
        transition: { duration: 0.3 }
      }}
    >
      <div className="flex items-center mb-4">
        <Icon className="w-6 h-6 mr-3 text-indigo-400 flex-shrink-0" />
        <h2 className="text-xl md:text-2xl font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-gray-300 leading-relaxed text-sm md:text-base">
        {children}
      </div>
    </motion.section>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white p-4 md:p-8 font-sans overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Back Button - Enhanced */}
        <motion.button
          onClick={() => {
            console.log("HowItWorks: Back button clicked");
            setActivePage('viewCards');
          }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors duration-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }}
          whileHover={{ 
            scale: 1.05, 
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          <BiArrowBack className="text-lg" />
          <span>Back</span>
        </motion.button>

        <motion.h1 
          className="text-3xl md:text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          How Dred Works & Security
        </motion.h1>
        
        <motion.p
          className="text-gray-300 text-center mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Dred is designed with security-first principles to protect your sensitive card data while making it easily accessible only to you.
        </motion.p>

        <Section icon={BiUserCheck} title="Authentication Flow">
          <p className="text-center text-sm md:text-base mb-2">How Dred verifies your identity while keeping your data secure:</p>
          <AuthenticationFlow />
          <motion.div variants={itemVariants} className="mt-4">
            <p className="text-sm">
              <strong className="text-white">Why this approach?</strong> By using both Google for identity verification and a Master Password that only you know,
              we combine the convenience of Google login with strong encryption only you can unlock.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiLockAlt} title="End-to-End Encryption">
          <p className="text-center text-sm md:text-base mb-2">Your data is always encrypted before it leaves your device:</p>
          <EncryptionAnimation />
          <EndToEndEncryptionFlow />
          <motion.div variants={itemVariants} className="mt-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-500/30 text-indigo-200 text-sm">
            <strong className="text-white block mb-1">Your Master Password is the Key:</strong> It is never stored or sent anywhere. If you forget it, your encrypted data cannot be recovered, as we have no way to decrypt it.
          </motion.div>
        </Section>

        <Section icon={BiCloud} title="Secure Data Storage">
          <motion.div variants={itemVariants}>
            <p className="mb-4">Your encrypted card data is stored in Google's secure <strong className="text-white">Firebase Firestore</strong> database with strict security rules.</p>
          </motion.div>
          <SecurityRulesIllustration />
          <motion.div variants={itemVariants}>
            <p className="text-sm">
              Security rules ensure that only you can access your data, even if someone were to bypass the application's logic.
              Data access is restricted at the database level, not just within the app.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiMobileAlt} title="Offline Access">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <motion.div 
              className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/10 rounded-lg p-4 flex flex-col items-center text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowNodeVariants}
            >
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3">
                <BiMobile className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Local Cache</h3>
              <p className="text-xs text-gray-300">Encrypted data is securely stored on your device after successful login</p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-lg p-4 flex flex-col items-center text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowNodeVariants}
            >
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                <BiLockOpen className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Local Decryption</h3>
              <p className="text-xs text-gray-300">Your master password decrypts data locally, even without internet access</p>
            </motion.div>
          </div>
          <motion.div variants={itemVariants}>
            <p className="text-sm text-center text-gray-400 italic">
              Offline access functionality is currently under development
            </p>
          </motion.div>
        </Section>
        
        <Section icon={BiMessageAltError} title="Account Protection">
          <motion.div variants={itemVariants}>
            <p className="text-center text-sm md:text-base mb-2">Dred protects your account from brute-force attempts:</p>
          </motion.div>
          <AccountLockoutVisualization />
          <motion.div variants={itemVariants}>
            <p className="text-sm">
              Additionally, rate limiting is implemented to prevent rapid login attempts that could be used in automated attacks.
              These protections ensure that your encrypted data remains secure even if someone repeatedly tries to guess your password.
            </p>
          </motion.div>
        </Section>
      </div>
    </div>
  );
};

export default HowItWorks; 