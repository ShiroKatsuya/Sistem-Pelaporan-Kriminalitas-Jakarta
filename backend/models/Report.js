const { pool } = require('../config/database');

class Report {
  // Create a new report
  static async create(data) {
    const { lokasi, tanggal_kejadian, jenis_kejahatan, deskripsi, foto_path, ip_address } = data;
    
    const query = `
      INSERT INTO reports (lokasi, tanggal_kejadian, jenis_kejahatan, deskripsi, foto_path, ip_address)
      VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, $4, $5, $6, $7)
      RETURNING id, ST_X(lokasi) as longitude, ST_Y(lokasi) as latitude, 
                tanggal_kejadian, jenis_kejahatan, deskripsi, foto_path, status, created_at
    `;
    
    const values = [lokasi.longitude, lokasi.latitude, tanggal_kejadian, jenis_kejahatan, deskripsi, foto_path, ip_address];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all reports with filters
  static async findAll(filters = {}) {
    let query = `
      SELECT id, ST_X(lokasi) as longitude, ST_Y(lokasi) as latitude,
             tanggal_kejadian, jenis_kejahatan, deskripsi, foto_path, status, created_at, ip_address
      FROM reports
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.jenis_kejahatan) {
      query += ` AND jenis_kejahatan = $${paramCount}`;
      values.push(filters.jenis_kejahatan);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND tanggal_kejadian >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND tanggal_kejadian <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    if (filters.bounds) {
      // Spatial filter using bounding box
      query += ` AND ST_Within(lokasi, ST_MakeEnvelope($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, 4326))`;
      values.push(filters.bounds.minLng, filters.bounds.minLat, filters.bounds.maxLng, filters.bounds.maxLat);
      paramCount += 4;
    }

    query += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get report by ID
  static async findById(id) {
    const query = `
      SELECT id, ST_X(lokasi) as longitude, ST_Y(lokasi) as latitude,
             tanggal_kejadian, jenis_kejahatan, deskripsi, foto_path, status, created_at, ip_address
      FROM reports
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Update report status
  static async updateStatus(id, status) {
    const query = `
      UPDATE reports
      SET status = $1
      WHERE id = $2
      RETURNING id, ST_X(lokasi) as longitude, ST_Y(lokasi) as latitude,
                tanggal_kejadian, jenis_kejahatan, deskripsi, foto_path, status, created_at
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  // Delete report
  static async delete(id) {
    const query = 'DELETE FROM reports WHERE id = $1 RETURNING id, foto_path';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get reports count by status
  static async countByStatus() {
    const query = `
      SELECT status, COUNT(*) as count
      FROM reports
      GROUP BY status
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get reports count by jenis_kejahatan
  static async countByJenis() {
    const query = `
      SELECT jenis_kejahatan, COUNT(*) as count
      FROM reports
      GROUP BY jenis_kejahatan
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get reports count by date range
  static async countByDateRange(startDate, endDate) {
    const query = `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM reports
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  // Get reports count for today
  static async countToday() {
    const query = `
      SELECT COUNT(*) as count
      FROM reports
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const result = await pool.query(query);
    return result.rows[0].count;
  }

  // Get total reports count
  static async countTotal() {
    const query = 'SELECT COUNT(*) as count FROM reports';
    const result = await pool.query(query);
    return result.rows[0].count;
  }

  // Check if IP has submitted reports in the last hour
  static async checkRecentReports(ipAddress, hours = 1) {
    const query = `
      SELECT COUNT(*) as count
      FROM reports
      WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '${hours} hours'
    `;
    const result = await pool.query(query, [ipAddress]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Report;

