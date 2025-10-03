import React from 'react';
import { motion } from 'framer-motion';
import { BiArrowBack, BiShieldQuarter, BiData, BiError, BiUserCheck } from 'react-icons/bi';

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
              By using Dred, you accept and agree to be bound by these Terms of Service. 
              If you do not agree, please do not use the Service.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiData} title="Service Description">
          <motion.div variants={itemVariants}>
            <p>
              Dred is a digital card wallet that helps you securely store and manage your payment card information. 
              All card data is encrypted on your device before storage. For details on data handling, see our{' '}
              <button 
                onClick={() => setActivePage('privacy')}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Privacy Policy
              </button>
              . For security details, see{' '}
              <button 
                onClick={() => setActivePage('howItWorks')}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                How It Works
              </button>
              .
            </p>
          </motion.div>
        </Section>

        <Section icon={BiUserCheck} title="User Responsibilities">
          <motion.div variants={itemVariants}>
            <p className="mb-3">You are responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintaining the confidentiality of your master password</li>
              <li>All activities that occur under your account</li>
              <li>Using the Service in compliance with all applicable laws</li>
              <li>Not attempting to breach or test the security of the Service</li>
              <li>The accuracy of information you provide</li>
            </ul>
          </motion.div>
        </Section>

        <Section icon={BiError} title="Limitation of Liability">
          <motion.div variants={itemVariants}>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The Service is provided "as is" without warranties of any kind</li>
              <li>We are not liable for any damages arising from your use of the Service</li>
              <li>We are not responsible for data breaches, loss of data, or unauthorized access</li>
              <li>You use the Service at your own risk</li>
            </ul>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30"
          >
            <p className="text-red-200 text-sm">
              <strong className="text-white">Important:</strong> While we implement strong security measures, 
              the developer assumes no liability for security breaches, data loss, or damages arising from the use of this Service.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiShieldQuarter} title="Termination">
          <motion.div variants={itemVariants}>
            <p>
              We may terminate or suspend your access at any time for any reason, including breach of these Terms. 
              You may stop using the Service at any time.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiData} title="Changes to Terms">
          <motion.div variants={itemVariants}>
            <p>
              We may modify these Terms at any time. Changes are effective immediately upon posting. 
              Your continued use constitutes acceptance of the new Terms.
            </p>
          </motion.div>
        </Section>

        <Section icon={BiShieldQuarter} title="Contact">
          <motion.div variants={itemVariants}>
            <p className="mb-3">Questions about these Terms? Contact us at:</p>
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
              onClick={() => setActivePage('privacy')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-sm transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActivePage('howItWorks')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-sm transition-colors"
            >
              How It Works & Security
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

export default TermsAndConditions;
