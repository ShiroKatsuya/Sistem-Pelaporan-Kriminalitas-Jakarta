const Zone = require('../models/Zone');
const Joi = require('joi');

// Get all zones
const getZones = async (req, res) => {
  try {
    const zones = await Zone.findAll();
    res.json(zones);
  } catch (error) {
    console.error('Error getting zones:', error);
    res.status(500).json({ error: 'Gagal mengambil data zona' });
  }
};

// Get zone by ID
const getZoneById = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await Zone.findById(id);

    if (!zone) {
      return res.status(404).json({ error: 'Zona tidak ditemukan' });
    }

    res.json(zone);
  } catch (error) {
    console.error('Error getting zone:', error);
    res.status(500).json({ error: 'Gagal mengambil data zona' });
  }
};

// Create zone
const createZone = async (req, res) => {
  try {
    // Validate basic structure first
    const basicValidation = Joi.object({
      nama: Joi.string().required(),
      coordinates: Joi.array().min(3).required(),
      level_risiko: Joi.string().valid('rendah', 'sedang', 'tinggi').required(),
      warna: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required(),
    }).validate(req.body);

    if (basicValidation.error) {
      return res.status(400).json({ error: basicValidation.error.details[0].message });
    }

    // Validate coordinates structure manually
    const coordinates = req.body.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      return res.status(400).json({ error: 'Koordinat harus berupa array dengan minimal 3 titik' });
    }

    for (let i = 0; i < coordinates.length; i++) {
      if (!Array.isArray(coordinates[i]) || coordinates[i].length !== 2) {
        return res.status(400).json({ error: `Koordinat ke-${i + 1} harus berupa array dengan 2 angka [longitude, latitude]` });
      }
      if (typeof coordinates[i][0] !== 'number' || typeof coordinates[i][1] !== 'number') {
        return res.status(400).json({ error: `Koordinat ke-${i + 1} harus berupa angka` });
      }
    }

    const value = basicValidation.value;

    // Ensure polygon is closed (first and last coordinates are the same)
    const coordArray = [...coordinates];
    if (coordArray[0][0] !== coordArray[coordArray.length - 1][0] ||
        coordArray[0][1] !== coordArray[coordArray.length - 1][1]) {
      coordArray.push([coordArray[0][0], coordArray[0][1]]);
    }

    const zoneData = {
      nama: value.nama,
      coordinates: coordArray,
      level_risiko: value.level_risiko,
      warna: value.warna,
    };

    const zone = await Zone.create(zoneData);

    res.status(201).json({
      message: 'Zona berhasil dibuat',
      zone: zone,
    });
  } catch (error) {
    console.error('Error creating zone:', error);
    res.status(500).json({ error: 'Gagal membuat zona' });
  }
};

// Update zone
const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.body.nama) updateData.nama = req.body.nama;
    if (req.body.coordinates) {
      const coordinates = req.body.coordinates;
      
      // Validate coordinates structure
      if (!Array.isArray(coordinates) || coordinates.length < 3) {
        return res.status(400).json({ error: 'Koordinat harus berupa array dengan minimal 3 titik' });
      }

      for (let i = 0; i < coordinates.length; i++) {
        if (!Array.isArray(coordinates[i]) || coordinates[i].length !== 2) {
          return res.status(400).json({ error: `Koordinat ke-${i + 1} harus berupa array dengan 2 angka [longitude, latitude]` });
        }
        if (typeof coordinates[i][0] !== 'number' || typeof coordinates[i][1] !== 'number') {
          return res.status(400).json({ error: `Koordinat ke-${i + 1} harus berupa angka` });
        }
      }

      // Ensure polygon is closed
      const coordArray = [...coordinates];
      if (coordArray[0][0] !== coordArray[coordArray.length - 1][0] ||
          coordArray[0][1] !== coordArray[coordArray.length - 1][1]) {
        coordArray.push([coordArray[0][0], coordArray[0][1]]);
      }
      updateData.coordinates = coordArray;
    }
    if (req.body.level_risiko) {
      if (!['rendah', 'sedang', 'tinggi'].includes(req.body.level_risiko)) {
        return res.status(400).json({ error: 'Level risiko tidak valid' });
      }
      updateData.level_risiko = req.body.level_risiko;
    }
    if (req.body.warna) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(req.body.warna)) {
        return res.status(400).json({ error: 'Format warna tidak valid' });
      }
      updateData.warna = req.body.warna;
    }

    const zone = await Zone.update(id, updateData);

    if (!zone) {
      return res.status(404).json({ error: 'Zona tidak ditemukan' });
    }

    res.json({
      message: 'Zona berhasil diupdate',
      zone: zone,
    });
  } catch (error) {
    console.error('Error updating zone:', error);
    res.status(500).json({ error: 'Gagal mengupdate zona' });
  }
};

// Delete zone
const deleteZone = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await Zone.delete(id);

    if (!zone) {
      return res.status(404).json({ error: 'Zona tidak ditemukan' });
    }

    res.json({ message: 'Zona berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    res.status(500).json({ error: 'Gagal menghapus zona' });
  }
};

module.exports = {
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
};

