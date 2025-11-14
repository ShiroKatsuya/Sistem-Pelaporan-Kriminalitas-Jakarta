import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { removeToken } from '../utils/auth';
import { format } from 'date-fns';

const JENIS_KEJAHATAN = [
  { value: '', label: 'Semua Jenis' },
  { value: 'pencurian', label: 'Pencurian' },
  { value: 'perampokan', label: 'Perampokan' },
  { value: 'kekerasan', label: 'Kekerasan' },
  { value: 'narkoba', label: 'Narkoba' },
  { value: 'lainnya', label: 'Lainnya' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const AdminReportManagementPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    jenis_kejahatan: '',
    limit: 50,
    offset: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getReports(filters);
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        removeToken();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      offset: 0, // Reset offset when filter changes
    }));
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await adminAPI.updateStatus(id, status);
      setSuccess(`Status laporan berhasil diupdate menjadi ${status}`);
      loadReports();
      setSelectedReport(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Gagal mengupdate status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
      return;
    }

    try {
      await adminAPI.delete(id);
      setSuccess('Laporan berhasil dihapus');
      loadReports();
      setSelectedReport(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Gagal menghapus laporan');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await adminAPI.getReportById(id);
      setSelectedReport(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Gagal memuat detail laporan');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && reports.length === 0) {
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
          <h1 className="text-2xl font-bold">Kelola Laporan</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
            >
              Dashboard
            </button>
            {/* <button
              onClick={() => navigate('/admin/zones')}
              className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
            >
              Kelola Zona
            </button> */}
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kejahatan
              </label>
              <select
                name="jenis_kejahatan"
                value={filters.jenis_kejahatan}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {JENIS_KEJAHATAN.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal Kejadian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{report.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(report.tanggal_kejadian), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.jenis_kejahatan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(report.id)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Detail
                    </button>
                    {report.status !== 'verified' && (
                      <button
                        onClick={() => handleStatusUpdate(report.id, 'verified')}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Verify
                      </button>
                    )}
                    {report.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusUpdate(report.id, 'rejected')}
                        className="text-red-600 hover:text-red-900 mr-4"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(report.id)}
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

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Detail Laporan #{selectedReport.id}</h2>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lokasi</label>
                    <p className="mt-1 text-sm text-gray-900">
                      Lat: {selectedReport.latitude}, Lng: {selectedReport.longitude}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tanggal Kejadian
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedReport.tanggal_kejadian), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Jenis Kejahatan
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{selectedReport.jenis_kejahatan}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedReport.deskripsi || 'Tidak ada deskripsi'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedReport.status
                      )}`}
                    >
                      {selectedReport.status}
                    </span>
                  </div>

                  {selectedReport.foto_path && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Foto</label>
                      <img
                        src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${selectedReport.foto_path}`}
                        alt="Foto laporan"
                        className="mt-2 max-w-full rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tanggal Dibuat
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedReport.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  {selectedReport.status !== 'verified' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedReport.id, 'verified');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Verify
                    </button>
                  )}
                  {selectedReport.status !== 'rejected' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedReport.id, 'rejected');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedReport.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Hapus
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportManagementPage;

