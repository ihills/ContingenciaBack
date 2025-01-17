const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./logger');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'nico1401',
    port: 5432,
});

app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
            [username, hashedPassword, email]
        );
        res.status(201).json(result.rows[0]);
        logger.info(`User registered: ${username}`);
    } catch (error) {
        logger.error(`Error registering user: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
        logger.info(`User not found ${username}`);
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        if (password !== result.rows[0].password) {
        logger.info(`wrong password for ${username}`);
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: result.rows[0].id }, 'secret_key', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/getuser', async (req, res) => {
    const { userid } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users where id = $1', [userid]);
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when getting User ${$error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/tickets', async (req, res) => {
    const { user_id, title, description, status, created_at, companyid, categoryid, subcategoryid, substateid, priorityid, incidenttypeid, domainid, updated_at , shortdesc} = req.body;
    const queryString = `INSERT INTO tickets (user_id,title,description,status,created_at,companyid,categoryid,subcategoryid,substateid,priorityid,incidenttypeid,domainid,updated_at,shortdesc) VALUES (${user_id},'Ticket Contingencia','${description}','${status}',CURRENT_TIMESTAMP,${companyid},${categoryid},${subcategoryid},${substateid},${priorityid},${incidenttypeid},${domainid},CURRENT_TIMESTAMP,'${shortdesc}')`;
    try 
    {
        const result = await pool.query(queryString);
        res.status(201).json(result.rows[0]);
        logger.info(`ticket insert ok `);
    } 
    catch (error) {
        logger.info(`error when add ticket ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/tickets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tickets');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error reading ticket ${$error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/companies', async (req, res) => {
    try {
        const result = await pool.query('SELECT companyid, company_name FROM company');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get companies ${$error.message}`)

        res.status(400).json({ error: error.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT categoryid, categoryname FROM categories');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get categories ${$error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/subcategory', async (req, res) => {
    try {
        const result = await pool.query('SELECT subcategoryid, subcategoryname FROM subcategory');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get subcategory ${$error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/substate', async (req, res) => {
    try {
        const result = await pool.query('SELECT substateid, substatename FROM substate');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get substate ${$error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/incidenttype', async (req, res) => {
    try {
        const result = await pool.query('SELECT it_id, it_name FROM incidenttype');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get incident type ${$error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/domains', async (req, res) => {
    try {
        const result = await pool.query('SELECT snd_id, snd_name FROM domains');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get domains ${$error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/priority', async (req, res) => {
    try {
        const result = await pool.query('SELECT priorityid, priorityname FROM priority');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get priority ${$error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.use((err, req, res, next) => {
    logger.error(`Server error: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Service Running at port : ${port}`);
});
