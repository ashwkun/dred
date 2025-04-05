import React from 'react';
import { motion } from 'framer-motion';
import { 
  BiArrowBack, BiUserCheck, BiLockAlt, BiShieldQuarter, 
  BiCloud, BiMobileAlt, BiKey, BiMessageAltError, 
  BiLock, BiLockOpen, BiServer, BiMobile, BiCheck,
  BiError, BiData, BiShield, BiFingerprint
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
    <div className="relative py-10 flex justify-center items-center w-full my-6">
      {/* Unencrypted data */}
      <motion.div 
        className="flex flex-col items-center justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-center mb-2">
          <BiData className="w-10 h-10 text-green-400" />
        </div>
        <span className="text-xs text-green-300">Your Card Data</span>
      </motion.div>

      {/* Encryption process arrow */}
      <motion.div 
        className="mx-4 w-16 flex items-center justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div 
          className="h-1 w-full bg-indigo-500"
          variants={flowArrowVariants}
        />
        <div className="absolute">
          <BiKey className="w-6 h-6 text-yellow-400" />
        </div>
      </motion.div>

      {/* Locked data */}
      <motion.div 
        className="flex flex-col items-center justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="w-20 h-20 bg-indigo-500/20 border border-indigo-500/50 rounded-lg flex items-center justify-center mb-2">
          <BiLock className="w-10 h-10 text-indigo-400" />
        </div>
        <span className="text-xs text-indigo-300">Encrypted Data</span>
      </motion.div>

      {/* Storage arrow */}
      <motion.div 
        className="mx-4 w-16 flex items-center justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div 
          className="h-1 w-full bg-purple-500"
          variants={flowArrowVariants}
        />
      </motion.div>

      {/* Database */}
      <motion.div 
        className="flex flex-col items-center justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="w-20 h-20 bg-purple-500/20 border border-purple-500/50 rounded-lg flex items-center justify-center mb-2">
          <FaDatabase className="w-10 h-10 text-purple-400" />
        </div>
        <span className="text-xs text-purple-300">Firebase Database</span>
      </motion.div>
    </div>
  );
};

// Authentication flow diagram
const AuthenticationFlow = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
      <motion.div 
        className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 rounded-lg p-4 flex flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="w-16 h-16 bg-blue-500/30 rounded-full flex items-center justify-center mb-3">
          <FaGoogle className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-blue-300 mb-2">1. Google Sign-In</h3>
        <p className="text-xs text-gray-300">Sign in with your Google account for initial identity verification</p>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-lg p-4 flex flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="w-16 h-16 bg-indigo-500/30 rounded-full flex items-center justify-center mb-3">
          <BiKey className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-indigo-300 mb-2">2. Master Password</h3>
        <p className="text-xs text-gray-300">Create or enter your secret master password that only you know</p>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-purple-900/50 to-purple-800/20 rounded-lg p-4 flex flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center mb-3">
          <BiFingerprint className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-purple-300 mb-2">3. Validated Access</h3>
        <p className="text-xs text-gray-300">Your password decrypts a validation sentence to verify your identity</p>
      </motion.div>
    </div>
  );
};

// Encryption and decryption flow
const EndToEndEncryptionFlow = () => {
  return (
    <div className="relative my-6 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <motion.div 
          className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-lg p-4 w-full md:w-64 flex flex-col items-center text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
        >
          <BiMobile className="w-10 h-10 text-indigo-400 mb-2" />
          <h3 className="text-sm font-semibold text-indigo-300 mb-1">Your Device</h3>
          <div className="bg-black/20 rounded p-2 my-2 w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BiData className="text-green-400" />
              <span className="text-xs text-green-300">Raw Card Data</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <BiKey className="text-yellow-400" />
              <span className="text-xs text-yellow-300">Master Password</span>
            </div>
          </div>
          <FaLock className="text-indigo-400 my-2 animate-pulse" />
          <span className="text-xs text-gray-400">Encryption happens here</span>
        </motion.div>

        <div className="flex-1 flex flex-col md:flex-row items-center justify-center">
          <motion.div 
            className="w-24 h-1 md:w-1 md:h-16 bg-gray-700" 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={flowArrowVariants}
          >
            <motion.div 
              className="h-full w-full bg-indigo-500"
              variants={flowArrowVariants}
            />
          </motion.div>
          <div className="py-2">
            <BiLock className="text-indigo-400" />
          </div>
          <motion.div 
            className="w-24 h-1 md:w-1 md:h-16 bg-gray-700" 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={flowArrowVariants}
          >
            <motion.div 
              className="h-full w-full bg-indigo-500"
              variants={flowArrowVariants}
            />
          </motion.div>
        </div>

        <motion.div 
          className="bg-gradient-to-br from-purple-900/50 to-purple-800/20 rounded-lg p-4 w-full md:w-64 flex flex-col items-center text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={flowNodeVariants}
        >
          <BiServer className="w-10 h-10 text-purple-400 mb-2" />
          <h3 className="text-sm font-semibold text-purple-300 mb-1">Dred Server</h3>
          <div className="bg-black/20 rounded p-2 my-2 w-full">
            <div className="flex items-center justify-center gap-2">
              <BiLock className="text-indigo-400" />
              <span className="text-xs text-indigo-300">Encrypted Data Only</span>
            </div>
          </div>
          <BiShield className="text-purple-400 my-2" />
          <span className="text-xs text-gray-400">Cannot access your raw data</span>
        </motion.div>
      </div>
    </div>
  );
};

// Security rules illustration
const SecurityRulesIllustration = () => {
  return (
    <div className="bg-black/30 rounded-lg border border-purple-500/30 p-4 my-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-300 w-full">
          <h4 className="text-purple-300 font-bold mb-2">Firestore Security Rules</h4>
          <p className="mb-2 text-xs">These rules are enforced at the database level to ensure only you can access your data.</p>
          <div className="overflow-x-auto max-w-full">
            <pre className="bg-black/50 rounded p-2 text-xs text-gray-400 whitespace-pre-wrap break-all md:break-normal">
              <code>
                {`// Rule for cards collection
match /cards/{cardId} {
  // Only the owner can read or write
  allow read, write: if 
    request.auth != null && 
    request.auth.uid == resource.data.uid;
}`}
              </code>
            </pre>
          </div>
        </div>
        
        <div className="flex flex-row md:flex-col gap-4 mt-4 md:mt-0">
          <div className="flex-shrink-0">
            <div className="relative">
              <motion.div 
                className="w-16 h-16 md:w-24 md:h-24 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, transition: { delay: 0.3 } }}
                viewport={{ once: true }}
              >
                <BiUserCheck className="w-8 h-8 md:w-10 md:h-10 text-green-400" />
                <span className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
              </motion.div>
              <div className="mt-2 text-center text-xs text-green-400">Your Account</div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="relative">
              <motion.div 
                className="w-16 h-16 md:w-24 md:h-24 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, transition: { delay: 0.6 } }}
                viewport={{ once: true }}
              >
                <BiUserCheck className="w-8 h-8 md:w-10 md:h-10 text-red-400" />
                <span className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">✗</span>
              </motion.div>
              <div className="mt-2 text-center text-xs text-red-400">Other Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Account lockout visualization
const AccountLockoutVisualization = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
      <motion.div 
        className="bg-gradient-to-br from-red-900/30 to-red-800/10 rounded-lg p-4 flex flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="relative">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-3">
            <BiError className="w-8 h-8 text-red-400" />
          </div>
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
        </div>
        <h3 className="font-bold text-white mb-1">Failed Attempt</h3>
        <p className="text-xs text-gray-300">Incorrect master password</p>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 rounded-lg p-4 flex flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="relative">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
            <FaExclamationTriangle className="w-8 h-8 text-orange-400" />
          </div>
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
        </div>
        <h3 className="font-bold text-white mb-1">Multiple Failures</h3>
        <p className="text-xs text-gray-300">3 consecutive wrong attempts</p>
      </motion.div>
      
      <motion.div 
        className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-lg p-4 flex flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={flowNodeVariants}
      >
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
          <BiLockAlt className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="font-bold text-white mb-1">Account Locked</h3>
        <p className="text-xs text-gray-300">15-minute timeout for security</p>
      </motion.div>
    </div>
  );
};

const HowItWorks = ({ setActivePage }) => {
  const Section = ({ icon: Icon, title, children }) => (
    <motion.section 
      className="mb-12 p-6 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
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
        <motion.button
          onClick={() => setActivePage('auth')}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BiArrowBack />
          Go Back
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