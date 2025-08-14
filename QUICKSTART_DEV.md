# CMMS — Docker (solo desarrollo)

Sin Dockerfile ni builds: usamos imágenes oficiales (node y mysql) y montamos tu carpeta al contenedor.

## Estructura mínima
Coloca estos archivos en la raíz del proyecto (donde están `server.js`, `routes/`, `util/`, `views/`):

```
.
├─ server.js
├─ package.json
├─ routes/
├─ models/
├─ util/
│  └─ db.js               # tu archivo original (no se toca)
├─ views/
├─ public/
├─ db_init/
│  └─ 01_cmms.sql         # (opcional) dump SQL para importar automáticamente
├─ docker-compose.yml     # (este archivo)
├─ .env.example  -> copia como .env
└─ util/
   └─ db.docker.js        # override para Docker
```

## Cómo correr
```bash
cp .env.example .env
mkdir -p db_init
# opcional: copia tu dump a db_init/01_cmms.sql

docker compose up -d
# App:     http://localhost:3000
# Adminer: http://localhost:8080  (Server: db, User: root, Pass: mysql, DB: cmms)
```

## ¿Qué hace?
- **db (MySQL 8)**: crea la base `cmms` y, si pones un `.sql` en `db_init/`, lo importa al primer arranque.
- **app (Node 18)**: monta tu carpeta, hace `npm install` y corre `npx nodemon server.js` (hot-reload).
- **adminer**: GUI web tipo phpMyAdmin en `http://localhost:8080`.

## Tips
- Si tu `package.json` ya define `"start": "nodemon server.js"`, puedes cambiar el comando de `app` a `npm start`.
- Si quieres usar tu `util/db.js` leyendo variables de entorno, modifícalo así y puedes quitar el volumen de `db.docker.js`:
  ```js
  const { Sequelize } = require('sequelize');
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'cmms',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || 'mysql',
    { host: process.env.DB_HOST || 'db', dialect: 'mysql', logging: false }
  );
  module.exports = sequelize;
  ```