import React, { useEffect, useState } from 'react';
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { BiCreditCard, BiTrendingUp, BiMoney, BiInfoCircle } from 'react-icons/bi';

function Dashboard({ user, masterPassword }) {
  const [stats, setStats] = useState({
    totalCards: 0,
    banks: [],
    networks: [],
    insights: []
  });

  // Bank-specific fun facts
  const bankFacts = {
    'HDFC': 'HDFC was founded in 1994, making it younger than most of its customers! 🎂',
    'ICICI': 'ICICI Bank has more mobile app users than the population of several countries! 📱',
    'SBI': 'SBI is so old, it probably handled transactions for the Mughal Empire! 👑',
    'Axis': 'Axis Bank was originally called "UTI Bank" - not to be confused with a medical condition! 😅',
    'RBL': 'RBL Bank started as a tiny bank in Maharashtra and now it\'s everywhere, like your favorite street food chain! 🚀',
    'IDFC': 'IDFC First Bank is like that friend who changed their name to sound cooler - it worked! ✨',
  };

  // Network-specific fun facts
  const networkFacts = {
    'Visa': 'Visa processes more transactions per second than your attempts to catch a bus! 🚌',
    'Mastercard': 'Mastercard\'s logo is so simple, yet they spent millions designing it. Talk about expensive circles! ⭕',
    'RuPay': 'RuPay cards are more Indian than butter chicken! 🇮🇳',
    'American Express': 'Amex cards are like VIP passes - not accepted everywhere, but fancy nonetheless! ✨',
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !masterPassword) return;

      const q = query(
        collection(db, "cards"),
        where("uid", "==", user.uid)
      );

      try {
        const querySnapshot = await getDocs(q);
        const cards = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            bank: CryptoJS.AES.decrypt(data.bankName, masterPassword).toString(CryptoJS.enc.Utf8),
            network: CryptoJS.AES.decrypt(data.networkName, masterPassword).toString(CryptoJS.enc.Utf8),
          };
        });

        const uniqueBanks = [...new Set(cards.map(card => card.bank))];
        const uniqueNetworks = [...new Set(cards.map(card => card.network))];

        // Generate insights
        const insights = [];
        
        // Bank-based insights
        uniqueBanks.forEach(bank => {
          if (bankFacts[bank]) {
            insights.push({
              type: 'bank',
              icon: <BiInfoCircle className="text-blue-400" />,
              text: bankFacts[bank]
            });
          }
        });

        // Network-based insights
        uniqueNetworks.forEach(network => {
          if (networkFacts[network]) {
            insights.push({
              type: 'network',
              icon: <BiCreditCard className="text-purple-400" />,
              text: networkFacts[network]
            });
          }
        });

        // Add some general insights
        if (uniqueBanks.length > 2) {
          insights.push({
            type: 'general',
            icon: <BiTrendingUp className="text-green-400" />,
            text: "You have more banks than a monopoly game! 🎲"
          });
        }

        if (uniqueNetworks.length > 1) {
          insights.push({
            type: 'general',
            icon: <BiMoney className="text-yellow-400" />,
            text: "Multiple networks? You're like a financial DJ mixing cards! 🎵"
          });
        }

        setStats({
          totalCards: cards.length,
          banks: uniqueBanks,
          networks: uniqueNetworks,
          insights: insights
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user, masterPassword]);

  return (
    <div className="max-w-4xl mx-auto mb-16 md:mb-0">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">Total Cards</h3>
          <p className="text-3xl font-bold text-white">{stats.totalCards}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">Banks</h3>
          <p className="text-3xl font-bold text-white">{stats.banks.length}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">Networks</h3>
          <p className="text-3xl font-bold text-white">{stats.networks.length}</p>
        </div>
      </div>

      {/* Fun Insights */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Fun Facts & Insights</h2>
          <div className="space-y-4">
            {stats.insights.map((insight, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="p-2 bg-white/10 rounded-lg">
                  {insight.icon}
                </div>
                <p className="text-white/90 flex-1">{insight.text}</p>
              </div>
            ))}
            {stats.insights.length === 0 && (
              <p className="text-white/60 text-center py-4">
                Add some cards to see interesting insights! 🎴
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
