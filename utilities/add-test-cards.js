const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const CryptoJS = require('crypto-js');

// Define bankThemes directly in the script instead of importing
const bankThemes = {
  "HDFC Bank": "linear-gradient(to right, #004AAD, #002D62)", // Deep Ocean
  "ICICI Bank": "linear-gradient(to right, #F16522, #D64513)", // Amber Glow
  "Axis Bank": "linear-gradient(to right, #9B0D3E, #E52A6F)", // Rose Velvet
  "SBI": "linear-gradient(to right, #1F4E79, #00AEEF)", // Azure Breeze
  "Kotak Mahindra Bank": "linear-gradient(to right, #005BAC, #E21937)", // Royal Crimson
  "Yes Bank": "linear-gradient(to right, #004C97, #0091DA)", // Sapphire Sky
  "IndusInd Bank": "linear-gradient(to right, #A91B28, #D13641)", // Ruby Shine
  "Federal Bank": "linear-gradient(to right, #003366, #FFBA08)", // Golden Dawn
  "RBL Bank": "linear-gradient(to right, #3023AE, #C86DD7)", // Mystic Purple
  "DBS Bank": "linear-gradient(to right, #C8102E, #000000)", // Midnight Red
  "Citi Bank": "linear-gradient(to right, #003B71, #0077C8)", // Ocean Depths
  "IDFC First Bank": "linear-gradient(to right, #9D2235, #C8102E)", // Crimson Wave
  "Standard Chartered": "linear-gradient(to right, #009A44, #0078B6)", // Tropical Sea
  "AU Small Finance Bank": "linear-gradient(to right, #6C2C92, #FFAA00)", // Royal Sunset
  "Bandhan Bank": "linear-gradient(to right, #E21937, #002D62)", // Patriot Blue
  "Punjab National Bank": "linear-gradient(to right, #231F20, #0077C8)", // Navy Elegance
};

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

// Function to read bin data from file
const readBinData = () => {
  try {
    const data = fs.readFileSync('./src/binData.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading bin data:', err);
    return [];
  }
};

// Generate a random card number starting with BIN
const generateCardNumber = (bin) => {
  let cardNum = String(bin);
  // Generate 10 random digits to complete a 16-digit card number
  const remainingDigits = 16 - cardNum.length;
  for (let i = 0; i < remainingDigits; i++) {
    cardNum += Math.floor(Math.random() * 10);
  }
  return cardNum;
};

// Generate random expiry date (MM/YY format, future date)
const generateExpiry = () => {
  const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of year
  const currentMonth = new Date().getMonth() + 1;
  
  let year = currentYear + Math.floor(Math.random() * 5) + 1; // 1-5 years in the future
  let month = Math.floor(Math.random() * 12) + 1;
  
  // Ensure date is in the future
  if (year === currentYear && month < currentMonth) {
    month = currentMonth;
  }
  
  return `${month.toString().padStart(2, '0')}/${year.toString().padStart(2, '0')}`;
};

// Generate random CVV (3 or 4 digits)
const generateCVV = (network) => {
  // AMEX has 4-digit CVV, others have 3-digit
  const length = network === 'AMEX' ? 4 : 3;
  let cvv = '';
  for (let i = 0; i < length; i++) {
    cvv += Math.floor(Math.random() * 10);
  }
  return cvv;
};

// Card name mappings based on category
const getCardName = (category) => {
  const categoryMappings = {
    'PLATINUM': ['Platinum Edge', 'Platinum Rewards', 'Platinum Select', 'Platinum Travel'],
    'GOLD': ['Gold Rewards', 'Gold Premium', 'Gold Elite'],
    'SIGNATURE': ['Signature', 'Signature Elite', 'Signature Reserve'],
    'INFINITE': ['Infinite', 'Infinite Privilege', 'Infinite World'],
    'CORPORATE': ['Business Corporate', 'Corporate Edge', 'Corporate Elite'],
    'CLASSIC': ['Classic', 'Standard', 'Basic'],
    'REWARDS': ['Rewards Plus', 'Rewards Preferred', 'Premier Rewards'],
    'Rupay SELECT': ['Rupay Select', 'Rupay Premium Select', 'Rupay Elite'],
  };
  
  // If we have specific names for this category, use them
  if (categoryMappings[category]) {
    return categoryMappings[category][Math.floor(Math.random() * categoryMappings[category].length)];
  }
  
  // Otherwise generate a generic name
  const prefixes = ['Premium', 'Preferred', 'Essential', 'Elite', 'Standard', 'Value'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} Card`;
};

// Helper to encrypt data
const encryptData = (data, password) => {
  return CryptoJS.AES.encrypt(data, password).toString();
};

// Get theme for specific bank, or a fallback gradient if not found
const getBankTheme = (bankName) => {
  if (bankThemes[bankName]) {
    return bankThemes[bankName];
  }
  
  // Fallback to a default gradient if bank not found in themes
  const fallbackThemes = [
    "linear-gradient(135deg, #6366F1, #3B82F6)", // Arctic Sky
    "linear-gradient(135deg, #10B981, #059669)", // Forest Mist
    "linear-gradient(135deg, #8B5CF6, #6D28D9)", // Twilight Purple
    "linear-gradient(135deg, #F43F5E, #BE123C)"  // Sunset Rose
  ];
  
  return fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];
};

// Function to get the list of supported banks with logos
const getSupportedBanks = () => {
  try {
    const logosDir = './src/assets/logos';
    const entries = fs.readdirSync(logosDir, { withFileTypes: true });
    
    // Filter to only include directories (which would be bank logos)
    const bankDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    // Map directory names to formal bank names used in the binData
    const bankMappings = {
      'amex': 'AMEX',
      'ausmallfinancebank': 'AU Small Finance Bank',
      'axisbank': 'Axis Bank',
      'bandhanbank': 'Bandhan Bank',
      'bankofbaroda': 'Bank of Baroda',
      'bankofindia': 'BANK OF INDIA',
      'canarabank': 'Canara Bank',
      'centralbankofindia': 'Central Bank of India',
      'cityunionbank': 'City Union Bank',
      'csbbank': 'CSB BANK',
      'dcbbank': 'DCB Bank',
      'dhanlaxmibank': 'Dhanlaxmi Bank',
      'federalbank': 'Federal Bank',
      'hdfcbank': 'HDFC Bank',
      'icicibank': 'ICICI Bank',
      'idbibank': 'IDBI Bank',
      'idfcfirstbank': 'IDFC First Bank',
      'indianbank': 'Indian Bank',
      'indianoverseasbank': 'Indian Overseas Bank',
      'indusindbank': 'IndusInd Bank',
      'jammuandkashmirbank': 'JAMMU & KASHMIR BANK',
      'karurvysyabank': 'Karur Vysya Bank',
      'kotakmahindrabank': 'Kotak Mahindra Bank',
      'punjabnationalbank': 'Punjab National Bank',
      'rblbank': 'RBL Bank',
      'sbi': 'SBI',
      'unionbankofindia': 'Union Bank of India',
      'yesbank': 'Yes Bank'
    };
    
    // Convert directory names to formal bank names
    return bankDirs.map(dir => bankMappings[dir]).filter(Boolean);
  } catch (err) {
    console.error('Error reading logo directories:', err);
    return [];
  }
};

// Main function to add test cards
const addTestCards = async () => {
  const masterPassword = 's'; // Encryption key
  const userId = 'GEFVXaVwmCMp12y8BxKnqUePLhF2'; // User ID
  const cardholder = 'Aswin C';
  
  // Get all bin data
  const binData = readBinData();
  if (!binData || binData.length === 0) {
    console.error('No bin data found. Please check binData.json file.');
    return;
  }
  
  // Get the list of supported banks (those with logos)
  const supportedBanks = getSupportedBanks();
  console.log(`Found ${supportedBanks.length} banks with logos: ${supportedBanks.join(', ')}`);
  
  // Filter binData to only include entries for banks with logos
  const filteredBinData = binData.filter(item => 
    item.Bank && supportedBanks.includes(item.Bank)
  );
  
  // Get one bin for each supported bank
  const uniqueBanks = new Map();
  filteredBinData.forEach(item => {
    if (!uniqueBanks.has(item.Bank)) {
      uniqueBanks.set(item.Bank, item);
    }
  });
  
  const bankEntries = Array.from(uniqueBanks.values());
  console.log(`Found ${bankEntries.length} unique banks with logos. Adding one card from each...`);
  
  // Add each card to Firestore (one per bank)
  for (const binInfo of bankEntries) {
    const cardNumber = generateCardNumber(binInfo.BIN);
    const expiry = generateExpiry();
    const cvv = generateCVV(binInfo.Network);
    const theme = getBankTheme(binInfo.Bank); // Use bank-specific theme
    const cardType = getCardName(binInfo.Category || 'CLASSIC'); // Default to CLASSIC if category is missing
    
    try {
      const encryptedCard = {
        uid: userId,
        cardNumber: encryptData(cardNumber, masterPassword),
        cardHolder: encryptData(cardholder, masterPassword),
        bankName: encryptData(binInfo.Bank, masterPassword),
        networkName: encryptData(binInfo.Network || 'Unknown', masterPassword),
        expiry: encryptData(expiry, masterPassword),
        cvv: encryptData(cvv, masterPassword),
        cardType: cardType,
        theme: encryptData(theme, masterPassword),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'cards'), encryptedCard);
      console.log(`Added card: ${cardType} from ${binInfo.Bank} with number ending in ${cardNumber.slice(-4)}, doc ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error adding card for bank ${binInfo.Bank}:`, error);
    }
  }
  
  console.log(`Completed adding ${bankEntries.length} test cards (one from each bank with logo)`);
};

// Run the function
addTestCards()
  .then(() => console.log('Test cards added successfully!'))
  .catch(error => console.error('Error adding test cards:', error)); 