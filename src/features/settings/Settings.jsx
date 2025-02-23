import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import CryptoJS from "crypto-js";
import Dialog from '../../components/Dialog';
import { BiCog } from 'react-icons/bi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SuccessAnimation } from '../../components/SuccessAnimation';

function Settings({ user, masterPassword }) {
  const { themes, currentTheme, setCurrentTheme, currentThemeData } = useTheme();
  const [showDeleteCards, setShowDeleteCards] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'default'
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadCards = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "cards"),
        where("uid", "==", user.uid)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setCards([]);
        return;
      }

      let cardsData = snapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            cardType: CryptoJS.AES.decrypt(doc.data().cardType, masterPassword).toString(CryptoJS.enc.Utf8),
            bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
            cardNumber: CryptoJS.AES.decrypt(doc.data().cardNumber, masterPassword).toString(CryptoJS.enc.Utf8),
            priority: doc.data().priority,
            createdAt: doc.data().createdAt
          };
        } catch (error) {
          console.error('Error decrypting card:', error);
          return null;
        }
      }).filter(Boolean);

      // Sort with fallbacks
      cardsData.sort((a, b) => {
        if (a.priority !== undefined && b.priority !== undefined) {
          return a.priority - b.priority;
        }
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return a.cardType.localeCompare(b.cardType);
      });
      
      setCards(cardsData);
    } catch (error) {
      console.error('Error loading cards:', error);
      setDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load cards. Using default order.',
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

  const handleDeleteCard = (cardId, cardType, bankName) => {
    setDialog({
      isOpen: true,
      title: 'Delete Card',
      message: `Are you sure you want to delete ${cardType} (${bankName})? This action cannot be undone.`,
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
          
          // Use SuccessAnimation instead of dialog
          handleSuccess('Card deleted successfully!');
          closeDialog(); // Ensure dialog closes after success
        } catch (error) {
          console.error('Error deleting card:', error);
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
          console.error('Error during refresh:', error);
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
      
      handleSuccess('Card order updated successfully!');
    } catch (error) {
      console.error('Error saving card order:', error);
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
              {loading ? (
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
                        <p className="text-white font-medium">{card.cardType}</p>
                        <p className="text-sm text-white/70">
                          {card.bankName} •••• {card.cardNumber.slice(-4)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCard(card.id, card.cardType, card.bankName)}
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
                    onClick={() => setCurrentTheme(key)}
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
                          <p className="text-white font-medium">{card.cardType}</p>
                          <p className="text-sm text-white/70">
                            {card.bankName} •••• {card.cardNumber.slice(-4)}
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
      
      {reorderLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-md">
          <div className="flex flex-col items-center gap-8">
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
              <LoadingSpinner size="lg" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xl font-medium text-white">Updating card order</p>
              <p className="text-white/70 animate-pulse">Please wait...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings; 