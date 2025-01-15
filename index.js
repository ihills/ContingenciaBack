const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: 'myuser',
    host: 'localhost',
    database: 'mydatabase',
    password: 'mypassword',
    port: 5433,
});

// Rutas

// Registro de usuario (CRUD)
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
            [username, hashedPassword, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login de usuario
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Datos recibidos:', username, password); // Agrega esto

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Compara contraseñas en texto plano (sin cifrado)
        if (password !== result.rows[0].password) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Genera un token si las credenciales son correctas
        const token = jwt.sign({ id: result.rows[0].id }, 'secret_key', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// CRUD de tickets
app.post('/api/tickets', async (req, res) => {
    const { user_id, title, description } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO tickets (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
            [user_id, title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/tickets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tickets');
        res.json(result.rows);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
