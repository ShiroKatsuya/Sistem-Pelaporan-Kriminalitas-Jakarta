const { pool } = require('../config/database');

class Zone {
  // Create a new zone
  static async create(data) {
    const { nama, coordinates, level_risiko, warna } = data;
    
    // Convert coordinates array to PostGIS polygon
    const coordinatesText = coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
    const polygonWKT = `POLYGON((${coordinatesText}))`;
    
    const query = `
      INSERT INTO manual_zones (nama, geometry, level_risiko, warna)
      VALUES ($1, ST_GeomFromText($2, 4326), $3, $4)
      RETURNING id, nama, ST_AsGeoJSON(geometry)::text as geometry, level_risiko, warna, created_at, updated_at
    `;
    
    const values = [nama, polygonWKT, level_risiko, warna];
    const result = await pool.query(query, values);
    
    return {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry),
    };
  }

  // Get all zones
  static async findAll() {
    const query = `
      SELECT id, nama, ST_AsGeoJSON(geometry)::text as geometry, level_risiko, warna, created_at, updated_at
      FROM manual_zones
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      ...row,
      geometry: JSON.parse(row.geometry),
    }));
  }

  // Get zone by ID
  static async findById(id) {
    const query = `
      SELECT id, nama, ST_AsGeoJSON(geometry)::text as geometry, level_risiko, warna, created_at, updated_at
      FROM manual_zones
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry),
    };
  }

  // Update zone
  static async update(id, data) {
    const { nama, coordinates, level_risiko, warna } = data;
    
    let query;
    let values;
    
    if (coordinates) {
      // Convert coordinates array to PostGIS polygon
      const coordinatesText = coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
      const polygonWKT = `POLYGON((${coordinatesText}))`;
      
      query = `
        UPDATE manual_zones
        SET nama = COALESCE($1, nama),
            geometry = COALESCE(ST_GeomFromText($2, 4326), geometry),
            level_risiko = COALESCE($3, level_risiko),
            warna = COALESCE($4, warna)
        WHERE id = $5
        RETURNING id, nama, ST_AsGeoJSON(geometry)::text as geometry, level_risiko, warna, created_at, updated_at
      `;
      values = [nama, polygonWKT, level_risiko, warna, id];
    } else {
      query = `
        UPDATE manual_zones
        SET nama = COALESCE($1, nama),
            level_risiko = COALESCE($2, level_risiko),
            warna = COALESCE($3, warna)
        WHERE id = $4
        RETURNING id, nama, ST_AsGeoJSON(geometry)::text as geometry, level_risiko, warna, created_at, updated_at
      `;
      values = [nama, level_risiko, warna, id];
    }
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry),
    };
  }

  // Delete zone
  static async delete(id) {
    const query = 'DELETE FROM manual_zones WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Zone;

