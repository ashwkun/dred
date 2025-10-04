import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, writeBatch, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Dialog from '../../components/Dialog';
import { BiCog } from 'react-icons/bi';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { SuccessAnimation } from '../../components/SuccessAnimation';
import { securityManager } from '../../utils/security';
import { usePartialDecrypt } from '../../hooks/usePartialDecrypt';
import { toSafeString } from '../../utils/securePlaintextHelpers';
import { secureWipeArray } from '../../utils/secureCleanup';
import { secureLog } from '../../utils/secureLogger';

function Settings({ user, masterPassword, showSuccessMessage, cards: encryptedCards = [], setActivePage }) {
  const { 
    themes, 
    currentTheme, 
    setCurrentTheme, 
    currentThemeData, 
    customizations: themeCustomizations, 
    customizeThemeElement: updateThemeElement, 
    resetCustomizations: resetThemeCustomizations 
  } = useTheme();
  const [showDeleteCards, setShowDeleteCards] = useState(false);
  const [showEditCards, setShowEditCards] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editForm, setEditForm] = useState({
    cardHolder: '',
    expiry: '',
    cvv: '',
    theme: '',
    cardName: '',
    cardNumber: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'default'
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showMixMatch, setShowMixMatch] = useState(false);

  // 🔐 TIERED SECURITY: Partial decryption (metadata + last 4 only)
  const { partialCards, isDecrypting } = usePartialDecrypt(encryptedCards, masterPassword);

  // Cleanup when Delete Cards section collapses
  useEffect(() => {
    if (!showDeleteCards && cards.length > 0) {
      secureLog.debug('Settings: Cleaning up cards data (Delete section collapsed)');
      secureWipeArray(cards);
      setCards([]);
    }
  }, [showDeleteCards]);

  // Cleanup when Reorder section collapses
  useEffect(() => {
    if (!showReorder && cards.length > 0) {
      secureLog.debug('Settings: Cleaning up cards data (Reorder section collapsed)');
      secureWipeArray(cards);
      setCards([]);
    }
  }, [showReorder]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      secureLog.debug('Settings: Cleaning up on unmount');
      secureWipeArray(cards);
      setCards([]);
    };
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      // Use partial-decrypted cards from hook (metadata + last 4)
      let cardsData = Array.isArray(partialCards) ? [...partialCards] : [];

      // Sort with fallbacks
      cardsData.sort((a, b) => {
        if (a.priority !== undefined && b.priority !== undefined) {
          return a.priority - b.priority;
        }
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return (a.cardName || 'Card').localeCompare(b.cardName || 'Card');
      });
      
      setCards(cardsData);
    } catch (error) {
      secureLog.error('Error preparing cards from pre-decrypted list:', error);
      setDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to prepare cards list.',
        type: 'warning',
        onConfirm: closeDialog
      });
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteCard = (cardId, cardName, bankName) => {
    setDialog({
      isOpen: true,
      title: 'Delete Card',
      message: `Are you sure you want to delete ${cardName} (${bankName})? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // First verify ownership
          const cardRef = doc(db, "cards", cardId);
          const cardDoc = await getDoc(cardRef);
          
          if (!cardDoc.exists()) {
            throw new Error("Card not found");
          }
          
          if (cardDoc.data().uid !== user.uid) {
            throw new Error("You don't have permission to delete this card");
          }

          // Then delete
          await deleteDoc(cardRef);
          setCards(cards.filter(card => card.id !== cardId));
          
          // Use the global success message
          showSuccessMessage('Card deleted successfully!');
          closeDialog(); // Ensure dialog closes after success
        } catch (error) {
          secureLog.error('Error deleting card:', error);
          setDialog({
            isOpen: true,
            title: 'Error',
            message: error.message || 'Failed to delete card. Please try again.',
            type: 'danger',
            onConfirm: closeDialog
          });
        }
      },
      type: 'danger'
    });
  };

  const handleForceRefresh = () => {
    setDialog({
      isOpen: true,
      title: 'Force Refresh',
      message: 'This will clear all cached data and force the app to reload everything from the server. Continue?',
      onConfirm: async () => {
        setRefreshing(true);
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
          
          const themePreference = localStorage.getItem('dred-theme');
          localStorage.clear();
          if (themePreference) localStorage.setItem('dred-theme', themePreference);

          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
          }

          window.location.reload(true);
        } catch (error) {
          secureLog.error('Error during refresh:', error);
          setDialog({
            isOpen: true,
            title: 'Error',
            message: 'Failed to refresh. Please try again.',
            type: 'danger',
            onConfirm: closeDialog
          });
          setRefreshing(false);
        }
      },
      type: 'danger'
    });
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData('text/plain'));
    
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;

    setCards(prevCards => {
      const newCards = [...prevCards];
      const [draggedCard] = newCards.splice(dragIndex, 1);
      newCards.splice(dropIndex, 0, draggedCard);
      return newCards;
    });
  };

  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const saveCardOrder = async () => {
    setReorderLoading(true);
    
    try {
      const batch = writeBatch(db);
      
      // Update each card's priority
      for (let i = 0; i < cards.length; i++) {
        const cardRef = doc(db, "cards", cards[i].id);
        batch.update(cardRef, { priority: i });
      }
      
      await batch.commit();
      
      // Use the global success message
      showSuccessMessage('Card order updated successfully!');
    } catch (error) {
      secureLog.error('Error saving card order:', error);
      setDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save card order. Please try again.',
        type: 'danger',
        onConfirm: closeDialog
      });
    } finally {
      setReorderLoading(false);
    }
  };

  const handleCustomizeElement = (element, value) => {
    updateThemeElement(element, value);
    showSuccessMessage(`${element.charAt(0).toUpperCase() + element.slice(1)} updated`);
  };

  const handleResetCustomizations = () => {
    resetThemeCustomizations();
    showSuccessMessage('All customizations reset');
  };

  // Edit card functions
  const handleEditCardClick = async (card) => {
    try {
      // Decrypt theme if it's encrypted
      let decryptedTheme = card.theme;
      if (typeof card.theme === 'string' && card.theme.startsWith('v3:')) {
        decryptedTheme = await securityManager.decryptData(card.theme, masterPassword);
      }

      // Decrypt card number for editing
      // Prefer split fields: decrypt first-digits (SecurePlaintext) + append last4
      // Fallback: if only cardNumberFull exists, decrypt full and format
      let fullCardNumber = '';
      try {
        if (card.cardNumberFirst && card.cardNumberLast4) {
          const decryptedFirstSecure = await securityManager.decryptData(card.cardNumberFirst, masterPassword, true);
          const decryptedLast4Secure = await securityManager.decryptData(card.cardNumberLast4, masterPassword, true);
          const decryptedFirst = toSafeString(decryptedFirstSecure, '');
          const decryptedLast4 = toSafeString(decryptedLast4Secure, '');
          if (decryptedFirstSecure && decryptedFirstSecure.zero) decryptedFirstSecure.zero();
          if (decryptedLast4Secure && decryptedLast4Secure.zero) decryptedLast4Secure.zero();
          fullCardNumber = (decryptedFirst + decryptedLast4).replace(/(\d{4})/g, '$1 ').trim();
        } else if (card.cardNumberFull) {
          const fullSecure = await securityManager.decryptData(card.cardNumberFull, masterPassword, true);
          const full = toSafeString(fullSecure, '');
          if (fullSecure && fullSecure.zero) fullSecure.zero();
          fullCardNumber = full.replace(/(\d{4})/g, '$1 ').trim();
        } else {
          fullCardNumber = '';
        }
      } catch (decryptError) {
        secureLog.warn('Could not decrypt card number, using placeholder:', decryptError);
        fullCardNumber = '';
      }

      // Decrypt only the fields that are still encrypted (cvv and expiry) using SecurePlaintext
      // partialCards already has: cardName, bankName, cardHolder, cardNumberLast4 decrypted
      const decryptedExpirySecure = await securityManager.decryptData(card.expiry, masterPassword);
      const decryptedCvvSecure = await securityManager.decryptData(card.cvv, masterPassword, true);
      
      const decryptedExpiry = toSafeString(decryptedExpirySecure, '');
      const decryptedCvv = toSafeString(decryptedCvvSecure, '');
      
      // Zero CVV after extracting string
      if (decryptedCvvSecure && decryptedCvvSecure.zero) {
        decryptedCvvSecure.zero();
      }

      setEditingCard(card); // card already has decrypted metadata from partialCards
      setEditForm({
        cardHolder: card.cardHolder, // Already decrypted by partialDecrypt
        expiry: decryptedExpiry, // Still encrypted, needs decryption
        cvv: decryptedCvv, // Still encrypted, needs decryption
        theme: decryptedTheme || '#6a3de8',
        cardName: card.cardName, // Already decrypted by partialDecrypt
        cardNumber: fullCardNumber
      });
    } catch (error) {
       secureLog.error('Error preparing card for edit:', error);
      setDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load card details. Please try again.',
        type: 'danger',
        onConfirm: closeDialog
      });
    }
  };

  const handleUpdateCard = async () => {
    setEditLoading(true);
    try {
      // Validate card number
      const cleanCardNumber = editForm.cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cleanCardNumber)) {
        throw new Error("Please enter a valid card number (13-19 digits)");
      }

      // Validate expiry format (MM/YY)
      if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(editForm.expiry)) {
        throw new Error("Please enter expiry in MM/YY format");
      }

      // Validate CVV format (3-4 digits)
      if (!/^\d{3,4}$/.test(editForm.cvv)) {
        throw new Error("Please enter a valid 3 or 4 digit CVV");
      }

      // Validate card holder name
      if (!editForm.cardHolder || editForm.cardHolder.trim().length < 2) {
        throw new Error("Please enter a valid card holder name");
      }

      // Split card number into first digits and last 4
      const cardNumberFirst = cleanCardNumber.slice(0, -4);
      const cardNumberLast4 = cleanCardNumber.slice(-4);

      // Prepare update data - re-encrypt sensitive fields (use split storage)
      const updateData = {
        cardHolder: await securityManager.encryptData(editForm.cardHolder, masterPassword),
        expiry: await securityManager.encryptData(editForm.expiry, masterPassword),
        cvv: await securityManager.encryptData(editForm.cvv, masterPassword),
        cardName: await securityManager.encryptData(editForm.cardName, masterPassword),
        cardNumberFirst: await securityManager.encryptData(cardNumberFirst, masterPassword),
        cardNumberLast4: await securityManager.encryptData(cardNumberLast4, masterPassword),
        theme: editForm.theme, // Plain text, not encrypted
        updatedAt: serverTimestamp()
      };

      // Update in Firestore
      const cardRef = doc(db, "cards", editingCard.id);
      await updateDoc(cardRef, updateData);

      // Update local state
      setCards(cards.map(card => 
        card.id === editingCard.id 
          ? { ...card, ...editForm }
          : card
      ));

      showSuccessMessage('Card updated successfully!');
      setEditingCard(null);
      setEditForm({
        cardHolder: '',
        expiry: '',
        cvv: '',
        theme: '',
        cardName: '',
        cardNumber: ''
      });
    } catch (error) {
      secureLog.error('Error updating card:', error);
      setDialog({
        isOpen: true,
        title: 'Update Failed',
        message: error.message || 'Failed to update card. Please try again.',
        type: 'danger',
        onConfirm: closeDialog
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditForm({
      cardHolder: '',
      expiry: '',
      cvv: '',
      theme: '',
      cardName: ''
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
          <BiCog className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-white/60">Customize your app preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Delete Cards Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <button
            onClick={() => {
              setShowDeleteCards(!showDeleteCards);
              if (!showDeleteCards) loadCards();
            }}
            className="w-full p-6 text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-medium text-white">Delete Cards</h3>
              <p className="text-sm text-white/70">Manage your saved cards</p>
            </div>
            <svg
              className={`w-6 h-6 text-white/70 transition-transform ${showDeleteCards ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDeleteCards && (
            <div className="px-6 pb-6">
              {(loading || isDecrypting) ? (
                <div className="text-white/70 text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full mx-auto mb-2"></div>
                  Loading cards...
                </div>
              ) : cards.length === 0 ? (
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 text-center">
                  <p className="text-white/70">No saved cards found</p>
                  <button 
                    onClick={() => setActivePage("addCard")}
                    className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                  >
                    Add a Card
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map(card => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div>
                        <p className="text-white font-medium">{card.cardName}</p>
                        <p className="text-sm text-white/70">
                          {card.bankName} •••• {card.cardNumberLast4Display || card.cardNumberLast4}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCard(card.id, card.cardName, card.bankName)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Cards Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <button
            onClick={() => {
              setShowEditCards(!showEditCards);
              if (!showEditCards) loadCards();
            }}
            className="w-full p-6 text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-medium text-white">Edit Cards</h3>
              <p className="text-sm text-white/70">Update card details</p>
            </div>
            <svg
              className={`w-6 h-6 text-white/70 transition-transform ${showEditCards ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showEditCards && (
            <div className="px-6 pb-6">
              {(loading || isDecrypting) ? (
                <div className="text-white/70 text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full mx-auto mb-2"></div>
                  Loading cards...
                </div>
              ) : cards.length === 0 ? (
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 text-center">
                  <p className="text-white/70">No saved cards found</p>
                  <button 
                    onClick={() => setActivePage("addCard")}
                    className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                  >
                    Add a Card
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map(card => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div>
                        <p className="text-white font-medium">{card.cardName}</p>
                        <p className="text-sm text-white/70">
                          {card.bankName} •••• {card.cardNumberLast4Display || card.cardNumberLast4}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditCardClick(card)}
                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Edit card"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Selection */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="w-full p-6 text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-medium text-white">App Theme</h3>
              <p className="text-sm text-white/70">Customize app appearance</p>
            </div>
            <svg
              className={`w-6 h-6 text-white/70 transition-transform ${showThemes ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showThemes && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setCurrentTheme(key);
                      showSuccessMessage(`Theme changed to ${theme.name}`);
                    }}
                    className={`p-4 rounded-xl border transition-all ${
                      currentTheme === key
                        ? `border-${currentThemeData.accent}/40 bg-${currentThemeData.accent}/20`
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`h-20 rounded-lg bg-gradient-to-br ${theme.gradient} mb-3`} />
                    <p className="text-white font-medium">{theme.name}</p>
                    <p className="text-sm text-white/70">{theme.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mix & Match Theme Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <button
            onClick={() => setShowMixMatch(!showMixMatch)}
            className="w-full p-6 text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-medium text-white">Mix & Match Theme</h3>
              <p className="text-sm text-white/70">Customize individual theme elements</p>
            </div>
            <svg
              className={`w-6 h-6 text-white/70 transition-transform ${showMixMatch ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMixMatch && (
            <div className="px-6 pb-6 space-y-6">
              {/* Font Families */}
              <div>
                <h4 className="text-white/80 font-medium mb-3">Typography</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from(new Set(Object.values(themes).map(theme => theme.font.family))).map((fontFamily, index) => {
                    const fontName = fontFamily.split("'")[1] || "Default";
                    const isActive = themeCustomizations.fontFamily === fontName;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          handleCustomizeElement('fontFamily', fontName);
                          showSuccessMessage(`Font updated to ${fontName}`);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isActive 
                            ? `border-${currentThemeData.accent}/40 bg-${currentThemeData.accent}/20` 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className={`text-white font-medium ${fontFamily}`}>{fontName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <h4 className="text-white/80 font-medium mb-3">Border Radius</h4>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from(new Set(Object.values(themes).map(theme => theme.radius))).map((radius, index) => {
                    const radiusName = radius.replace('rounded-', '');
                    const isActive = themeCustomizations.radius === radius;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          handleCustomizeElement('radius', radius);
                          showSuccessMessage(`Border radius updated`);
                        }}
                        className={`p-3 flex flex-col items-center justify-center transition-all ${
                          isActive 
                            ? `border-${currentThemeData.accent}/40 bg-${currentThemeData.accent}/20` 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                        style={{ borderRadius: radiusName === 'none' ? '0' : radiusName === 'sm' ? '0.125rem' : radiusName === 'md' ? '0.375rem' : radiusName === 'lg' ? '0.5rem' : radiusName === 'xl' ? '0.75rem' : radiusName === '2xl' ? '1rem' : '0.25rem' }}
                      >
                        <div 
                          className={`w-10 h-10 bg-white/20 mb-2`}
                          style={{ borderRadius: radiusName === 'none' ? '0' : radiusName === 'sm' ? '0.125rem' : radiusName === 'md' ? '0.375rem' : radiusName === 'lg' ? '0.5rem' : radiusName === 'xl' ? '0.75rem' : radiusName === '2xl' ? '1rem' : '0.25rem' }}
                        ></div>
                        <span className="text-white/80 text-xs">{radiusName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Background Patterns */}
              <div>
                <h4 className="text-white/80 font-medium mb-3">Background Pattern</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from(new Set(Object.values(themes).map(theme => theme.pattern.type))).map((patternType, index) => {
                    const isActive = themeCustomizations.pattern === patternType;
                    const patternName = patternType === 'none' ? 'None' : patternType.charAt(0).toUpperCase() + patternType.slice(1);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          handleCustomizeElement('pattern', patternType);
                          showSuccessMessage(`Pattern updated to ${patternName}`);
                        }}
                        className={`p-3 rounded-lg border transition-all ${
                          isActive 
                            ? `border-${currentThemeData.accent}/40 bg-${currentThemeData.accent}/20` 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`h-14 rounded-lg border border-white/20 mb-2 flex items-center justify-center bg-gradient-to-br ${currentThemeData.gradient}`}>
                          {patternType === 'none' ? (
                            <span className="text-white/40 text-sm">No Pattern</span>
                          ) : (
                            <div className={`w-full h-full rounded-lg`} style={{ backgroundImage: `url("/patterns/${patternType}.svg")`, backgroundSize: 'cover', opacity: 0.2 }}></div>
                          )}
                        </div>
                        <p className="text-white text-sm">{patternName}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Card Styles */}
              <div>
                <h4 className="text-white/80 font-medium mb-3">Card Style</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from(new Set(Object.values(themes).map(theme => theme.cardStyle))).map((cardStyle, index) => {
                    const isActive = themeCustomizations.cardStyle === cardStyle;
                    const cardStyleName = cardStyle.charAt(0).toUpperCase() + cardStyle.slice(1);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          handleCustomizeElement('cardStyle', cardStyle);
                          showSuccessMessage(`Card style updated to ${cardStyleName}`);
                        }}
                        className={`p-3 rounded-lg border transition-all ${
                          isActive 
                            ? `border-${currentThemeData.accent}/40 bg-${currentThemeData.accent}/20` 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`h-20 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${currentThemeData.gradient} opacity-40`}></div>
                          {cardStyle === 'classic' && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                          )}
                          {cardStyle === 'glass' && (
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>
                          )}
                          {cardStyle === 'flat' && (
                            <div className="absolute inset-0 bg-black/40"></div>
                          )}
                          {cardStyle === 'gradient' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/20"></div>
                          )}
                          {cardStyle === 'bordered' && (
                            <div className="absolute inset-0 border-2 border-white/30 bg-black/20"></div>
                          )}
                          {cardStyle === 'minimal' && (
                            <div className="absolute inset-0 bg-black/30 border border-white/10"></div>
                          )}
                          {cardStyle === 'neon' && (
                            <div className="absolute inset-0 bg-black/50 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                          )}
                          {cardStyle === 'modern' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40"></div>
                          )}
                          <span className="text-white relative">{cardStyleName}</span>
                        </div>
                        <p className="text-white text-sm">{cardStyleName}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Reset Button */}
              <button
                onClick={() => {
                  handleResetCustomizations();
                  showSuccessMessage('All customizations reset');
                }}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg text-white transition-colors"
              >
                Reset to Theme Defaults
              </button>
            </div>
          )}
        </div>

        {/* Force Refresh Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <button
            onClick={() => setShowRefresh(!showRefresh)}
            className="w-full p-6 text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-medium text-white">Force Refresh</h3>
              <p className="text-sm text-white/70">Clear cache and reload app</p>
            </div>
            <svg
              className={`w-6 h-6 text-white/70 transition-transform ${showRefresh ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showRefresh && (
            <div className="px-6 pb-6">
              <div className="bg-white/5 rounded-lg border border-white/10 p-4 mb-4">
                <p className="text-white/90 text-sm">
                  This will clear all cached data and force the app to reload everything from the server. 
                  Use this if you're experiencing any issues or want to ensure you have the latest version.
                </p>
              </div>
              <button
                onClick={handleForceRefresh}
                disabled={refreshing}
                className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 
                  ${refreshing 
                    ? 'bg-white/10 cursor-not-allowed' 
                    : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30'
                  } transition-colors`}
              >
                <svg 
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                <span className="text-white font-medium">
                  {refreshing ? 'Refreshing...' : 'Force Refresh App'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Reorder Cards Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <button
            onClick={() => {
              setShowReorder(!showReorder);
              if (!showReorder) loadCards();
            }}
            className="w-full p-6 text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-medium text-white">Reorder Cards</h3>
              <p className="text-sm text-white/70">Change the display order of your cards</p>
            </div>
            <svg
              className={`w-6 h-6 text-white/70 transition-transform ${showReorder ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showReorder && (
            <div className="px-6 pb-6">
              {loading ? (
                <div className="text-white/70 text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full mx-auto mb-2"></div>
                  Loading cards...
                </div>
              ) : cards.length === 0 ? (
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 text-center">
                  <p className="text-white/70">No cards to reorder</p>
                </div>
              ) : (
                <>
                  {cards.map((card, index) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="bg-white/5 rounded-lg border border-white/10 p-4 flex items-center justify-between mb-2 
                        hover:bg-white/10 transition-colors cursor-move"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{card.cardName}</p>
                          <p className="text-sm text-white/70">
                            {card.bankName} •••• {card.cardNumberLast4Display || '••••'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-white/40">Drag to reorder</div>
                    </div>
                  ))}
                  <button
                    onClick={saveCardOrder}
                    disabled={reorderLoading}
                    className={`w-full mt-4 px-4 py-3 rounded-lg flex items-center justify-center gap-2 
                      ${reorderLoading 
                        ? 'bg-white/10 cursor-not-allowed' 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20'
                      } transition-colors`}
                  >
                    {reorderLoading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                        <span className="text-white font-medium">
                          Saving...
                        </span>
                      </>
                    ) : (
                      <span className="text-white font-medium">Save Order</span>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="p-6 relative z-10 border-b border-white/10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Edit Card Details</h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-white/70">
                {editingCard.bankName} •••• {editingCard.cardNumberLast4Display || editingCard.cardNumberLast4 || '••••'}
              </p>
            </div>

            {/* Form */}
            <div className="p-6 relative z-10 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Card Holder Name */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                    text-white placeholder-white/30 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/30 focus:border-transparent backdrop-blur-sm
                    transition-all duration-200"
                  value={editForm.cardHolder}
                  onChange={(e) => setEditForm({ ...editForm, cardHolder: e.target.value })}
                  placeholder="Name on card"
                />
              </div>

              {/* Card Name */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Card Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                    text-white placeholder-white/30 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/30 focus:border-transparent backdrop-blur-sm
                    transition-all duration-200"
                  value={editForm.cardName}
                  onChange={(e) => setEditForm({ ...editForm, cardName: e.target.value })}
                  placeholder="Platinum, TATA Neu, My Zone etc"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                    text-white placeholder-white/30 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/30 focus:border-transparent backdrop-blur-sm
                    transition-all duration-200 font-mono"
                  value={editForm.cardNumber}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                    if (value.length > 16) value = value.slice(0, 16);
                    // Format with spaces every 4 digits
                    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                    setEditForm({ ...editForm, cardNumber: formatted });
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Expiry Date (MM/YY)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                    text-white placeholder-white/30 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/30 focus:border-transparent backdrop-blur-sm
                    transition-all duration-200"
                  value={editForm.expiry}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setEditForm({ ...editForm, expiry: value });
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>

              {/* CVV */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                    text-white placeholder-white/30 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/30 focus:border-transparent backdrop-blur-sm
                    transition-all duration-200"
                  value={editForm.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setEditForm({ ...editForm, cvv: value });
                  }}
                  placeholder="CVV"
                  maxLength={4}
                />
              </div>

              {/* Theme Color */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Card Theme
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['#6a3de8', '#e8453d', '#3de85c', '#e8d53d', '#3d8ee8', '#e83da8', '#3de8d5', '#ff6b35'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditForm({ ...editForm, theme: color })}
                      className={`w-10 h-10 rounded-full transition-all ${
                        editForm.theme === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 relative z-10 flex">
              <button
                onClick={handleCancelEdit}
                disabled={editLoading}
                className="flex-1 px-4 py-3.5 text-sm font-medium text-white/80
                  hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCard}
                disabled={editLoading}
                className="flex-1 px-4 py-3.5 text-sm font-medium transition-all shadow-sm
                  bg-gradient-to-r from-indigo-500/30 to-purple-600/30 hover:from-indigo-500/40 
                  hover:to-purple-600/40 text-white border-l border-white/10 disabled:opacity-50
                  disabled:cursor-not-allowed"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Component */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />

      {showSuccess && <SuccessAnimation message={successMessage} />}
      
      {reorderLoading && <LoadingOverlay message="Updating card order" />}
      {editLoading && <LoadingOverlay message="Updating card details" />}
    </div>
  );
}

export default Settings; 