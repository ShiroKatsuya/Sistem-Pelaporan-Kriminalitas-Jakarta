import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import { zonesAPI } from '../services/api';
import { removeToken } from '../utils/auth';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LEVEL_RISIKO = [
  { value: 'rendah', label: 'Rendah', color: '#FFFF00' },
  { value: 'sedang', label: 'Sedang', color: '#FFA500' },
  { value: 'tinggi', label: 'Tinggi', color: '#FF0000' },
];

const AdminZoneManagementPage = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    level_risiko: 'sedang',
    warna: '#FFA500',
  });
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await zonesAPI.getAll();
      setZones(response.data);
    } catch (error) {
      console.error('Error loading zones:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        removeToken();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingZone(null);
    setFormData({
      nama: '',
      level_risiko: 'sedang',
      warna: '#FFA500',
    });
    setDrawnPolygon(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      nama: zone.nama,
      level_risiko: zone.level_risiko,
      warna: zone.warna,
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus zona ini?')) {
      return;
    }

    try {
      await zonesAPI.delete(id);
      setSuccess('Zona berhasil dihapus');
      loadZones();
    } catch (error) {
      setError(error.response?.data?.error || 'Gagal menghapus zona');
    }
  };

  const handleDrawCreated = (e) => {
    const layer = e.layer;
    const latlngs = layer.getLatLngs()[0];
    // Convert from Leaflet [lat, lng] to PostGIS [lng, lat]
    const coordinates = latlngs.map(ll => [ll.lng, ll.lat]);
    // Close the polygon (ensure first and last are the same)
    if (coordinates.length > 0 && 
        (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
         coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
      coordinates.push([coordinates[0][0], coordinates[0][1]]);
    }
    setDrawnPolygon(coordinates);
    setError('');
  };

  const handleDrawDeleted = () => {
    setDrawnPolygon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!drawnPolygon && !editingZone) {
      setError('Silakan gambar polygon di peta terlebih dahulu');
      return;
    }

    try {
      const zoneData = {
        nama: formData.nama,
        coordinates: drawnPolygon || editingZone.geometry.coordinates[0],
        level_risiko: formData.level_risiko,
        warna: formData.warna,
      };

      if (editingZone) {
        await zonesAPI.update(editingZone.id, zoneData);
        setSuccess('Zona berhasil diupdate');
      } else {
        await zonesAPI.create(zoneData);
        setSuccess('Zona berhasil dibuat');
      }

      setShowForm(false);
      loadZones();
    } catch (error) {
      setError(error.response?.data?.error || 'Gagal menyimpan zona');
    }
  };

  const handleLevelRisikoChange = (e) => {
    const level = e.target.value;
    const levelData = LEVEL_RISIKO.find(l => l.value === level);
    setFormData({
      ...formData,
      level_risiko: level,
      warna: levelData ? levelData.color : formData.warna,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Kelola Zona Rawan</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/admin/reports')}
              className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
            >
              Kelola Laporan
            </button>
            <button
              onClick={() => {
                removeToken();
                navigate('/admin/login');
              }}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daftar Zona</h2>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tambah Zona Baru
          </button>
        </div>

        {/* Zones List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Level Risiko
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Warna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {zone.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {zone.level_risiko}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: zone.warna }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(zone)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Map and Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Peta Editor</h3>
            <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
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
                <EditControl
                  position="topright"
                  draw={{
                    rectangle: false,
                    polyline: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polygon: {
                      allowIntersection: false,
                      drawError: {
                        color: '#e1e100',
                        message: '<strong>Polygon tidak valid!</strong> Pastikan polygon tidak saling berpotongan',
                      },
                      shapeOptions: {
                        color: formData.warna,
                      },
                    },
                  }}
                  onCreated={handleDrawCreated}
                  onDeleted={handleDrawDeleted}
                />
              </MapContainer>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Gunakan toolbar di kanan atas peta untuk menggambar polygon zona baru
            </p>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingZone ? 'Edit Zona' : 'Tambah Zona Baru'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Zona <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level Risiko <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.level_risiko}
                    onChange={handleLevelRisikoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {LEVEL_RISIKO.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warna <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="color"
                    value={formData.warna}
                    onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingZone ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminZoneManagementPage;

