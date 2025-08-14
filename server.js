
// server.js — CMMS (Express + Sequelize + Handlebars) listo para Docker (DEV)

const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');

// Sequelize: ./util/db.js (en Docker se overridea por util/db.docker.js)
const sequelize = require('./util/db');

const app = express();

/* ===== Middlewares ===== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sesiones: MemoryStore (DEV)
const sess = {
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8,
  },
};
app.use(session(sess));

/* ===== Handlebars (compat v3/v4 y v6+) ===== */
const viewsPath   = path.join(__dirname, 'views');
const layoutsDir  = path.join(viewsPath, 'layouts');
const partialsDir = path.join(viewsPath, 'partials');

const hbsOptions = {
  defaultLayout: 'main',
  layoutsDir,
  partialsDir,
  helpers: {
    // helpers opcionales
  },
};

const engineFn = (typeof exphbs.engine === 'function')
  ? exphbs.engine(hbsOptions)  // v6+
  : exphbs(hbsOptions);        // v3/v4

app.engine('handlebars', engineFn);
app.set('view engine', 'handlebars');
app.set('views', viewsPath);

/* ===== Estáticos ===== */
app.use(express.static(path.join(__dirname, 'public')));

/* ===== Modelos ===== */
const modelsDir = path.join(__dirname, 'models');
if (fs.existsSync(modelsDir)) {
  fs.readdirSync(modelsDir)
    .filter((f) => f.endsWith('.js') && f !== 'index.js')
    .forEach((f) => {
      try { require(path.join(modelsDir, f)); }
      catch (e) { console.error('[models] error', f, e.message); }
    });
}

/* ===== Rutas ===== */
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

try {
  const mainRouter = require('./routes');
  app.use('/', mainRouter);
} catch {
  const routesDir = path.join(__dirname, 'routes');
  if (fs.existsSync(routesDir)) {
    fs.readdirSync(routesDir)
      .filter((f) => f.endsWith('.js'))
      .forEach((f) => {
        try {
          const r = require(path.join(routesDir, f));
          if (typeof r === 'function') app.use('/', r);
        } catch (e) { console.error('[routes] error', f, e.message); }
      });
  }
}

/* ===== Control de sync (evita choque con dump SQL) =====
   DB_SYNC="1" => sequelize.sync({ alter:true })
   Default "0" => NO sincroniza (usa el dump importado por MySQL)
*/
const SYNC = process.env.DB_SYNC || '0';
async function prepareDb() {
  if (SYNC === '1') {
    try {
      await sequelize.sync({ alter: true });
      console.log('[sequelize] sync OK (alter)');
    } catch (err) {
      console.error('[sequelize] sync error:', err);
    }
  } else {
    console.log('[sequelize] skipping sync; assuming schema from SQL dump');
  }
}

/* ===== Listen (clave en Docker) ===== */
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

prepareDb().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
});

module.exports = app;
