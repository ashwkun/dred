import React from 'react';
import { motion } from 'framer-motion';
import { BiArrowBack, BiShieldQuarter, BiData, BiLockAlt, BiError } from 'react-icons/bi';

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

const TermsAndConditions = ({ setActivePage }) => {
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
        {/* Back Button */}
        <motion.button
          onClick={() => {
            console.log("TermsAndConditions: Back button clicked");
            setActivePage('auth');
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
          <span>Back to Sign In</span>
        </motion.button>

        <motion.h1 
          className="text-3xl md:text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Terms of Service
        </motion.h1>
        
        <motion.p
          className="text-gray-300 text-center mb-8 max-w-2xl mx-auto text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Last updated: October 3, 2025
        </motion.p>

        <Section icon={BiShieldQuarter} title="Acceptance of Terms">
          <motion.div variants={itemVariants}>
            <p>
              By accessing and using Dred ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiData} title="Data Collection and Usage">
          <motion.div variants={itemVariants}>
            <p className="mb-4">
              <strong className="text-white">What We Collect:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your email address (via Google authentication)</li>
              <li>Your profile picture (via Google authentication)</li>
              <li>Encrypted card data that only you can decrypt</li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-4">
            <p className="mb-4">
              <strong className="text-white">How We Use Your Data:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your email and profile picture are used solely for authentication and identification purposes</li>
              <li>We will <strong className="text-white">NOT</strong> use your email for marketing, newsletters, or any communication</li>
              <li>We will <strong className="text-white">NOT</strong> share your email or profile picture with any third parties</li>
              <li>Your card data is encrypted on your device before being stored and cannot be accessed by us</li>
            </ul>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className="mt-4 p-4 bg-indigo-900/30 rounded-lg border border-indigo-500/30"
          >
            <p className="text-indigo-200 text-sm">
              <strong className="text-white">Privacy Commitment:</strong> Your personal information is used exclusively for providing 
              the Service to you. We respect your privacy and will never use your data for purposes other than operating the Service.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiLockAlt} title="Security">
          <motion.div variants={itemVariants}>
            <p className="mb-4">
              We take the security of your data seriously and have implemented industry-standard security measures:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>End-to-end encryption using AES-256</li>
              <li>Your master password is never stored anywhere</li>
              <li>All sensitive data is encrypted on your device before transmission</li>
              <li>Firebase Firestore security rules restrict data access to authenticated users only</li>
              <li>Account lockout mechanisms to prevent brute force attacks</li>
            </ul>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30"
          >
            <div className="flex items-start gap-3">
              <BiError className="text-yellow-400 text-xl flex-shrink-0 mt-1" />
              <div>
                <p className="text-yellow-200 text-sm">
                  <strong className="text-white">Important Notice:</strong> While we have implemented comprehensive security measures 
                  and follow industry best practices to protect your data, no system can be 100% secure. In the unlikely event of a 
                  data breach, we cannot be held liable for any damages or losses that may occur.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-4">
            <p className="text-sm text-gray-400">
              Your master password is the key to your encrypted data. If you lose it, we cannot recover your data as we have no 
              way to decrypt it. Please store your master password securely.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiShieldQuarter} title="Limitation of Liability">
          <motion.div variants={itemVariants}>
            <p className="mb-4">
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The Service is provided "as is" without warranties of any kind</li>
              <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>We are not responsible for any data breaches, loss of data, or unauthorized access to your account</li>
              <li>You use the Service at your own risk</li>
              <li>We do not guarantee uninterrupted or error-free service</li>
            </ul>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30"
          >
            <p className="text-red-200 text-sm">
              <strong className="text-white">Disclaimer:</strong> While every effort has been made to secure the Service and protect 
              your data, the developer assumes no liability for any security breaches, data loss, or damages that may arise from 
              the use of this Service.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiData} title="User Responsibilities">
          <motion.div variants={itemVariants}>
            <p className="mb-4">
              As a user of the Service, you are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintaining the confidentiality of your master password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Using the Service in compliance with all applicable laws and regulations</li>
              <li>Not attempting to breach or test the security of the Service</li>
            </ul>
          </motion.div>
        </Section>

        <Section icon={BiShieldQuarter} title="Changes to Terms">
          <motion.div variants={itemVariants}>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the Service. 
              Your continued use of the Service after any changes constitutes acceptance of the new terms.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiData} title="Termination">
          <motion.div variants={itemVariants}>
            <p>
              We reserve the right to terminate or suspend your access to the Service at any time, without prior notice or liability, 
              for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiShieldQuarter} title="Contact">
          <motion.div variants={itemVariants}>
            <p>
              If you have any questions about these Terms, please contact us through the application's feedback mechanism.
            </p>
          </motion.div>
        </Section>

        <motion.div
          className="mt-8 p-6 bg-indigo-900/20 rounded-xl border border-indigo-500/30 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-300 text-sm">
            By continuing to use Dred, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </motion.div>

        {/* Back to Sign In Button at Bottom */}
        <motion.div
          className="mt-8 text-center"
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

export default TermsAndConditions;

