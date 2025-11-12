import React, { useState, useEffect } from 'react';
import Map from '../components/Map';
import HeatmapLayer from '../components/HeatmapLayer';
import ZoneLayer from '../components/ZoneLayer';
import { reportsAPI, zonesAPI } from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const JENIS_KEJAHATAN = [
  { value: '', label: 'Semua Jenis' },
  { value: 'pencurian', label: 'Pencurian' },
  { value: 'perampokan', label: 'Perampokan' },
  { value: 'kekerasan', label: 'Kekerasan' },
  { value: 'narkoba', label: 'Narkoba' },
  { value: 'lainnya', label: 'Lainnya' },
];

const PublicMapPage = () => {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layerType, setLayerType] = useState('heatmap'); // 'heatmap' or 'zones'
  const [filters, setFilters] = useState({
    jenis_kejahatan: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load reports for heatmap
      const reportsParams = {
        status: 'verified',
        ...filters,
      };
      const reportsResponse = await reportsAPI.getAll(reportsParams);
      setReports(reportsResponse.data);

      // Load zones
      const zonesResponse = await zonesAPI.getAll();
      setZones(zonesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleZoneClick = (zone) => {
    console.log('Zone clicked:', zone);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Sistem Pelaporan Kriminalitas DKI Jakarta
          </h1>
          <nav className="space-x-4">
            <a href="/" className="hover:underline">Peta</a>
            <a href="/report" className="hover:underline">Laporkan</a>
            <a href="/admin/login" className="hover:underline">Admin</a>
          </nav>
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative">
        <Map center={[-6.2088, 106.8456]} zoom={12} className="absolute inset-0">
          {layerType === 'heatmap' && <HeatmapLayer data={reports} />}
          {layerType === 'zones' && <ZoneLayer zones={zones} onZoneClick={handleZoneClick} />}
        </Map>

        {/* Controls Panel */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000] max-w-sm">
          <h2 className="text-lg font-bold mb-4">Kontrol Peta</h2>

          {/* Layer Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tampilan:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setLayerType('heatmap')}
                className={`flex-1 px-4 py-2 rounded ${
                  layerType === 'heatmap'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Heatmap
              </button>
              <button
                onClick={() => setLayerType('zones')}
                disabled
                className={`flex-1 px-4 py-2 rounded ${
                  layerType === 'zones'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                } opacity-50 cursor-not-allowed`}
              >
                Zona Manual
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Kejahatan:</label>
              <select
                name="jenis_kejahatan"
                value={filters.jenis_kejahatan}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {JENIS_KEJAHATAN.map((jenis) => (
                  <option key={jenis.value} value={jenis.value}>
                    {jenis.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dari Tanggal:</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sampai Tanggal:</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Legend */}
          {layerType === 'heatmap' && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Legenda Heatmap:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span>Sangat Tinggi</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                  <span>Tinggi</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span>Sedang</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-lime-500 rounded mr-2"></div>
                  <span>Rendah-Sedang</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-cyan-500 rounded mr-2"></div>
                  <span>Rendah</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span>Sangat Rendah</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Intensitas warna menunjukkan kepadatan laporan kriminalitas di area tersebut
              </p>
            </div>
          )}

          {layerType === 'zones' && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Legenda Zona:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span>Tinggi</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                  <span>Sedang</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span>Rendah</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg z-[1000]">
            <p>Memuat data...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-2 text-center text-sm">
        <p>&copy; 2024 Sistem Pelaporan Kriminalitas DKI Jakarta</p>
      </footer>
    </div>
  );
};

export default PublicMapPage;

