import React, { useState, useEffect } from 'react';
import { BiChevronLeft, BiCheck } from 'react-icons/bi';
import binData from '../../binData.json';
import LogoWithFallback from '../../LogoWithFallback';
import { cardThemes } from '../../cardThemes';

export default function CardCustomization({ onBack, onSubmit, cardNumber, loading }) {
  const [customization, setCustomization] = useState({
    bankName: '',
    networkName: '',
    cardType: '',
    theme: 'default'
  });
  const [selectedBank, setSelectedBank] = useState(null);
  const [error, setError] = useState('');

  // Detect card network and bank from card number
  useEffect(() => {
    const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
    const cardInfo = binData.find(item => item.bin === bin);

    if (cardInfo) {
      setCustomization(prev => ({
        ...prev,
        networkName: cardInfo.network,
        bankName: cardInfo.bank
      }));
      
      // Find bank in supported banks list
      const bank = supportedBanks.find(b => 
        b.name.toLowerCase() === cardInfo.bank.toLowerCase()
      );
      if (bank) setSelectedBank(bank);
    }
  }, [cardNumber]);

  const supportedBanks = [
    { name: 'HDFC Bank', id: 'hdfcbank' },
    { name: 'ICICI Bank', id: 'icicibank' },
    { name: 'Axis Bank', id: 'axisbank' },
    { name: 'SBI', id: 'sbi' },
    { name: 'IDFC First Bank', id: 'idfcfirstbank' },
    { name: 'Kotak Mahindra Bank', id: 'kotakmahindrabank' },
    // Add more banks as needed
  ];

  const cardTypes = [
    'Credit Card',
    'Debit Card',
    'Business Credit Card',
    'Corporate Card'
  ];

  const handleSubmit = () => {
    if (!customization.bankName) {
      setError('Please select a bank');
      return;
    }
    if (!customization.cardType) {
      setError('Please select a card type');
      return;
    }
    onSubmit(customization);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between text-white mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
        >
          <BiChevronLeft className="text-xl" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Customize Your Card</h1>
        <div className="w-16" /> {/* Spacer for alignment */}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Card Preview */}
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-4">Card Preview</h2>
            
            <div className={`aspect-[1.586/1] rounded-xl overflow-hidden relative ${cardThemes[customization.theme]}`}>
              {selectedBank && (
                <div className="absolute top-4 left-4">
                  <LogoWithFallback 
                    bankId={selectedBank.id}
                    type="symbol"
                    className="h-8 w-8"
                  />
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-white/70 text-xs mb-1">
                  {customization.cardType || 'Card Type'}
                </div>
                <div className="font-mono text-white text-lg mb-2">
                  •••• •••• •••• {cardNumber.slice(-4)}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {selectedBank && (
                      <LogoWithFallback 
                        bankId={selectedBank.id}
                        type="logo"
                        className="h-6"
                      />
                    )}
                  </div>
                  {customization.networkName && (
                    <img 
                      src={`/logos/${customization.networkName.toLowerCase()}.svg`}
                      alt={customization.networkName}
                      className="h-6"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customization Options */}
        <div className="space-y-4">
          {/* Bank Selection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-4">Select Bank</h2>
            <div className="grid grid-cols-2 gap-3">
              {supportedBanks.map(bank => (
                <button
                  key={bank.id}
                  onClick={() => {
                    setSelectedBank(bank);
                    setCustomization(prev => ({ ...prev, bankName: bank.name }));
                    setError('');
                  }}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all
                    ${selectedBank?.id === bank.id 
                      ? 'bg-white/20 border-white/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <LogoWithFallback 
                    bankId={bank.id}
                    type="symbol"
                    className="h-6 w-6"
                  />
                  <span className="text-sm text-white font-medium truncate">
                    {bank.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Type Selection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-4">Card Type</h2>
            <div className="grid grid-cols-2 gap-3">
              {cardTypes.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setCustomization(prev => ({ ...prev, cardType: type }));
                    setError('');
                  }}
                  className={`p-3 rounded-xl border transition-all text-left
                    ${customization.cardType === type 
                      ? 'bg-white/20 border-white/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <span className="text-sm text-white font-medium">
                    {type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-4">Card Theme</h2>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(cardThemes).map(([name, theme]) => (
                <button
                  key={name}
                  onClick={() => setCustomization(prev => ({ ...prev, theme: name }))}
                  className={`aspect-square rounded-xl border transition-all ${theme}
                    ${customization.theme === name 
                      ? 'border-white ring-2 ring-white/30' 
                      : 'border-white/10 hover:border-white/30'
                    }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 
              rounded-xl text-white font-medium transition-all flex items-center 
              justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                <span>Adding Card...</span>
              </>
            ) : (
              <>
                <BiCheck className="text-xl" />
                <span>Add Card</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
