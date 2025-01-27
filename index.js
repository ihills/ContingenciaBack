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
    user: 'postgres',u
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

app.post('/api/sysusers', async (req, res) => {
    const { company_id, employee_number } = req.body;
    try {
        const result = await pool.query('select * from sys_users where company_id = $1 and employee_number = $2', [company_id, employee_number]);
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when getting SysUser ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            logger.info(`Usuario no encontrado: ${username}`);
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.info(`Clave incorrecta para el usuario: ${username}`);
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' }); 
        }
        const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        logger.error(`Error al iniciar sesión para el usuario ${username}: ${error.message}`);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/getuser', async (req, res) => {
    const { userid } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users where id = $1', [userid]);
        res.json(result.rows);
    } catch (error) {
        logger.info(`error with User ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/tickets', async (req, res) => {

    const { user_id, title, description, status, created_at, companyid, incidenttypeid, updated_at , shortdesc, cat_id,planned_for,contact_type,applicant,planned_rut,planned_email,planned_charge, phone_number} = req.body;
    const queryString = `INSERT INTO tickets (user_id,title,description,status,created_at,companyid,incidenttypeid,updated_at,shortdesc, cat_id,planned_for,contact_type,applicant,planned_rut,planned_email,planned_charge, phone_number) VALUES (${user_id},'Ticket Contingencia','${description}',NULL,CURRENT_TIMESTAMP, ${companyid},${incidenttypeid},CURRENT_TIMESTAMP,'${shortdesc}',${cat_id},'${planned_for}','${contact_type}','${applicant}','${planned_rut}','${planned_email}', '${planned_charge}', '${phone_number}')`;
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
    const consulta = " select c.company_name CLIENTE , t.applicant Solicitante, contact_type tipo_contacto, planned_for Planificado_para , planned_rut rut_planificado,  t.planned_email email_planificado, t.phone_number telefono_planificado, t.planned_charge cargo_planificado, t.shortdesc motivo_falla, t.description descripcion_falla , to_char(created_at, 'DD/MM/YYYY - HH24:MI') fecha_creacion  from tickets t   join users u on u.id = t.user_id   join company c on c.companyid  = t.companyid   left join categories c2 on c2.categoryid = t.categoryid   left join subcategory s on s.categoryid = t.subcategoryid   left join substate s2 on s2.substateid = t.substateid   left join priority p on p.priorityid = t.priorityid   left join domains d on d.snd_id = t.domainid  order by created_at desc "
    try {
        const result = await pool.query(consulta);
        res.json(result.rows);
    } catch (error) {
        logger.info(`error reading ticket ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/companies', async (req, res) => {
    try {
        const result = await pool.query('SELECT companyid, company_name FROM company');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get companies ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT categoryid, categoryname FROM categories');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error when get categories ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/subcategory', async (req, res) => {
    try {
        const result = await pool.query('SELECT subcategoryid, subcategoryname FROM subcategory');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error with subcategory ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/substate', async (req, res) => {
    try {
        const result = await pool.query('SELECT substateid, substatename FROM substate');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error with substate ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/incidenttype', async (req, res) => {
    try {
        const result = await pool.query('SELECT it_id, it_name FROM incidenttype');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error with incident type ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/domains', async (req, res) => {
    try {
        const result = await pool.query('SELECT distinct sys_domains FROM domains');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error with domains ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/priority', async (req, res) => {
    try {
        const result = await pool.query('SELECT priorityid, priorityname FROM priority');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error with priority ${error.message}`)
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/catalogue', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM catalogue');
        res.json(result.rows);
    } catch (error) {
        logger.info(`error with priority ${error.message}`)
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

