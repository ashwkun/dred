import React from 'react';
import { motion } from 'framer-motion';
import { BiArrowBack, BiShieldQuarter, BiData, BiLockAlt, BiUserCheck } from 'react-icons/bi';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

const PrivacyPolicy = ({ setActivePage }) => {
  const Section = ({ icon: Icon, title, children }) => (
    <motion.section 
      className="mb-8 p-6 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm"
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
        <motion.button
          onClick={() => setActivePage('auth')}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors duration-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          whileTap={{ scale: 0.95 }}
        >
          <BiArrowBack className="text-lg" />
          <span>Back to Sign In</span>
        </motion.button>

        <motion.h1 
          className="text-3xl md:text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Privacy Policy
        </motion.h1>
        
        <motion.p
          className="text-gray-300 text-center mb-8 max-w-2xl mx-auto text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Last updated: October 3, 2025
        </motion.p>

        <Section icon={BiShieldQuarter} title="Introduction">
          <motion.div variants={itemVariants}>
            <p>
              Dred is committed to protecting your privacy. This policy explains our data practices. 
              For technical security details, see{' '}
              <button 
                onClick={() => setActivePage('howItWorks')}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                How It Works
              </button>
              . For legal terms, see our{' '}
              <button 
                onClick={() => setActivePage('terms')}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Terms of Service
              </button>
              .
            </p>
          </motion.div>
        </Section>

        <Section icon={BiData} title="What We Collect">
          <motion.div variants={itemVariants}>
            <div className="space-y-3">
              <div className="bg-indigo-900/20 rounded-lg p-4 border border-indigo-500/20">
                <h3 className="font-semibold text-white mb-2">Account Data</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong>Via Google Sign-In (Recommended):</strong> Email address, profile picture, User ID</li>
                  <li><strong>Via Email/Phone Sign-Up:</strong> Email address or phone number you provide</li>
                </ul>
                <p className="text-green-200 text-xs mt-2 p-2 bg-green-900/30 rounded">
                  <strong>Google Sign-In is recommended:</strong> Faster authentication and better security. No passwords to remember.
                </p>
              </div>
              
              <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/20">
                <h3 className="font-semibold text-white mb-2">Card Data (Encrypted)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Card numbers, CVV, expiry dates</li>
                  <li>Card nicknames and issuer information</li>
                  <li>Bill payment details</li>
                </ul>
                <p className="text-indigo-200 text-xs mt-2 p-2 bg-indigo-900/30 rounded">
                  <strong>Note:</strong> All card data is encrypted on your device before storage. We cannot read it.
                </p>
              </div>
            </div>
          </motion.div>
        </Section>

        <Section icon={BiUserCheck} title="How We Use Your Data">
          <motion.div variants={itemVariants}>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Authentication:</strong> Email, phone number, or profile picture identify your account</li>
              <li><strong className="text-white">Verification:</strong> Email/phone used to verify your account and send password reset links (when applicable)</li>
              <li><strong className="text-white">Service:</strong> Store and retrieve your encrypted card data</li>
              <li><strong className="text-white">Support:</strong> Provide customer assistance if needed</li>
            </ul>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-4 p-4 bg-green-900/20 rounded-lg border border-green-500/30"
          >
            <h3 className="font-semibold text-white mb-2">What We DON'T Do</h3>
            <ul className="space-y-1 text-green-200 text-sm">
              <li>✗ No marketing emails</li>
              <li>✗ No selling your data</li>
              <li>✗ No sharing with third parties</li>
              <li>✗ No accessing your encrypted cards</li>
            </ul>
          </motion.div>
        </Section>

        <Section icon={BiLockAlt} title="Security">
          <motion.div variants={itemVariants}>
            <p className="mb-3">
              We use industry-standard security measures. For detailed technical information about our encryption and security architecture, see{' '}
              <button 
                onClick={() => setActivePage('howItWorks')}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                How It Works
              </button>
              .
            </p>
            <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30 text-sm text-yellow-200">
              <strong className="text-white">Master Password:</strong> Your master password is never stored. 
              If you lose it, your data cannot be recovered.
            </div>
          </motion.div>
        </Section>

        <Section icon={BiData} title="Data Storage">
          <motion.div variants={itemVariants}>
            <p className="mb-3">Your encrypted data is stored in Google Firebase Firestore:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
              <li>Secure data centers with industry-standard protections</li>
              <li>Access restricted by Firebase security rules</li>
              <li>Data retained while your account is active</li>
              <li>Can be deleted anytime through the app</li>
            </ul>
          </motion.div>
        </Section>

        <Section icon={BiUserCheck} title="Your Rights">
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <strong className="text-white">Access:</strong> View your data anytime
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <strong className="text-white">Delete:</strong> Remove cards or account
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <strong className="text-white">Update:</strong> Edit your information
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <strong className="text-white">Export:</strong> Download your data
              </div>
            </div>
          </motion.div>
        </Section>

        <Section icon={BiShieldQuarter} title="Third-Party Services">
          <motion.div variants={itemVariants}>
            <p className="mb-3 text-sm">We use Google Firebase for authentication, database, and hosting. 
            Google's privacy policy applies to these services.</p>
            <p className="text-xs text-gray-400">
              Dred is not intended for users under 18. We don't knowingly collect data from children.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiData} title="Contact Us">
          <motion.div variants={itemVariants}>
            <p className="mb-3">Questions about privacy?</p>
            <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/30">
              <p className="text-indigo-200">
                <strong className="text-white">Email:</strong> aswinanand9020@gmail.com
              </p>
            </div>
          </motion.div>
        </Section>

        {/* Related Pages */}
        <motion.div
          className="mt-8 p-6 bg-indigo-900/20 rounded-xl border border-indigo-500/30"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-white font-semibold mb-3 text-center">Related Information</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActivePage('howItWorks')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-sm transition-colors"
            >
              How It Works & Security
            </button>
            <button
              onClick={() => setActivePage('terms')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-sm transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </motion.div>

        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.button
            onClick={() => setActivePage('auth')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 
              text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Sign In
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
