import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { reportsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle map clicks
const LocationPicker = ({ onLocationSelect, selectedLocation }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect({ latitude: lat, longitude: lng });
    },
  });

  const markerRef = React.useRef(null);

  React.useEffect(() => {
    if (selectedLocation) {
      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      
      // Add new marker
      const newMarker = L.marker([selectedLocation.latitude, selectedLocation.longitude]).addTo(map);
      markerRef.current = newMarker;
    }
    
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [selectedLocation, map]);

  return null;
};

const JENIS_KEJAHATAN = [
  { value: 'pencurian', label: 'Pencurian' },
  { value: 'perampokan', label: 'Perampokan' },
  { value: 'kekerasan', label: 'Kekerasan' },
  { value: 'narkoba', label: 'Narkoba' },
  { value: 'lainnya', label: 'Lainnya' },
];

const ReportFormPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setValue('lokasi', location, { shouldValidate: true });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      
      setPhotoFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedLocation) {
      setError('Silakan pilih lokasi kejadian di peta');
      return;
    }

    // Validate date (not more than 30 days ago)
    const tanggalKejadian = new Date(data.tanggal_kejadian);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (tanggalKejadian < thirtyDaysAgo) {
      setError('Tanggal kejadian tidak boleh lebih dari 30 hari yang lalu');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const reportData = {
        lokasi: selectedLocation,
        tanggal_kejadian: data.tanggal_kejadian,
        jenis_kejahatan: data.jenis_kejahatan,
        deskripsi: data.deskripsi || '',
      };

      await reportsAPI.create(reportData, photoFile);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Laporkan Kejadian</h1>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Laporan berhasil dikirim! Anda akan diarahkan ke halaman utama...
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
            {/* Location Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Lokasi Kejadian <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Klik pada peta untuk memilih lokasi kejadian
              </p>
              <div className="h-64 border border-gray-300 rounded-lg overflow-hidden">
                <MapContainer
                  center={[-6.2088, 106.8456]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                  />
                </MapContainer>
              </div>
              {selectedLocation && (
                <p className="text-sm text-gray-600 mt-2">
                  Lokasi: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </p>
              )}
              {errors.lokasi && (
                <p className="text-red-500 text-sm mt-1">Lokasi harus dipilih</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal & Waktu Kejadian <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register('tanggal_kejadian', { required: 'Tanggal kejadian wajib diisi' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.tanggal_kejadian && (
                <p className="text-red-500 text-sm mt-1">{errors.tanggal_kejadian.message}</p>
              )}
            </div>

            {/* Crime Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kejahatan <span className="text-red-500">*</span>
              </label>
              <select
                {...register('jenis_kejahatan', { required: 'Jenis kejahatan wajib dipilih' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Jenis Kejahatan</option>
                {JENIS_KEJAHATAN.map((jenis) => (
                  <option key={jenis.value} value={jenis.value}>
                    {jenis.label}
                  </option>
                ))}
              </select>
              {errors.jenis_kejahatan && (
                <p className="text-red-500 text-sm mt-1">{errors.jenis_kejahatan.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                {...register('deskripsi')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jelaskan kejadian secara singkat (opsional)"
              />
            </div>

            {/* Photo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Foto (Opsional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Format: JPG, PNG. Maksimal 5MB
              </p>
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-w-xs rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <a href="/" className="text-blue-600 hover:underline">
              Kembali ke Peta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFormPage;

