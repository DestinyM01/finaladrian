const { Sequelize } = require('sequelize');

const DB_NAME = process.env.DB_NAME || 'cmms';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || 'mysql';
const DB_HOST = process.env.DB_HOST || 'db'; // servicio MySQL en compose

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false,
});

sequelize.authenticate()
  .then(() => console.log(`[DB] Conectado a MySQL @ ${DB_HOST}/${DB_NAME}`))
  .catch(err => console.error('[DB] Error de conexión:', err));

module.exports = sequelize;