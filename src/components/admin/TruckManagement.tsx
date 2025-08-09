import React, { useEffect, useState } from 'react';
import { ref, get, push, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import { Truck } from '../../types';
import { Plus, Trash2, Truck as TruckIcon } from 'lucide-react';
import { generateQRCode } from '../../utils/qrGenerator';

const TruckManagement: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [name, setName] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [capacity, setCapacity] = useState<number>(50);
  const [qrImages, setQrImages] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    fetchTrucks();
  }, []);

  useEffect(() => {
    const fetchQRCodes = async () => {
      const images: { [id: string]: string } = {};
      for (const truck of trucks) {
        if (truck.qrCode) {
          images[truck.id] = await generateQRCode(truck.qrCode);
        }
      }
      setQrImages(images);
    };
    fetchQRCodes();
  }, [trucks]);

  const fetchTrucks = async () => {
    try {
      const trucksRef = ref(db, 'trucks');
      const snapshot = await get(trucksRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTrucks(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setTrucks([]);
      }
    } catch (error) {
      console.error('Error fetching trucks:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qrCode || !capacity) return;
    
    try {
      const newRef = push(ref(db, 'trucks'));
      await set(newRef, { 
        name, 
        qrCode, 
        capacity: capacity 
      });
      setName('');
      setQrCode('');
      setCapacity(50);
      fetchTrucks();
      alert('Tır başarıyla eklendi!');
    } catch (error) {
      console.error('Error adding truck:', error);
      alert('Tır eklenirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: string, truckName: string) => {
    if (window.confirm(`"${truckName}" tırını silmek istediğinizden emin misiniz?`)) {
      try {
        await remove(ref(db, `trucks/${id}`));
        fetchTrucks();
        alert('Tır başarıyla silindi!');
      } catch (error) {
        console.error('Error deleting truck:', error);
        alert('Tır silinirken bir hata oluştu.');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TruckIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Tır Yönetimi</h2>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Yeni Tır Ekle</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tır Adı/Plaka *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Örn: 34 ABC 123"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Kodu *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Örn: TIR_001"
                value={qrCode}
                onChange={e => setQrCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapasite (Palet) *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Örn: 50"
                value={capacity}
                onChange={e => setCapacity(parseInt(e.target.value) || 50)}
                required
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Tır Ekle
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trucks.map(truck => (
          <div key={truck.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <TruckIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{truck.name}</h3>
                  <p className="text-sm text-gray-500">QR: {truck.qrCode}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(truck.id, truck.name)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                title="Tırı Sil"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Kapasite:</span>
                <span className="text-lg font-bold text-blue-600">{truck.capacity || 0} palet</span>
              </div>
              
              {qrImages[truck.id] && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">QR Kod:</p>
                  <img 
                    src={qrImages[truck.id]} 
                    alt={`${truck.name} QR`} 
                    className="w-20 h-20 mx-auto border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {trucks.length === 0 && (
        <div className="text-center py-12">
          <TruckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz tır yok</h3>
          <p className="text-gray-500">İlk tırınızı eklemek için yukarıdaki formu kullanın.</p>
        </div>
      )}
    </div>
  );
};

export default TruckManagement;