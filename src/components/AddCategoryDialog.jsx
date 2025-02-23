import { useState } from 'react';
import { 
  FaUtensils, FaShoppingBag, FaPlane, FaFilm, 
  FaShoppingBasket, FaChartLine, FaFileInvoiceDollar, 
  FaSpa, FaPlus, FaTrash, FaCar, FaGraduationCap,
  FaGamepad, FaGift, FaHome, FaPaw, FaHeart, FaBook
} from 'react-icons/fa';

const availableIcons = [
  { icon: FaUtensils, name: 'FaUtensils' },
  { icon: FaShoppingBag, name: 'FaShoppingBag' },
  { icon: FaPlane, name: 'FaPlane' },
  { icon: FaFilm, name: 'FaFilm' },
  { icon: FaShoppingBasket, name: 'FaShoppingBasket' },
  { icon: FaChartLine, name: 'FaChartLine' },
  { icon: FaFileInvoiceDollar, name: 'FaFileInvoiceDollar' },
  { icon: FaSpa, name: 'FaSpa' },
  { icon: FaCar, name: 'FaCar' },
  { icon: FaGraduationCap, name: 'FaGraduationCap' },
  { icon: FaGamepad, name: 'FaGamepad' },
  { icon: FaGift, name: 'FaGift' },
  { icon: FaHome, name: 'FaHome' },
  { icon: FaPaw, name: 'FaPaw' },
  { icon: FaHeart, name: 'FaHeart' },
  { icon: FaBook, name: 'FaBook' }
];

export default function AddCategoryDialog({ isOpen, onClose, onSave }) {
  const [categoryName, setCategoryName] = useState('');
  const [selectedIconObj, setSelectedIconObj] = useState(null);
  const [merchants, setMerchants] = useState(['']);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    
    if (!categoryName) {
      setError('Please enter a category name');
      return;
    }
    
    if (!selectedIconObj) {
      setError('Please select an icon');
      return;
    }
    
    onSave({
      name: categoryName,
      icon: selectedIconObj.icon,
      iconName: selectedIconObj.name,
      merchants: merchants.filter(m => m.trim() !== '')
    });
    
    setCategoryName('');
    setSelectedIconObj(null);
    setMerchants(['']);
    setError('');
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    } transition-opacity`}>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Add New Category</h2>
        
        <input
          type="text"
          placeholder="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="w-full bg-white/10 rounded-lg p-3 text-white mb-4"
        />

        <p className="text-white/60 text-sm mb-2">Select an icon:</p>
        <div className="grid grid-cols-6 gap-2 mb-4">
          {availableIcons.map((iconObj) => (
            <button
              key={iconObj.name}
              onClick={() => setSelectedIconObj(iconObj)}
              className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                selectedIconObj?.name === iconObj.name 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
              }`}
            >
              <iconObj.icon className="text-xl" />
            </button>
          ))}
        </div>

        <p className="text-white/60 text-sm mb-2">Add merchants:</p>
        <div className="space-y-2 mb-4">
          {merchants.map((merchant, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Merchant Name"
                value={merchant}
                onChange={(e) => {
                  const newMerchants = [...merchants];
                  newMerchants[index] = e.target.value;
                  setMerchants(newMerchants);
                }}
                className="flex-1 bg-white/10 rounded-lg p-2 text-white"
              />
              {index === merchants.length - 1 ? (
                <button
                  onClick={() => setMerchants([...merchants, ''])}
                  className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                  <FaPlus />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const newMerchants = merchants.filter((_, i) => i !== index);
                    setMerchants(newMerchants);
                  }}
                  className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30"
          >
            Save Category
          </button>
        </div>
      </div>
    </div>
  );
} 