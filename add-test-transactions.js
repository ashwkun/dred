const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, where, query } = require('firebase/firestore');
const CryptoJS = require('crypto-js');

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB33k0x03bNqiYP-cUAaWZ4KH3_s_gQoAg",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "dred-6de63.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "dred-e6e59",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "dred-6de63.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "514327436507",
  appId: process.env.FIREBASE_APP_ID || "1:514327436507:web:4a3c9d65f6d59d7e65e09f",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-HBLQNTL5PE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Encryption & Decryption functions
const masterPassword = 's'; // Encryption key
const encryptData = (data, password) => {
  return CryptoJS.AES.encrypt(data.toString(), password).toString();
};

const decryptData = (encryptedData, password) => {
  try {
    return CryptoJS.AES.decrypt(encryptedData, password).toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    return "Error decrypting";
  }
};

// Categories with merchants
const categories = [
  {
    name: "Food & Dining",
    icon: "FaUtensils",
    merchants: ["Swiggy", "Zomato", "Eatclub", "McDonald's", "Starbucks", "KFC", "Domino's", "Pizza Hut", "Subway", "Burger King"]
  },
  {
    name: "Shopping",
    icon: "FaShoppingBag",
    merchants: [
      "Amazon", "Flipkart", "Myntra", "Reliance Trends",
      "Big Bazaar", "Shoppers Stop", "Croma", "Tata Cliq",
      "Pepperfry", "Lifestyle", "H&M", "ZARA", "IKEA"
    ]
  },
  {
    name: "Travel",
    icon: "FaPlane",
    merchants: [
      "MakeMyTrip", "Yatra", "Goibibo", "Cleartrip",
      "IndiGo", "SpiceJet", "Air India", "Ola Cabs",
      "Uber", "RedBus", "IRCTC", "Taj Hotels", "Marriott"
    ]
  },
  {
    name: "Entertainment",
    icon: "FaFilm",
    merchants: [
      "Netflix", "Amazon Prime Video", "Hotstar", "Zee5",
      "SonyLIV", "JioCinema", "Voot", "Eros Now",
      "ALTBalaji", "BookMyShow", "PVR Cinemas", "INOX", "Spotify", "Apple Music"
    ]
  },
  {
    name: "Groceries",
    icon: "FaShoppingBasket",
    merchants: [
      "BigBasket", "Grofers", "Reliance Fresh", "DMart",
      "Spencer's", "More Supermarket", "Nature's Basket",
      "Star Bazaar", "Foodhall", "Easyday", "Blinkit",
      "Zepto", "Swiggy Instamart", "Flipkart Minutes"
    ]
  },
  {
    name: "Investment",
    icon: "FaChartLine",
    merchants: [
      "SIP (Systematic Investment Plan)", "Lump Sum Mutual Funds",
      "Stocks", "Gold", "Real Estate", "Fixed Deposits",
      "Bonds", "ETFs", "PPF", "NPS", "Zerodha", "Groww", "Upstox", "Angel One", "HDFC Securities"
    ]
  },
  {
    name: "Bills & Utilities",
    icon: "FaFileInvoiceDollar",
    merchants: [
      "Tata Power", "Reliance Energy", "BSES", "Adani Electricity",
      "Mahanagar Gas", "Jio", "Airtel", "BSNL",
      "Vodafone Idea", "MTNL", "Water Bill", "Property Tax", "Tata Sky", "Dish TV"
    ]
  },
  {
    name: "Wellness",
    icon: "FaSpa",
    merchants: [
      "Nykaa", "Purplle", "The Body Shop", "Forest Essentials",
      "Biotique", "Mamaearth", "WOW Skin Science", "VLCC Beauty",
      "Sugar Cosmetics", "L'Occitane", "Apollo Pharmacy", "Medplus", "Cult.fit", "Decathlon"
    ]
  }
];

// Function to generate a random date in the past 5 months
function getRandomDate() {
  const now = new Date();
  const fiveMonthsAgo = new Date();
  fiveMonthsAgo.setMonth(now.getMonth() - 5);
  
  return new Date(
    fiveMonthsAgo.getTime() + Math.random() * (now.getTime() - fiveMonthsAgo.getTime())
  );
}

// Function to get recurring dates (1st of each month for the last 5 months)
function getRecurringDates() {
  const dates = [];
  const now = new Date();
  
  // Start from current month and go back 5 months
  for (let i = 0; i < 5; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    dates.push(date);
  }
  
  return dates;
}

// Function to generate a random amount between min and max
function getRandomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Function to get a random item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to add a transaction to Firestore
async function addTransaction(transaction, userId) {
  try {
    const encryptedTransaction = {
      uid: userId,
      amount: encryptData(transaction.amount, masterPassword),
      account: encryptData(transaction.account, masterPassword),
      category: transaction.category,
      categoryIcon: transaction.categoryIcon,
      merchant: encryptData(transaction.merchant, masterPassword),
      description: encryptData(transaction.description || '', masterPassword),
      date: transaction.date,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, "transactions"), encryptedTransaction);
    return docRef.id;
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
}

async function addTestTransactions() {
  try {
    // Get available user IDs from the cards collection
    const cardsQuery = await getDocs(collection(db, "cards"));
    const users = new Set();
    
    cardsQuery.forEach(doc => {
      users.add(doc.data().uid);
    });
    
    if (users.size === 0) {
      console.error("No users found with cards");
      return;
    }
    
    // Use the first user ID
    const userId = Array.from(users)[0];
    console.log(`Using user ID: ${userId}`);
    
    // First, get our specified cards
    const axisCardId = "cN4bNkk29WVCtspMDw7b";
    const hdfcCardId = "BfrPdRv2gLTCJH5C0ST1";
    const iciciCardId = "0qKHP8OZEGmNhUPZgLqN";
    const amexCardId = "ZCzJXpdlFLfdMoT19q1T";
    
    // Define all accounts including cards, cash and bank
    const accounts = [
      `card_${axisCardId}`,
      `card_${hdfcCardId}`,
      `card_${iciciCardId}`,
      `card_${amexCardId}`,
      'cash',
      'bank'
    ];
    
    // Generate 300 transactions with a monthly spend of ~90K
    const transactionsToAdd = [];
    let addedCount = 0;
    
    // Add recurring SIP investment transactions (1st of each month, 5000 INR)
    const recurringDates = getRecurringDates();
    for (const date of recurringDates) {
      const sipTransaction = {
        amount: '5000.00',
        account: 'bank', // SIP usually comes from bank account
        category: 'Investment',
        categoryIcon: 'FaChartLine',
        merchant: 'SIP (Systematic Investment Plan)',
        description: 'Monthly SIP Investment',
        date: date.toISOString().split('T')[0]
      };
      
      transactionsToAdd.push(sipTransaction);
      addedCount++;
      console.log(`Adding recurring SIP transaction for ${date.toDateString()}`);
    }
    
    // Calculate transactions per month (excluding SIPs already added)
    const totalMonths = 5;
    const transactionsPerMonth = Math.floor((300 - addedCount) / totalMonths);
    const monthlySpendTarget = 90000; // 90K per month
    const averageTransactionAmount = (monthlySpendTarget - 5000) / transactionsPerMonth; // Subtract SIP
    
    console.log(`Creating approximately ${transactionsPerMonth} transactions per month`);
    console.log(`Average transaction amount target: ₹${averageTransactionAmount.toFixed(2)}`);
    
    // More realistic distribution for spending categories
    const categoryDistribution = {
      'Food & Dining': 0.25,     // 25% (~22.5K)
      'Shopping': 0.15,          // 15% (~13.5K)
      'Travel': 0.08,            // 8% (~7.2K)
      'Entertainment': 0.10,     // 10% (~9K)
      'Groceries': 0.18,         // 18% (~16.2K)
      'Investment': 0.05,        // 5% (~4.5K) - in addition to the SIPs
      'Bills & Utilities': 0.12, // 12% (~10.8K)
      'Wellness': 0.07           // 7% (~6.3K)
    };
    
    // Calculate transactions per category per month
    const txnPerCategoryPerMonth = {};
    const spendPerCategoryPerMonth = {};
    
    for (const category in categoryDistribution) {
      txnPerCategoryPerMonth[category] = Math.round(transactionsPerMonth * categoryDistribution[category]);
      spendPerCategoryPerMonth[category] = (monthlySpendTarget - 5000) * categoryDistribution[category];
    }
    
    // Generate transactions for each month
    for (let month = 0; month < totalMonths; month++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - month);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of month
      monthEnd.setHours(23, 59, 59, 999);
      
      console.log(`Generating transactions for ${monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      
      // Generate transactions for each category for this month
      for (const category in txnPerCategoryPerMonth) {
        const txnCount = txnPerCategoryPerMonth[category];
        const totalCategorySpend = spendPerCategoryPerMonth[category];
        const avgTxnAmount = totalCategorySpend / txnCount;
        const categoryData = categories.find(c => c.name === category);
        
        for (let i = 0; i < txnCount; i++) {
          // Select a random account with higher chance for cards
          let account;
          const rand = Math.random();
          if (rand < 0.1) {
            account = 'cash'; // 10% cash
          } else if (rand < 0.25) {
            account = 'bank'; // 15% bank
          } else {
            // 75% from cards
            account = getRandomItem([
              `card_${axisCardId}`,
              `card_${hdfcCardId}`,
              `card_${iciciCardId}`,
              `card_${amexCardId}`
            ]);
          }
          
          const merchant = getRandomItem(categoryData.merchants);
          
          // Generate a random amount with realistic variation
          // Use normal-like distribution using avg +/- 30% with occasional outliers
          let amount;
          const distribution = Math.random();
          if (distribution < 0.7) {
            // 70% of transactions are within 30% of average for the category
            const variance = 0.3 * avgTxnAmount;
            amount = avgTxnAmount + (Math.random() * 2 - 1) * variance;
          } else if (distribution < 0.9) {
            // 20% are smaller transactions
            amount = avgTxnAmount * (0.3 + Math.random() * 0.4); // 30-70% of average
          } else {
            // 10% are larger transactions
            amount = avgTxnAmount * (1.3 + Math.random() * 1.0); // 130-230% of average
          }
          
          // Round to realistic values (rounding to common price points)
          if (amount < 200) {
            // Round to nearest 10
            amount = Math.round(amount / 10) * 10;
          } else if (amount < 1000) {
            // Round to nearest 50
            amount = Math.round(amount / 50) * 50;
          } else {
            // Round to nearest 100
            amount = Math.round(amount / 100) * 100;
          }
          
          // Generate a random date within this month
          const transactionDate = new Date(
            monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime())
          );
          
          const transaction = {
            amount: amount.toFixed(2),
            account: account,
            category: category,
            categoryIcon: categoryData.icon,
            merchant: merchant,
            description: `${merchant} ${category.toLowerCase()} expense`,
            date: transactionDate.toISOString().split('T')[0]
          };
          
          transactionsToAdd.push(transaction);
          addedCount++;
        }
      }
    }

    // Sort transactions by date (oldest first)
    transactionsToAdd.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Add all transactions to Firestore
    console.log(`Starting to add ${transactionsToAdd.length} transactions to Firestore...`);
    let successCount = 0;
    
    for (let i = 0; i < transactionsToAdd.length; i++) {
      try {
        await addTransaction(transactionsToAdd[i], userId);
        successCount++;
        
        if (successCount % 50 === 0 || successCount === transactionsToAdd.length) {
          console.log(`Added ${successCount}/${transactionsToAdd.length} transactions to Firestore...`);
        }
      } catch (error) {
        console.error(`Failed to add transaction ${i}:`, error);
      }
    }
    
    // Calculate actual spend by month from added transactions
    const spendByMonth = {};
    for (const txn of transactionsToAdd) {
      const date = new Date(txn.date);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!spendByMonth[monthYear]) {
        spendByMonth[monthYear] = 0;
      }
      
      spendByMonth[monthYear] += parseFloat(txn.amount);
    }
    
    console.log("\nMonthly spending summary:");
    for (const [month, spend] of Object.entries(spendByMonth)) {
      console.log(`${month}: ₹${spend.toFixed(2)}`);
    }
    
    console.log(`\nSuccessfully added ${successCount} test transactions.`);
  } catch (error) {
    console.error("Error in addTestTransactions:", error);
  }
}

// Execute the function
addTestTransactions(); 