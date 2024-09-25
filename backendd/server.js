const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

const SECRET = 'praveen'; // For JWT encryption

// Database setup
const db = new sqlite3.Database('./todos.db', (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT
            );
            
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT,
                status TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
        `)
    }
});

// User Authentication routes (signup, login, token validation)
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic input validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields (name, email, password) are required' });
        }

        // Check if the email is already registered
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Email is already registered' });
            }

            // Hash the password with bcrypt
            const hashedPassword = await bcrypt.hash(password, 10);
            const id = uuid.v4();

            // Insert the new user into the database
            db.run(`INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`, 
                [id, name, email, hashedPassword], 
                (err) => {
                    if (err) {
                        return res.status(400).json({ error: err.message });
                    }

                    res.status(201).json({ message: 'User registered' });
                }
            );
        });
    } catch (error) {
        // Catch any unexpected errors
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("------------------", email, password);
    // Basic input validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Both email and password are required' });
    }

    // Fetch the user by email from the database
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        try {
            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                // Password doesn't match
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Generate a JWT token
            const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1h' });

            res.json({ token });
        } catch (error) {
            console.error('Error during password comparison:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
});



// Middleware to check JWT
const requireAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'Token missing' });

    try {
        const decoded = jwt.decode(token, SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Task Management routes (CRUD)
app.post('/tasks', requireAuth, (req, res) => {
    const { title, status } = req.body;
    const id = uuid.v4();
    db.run(`INSERT INTO tasks (id, user_id, title, status) VALUES (?, ?, ?, ?)`,
           [id, req.userId, title, status || 'pending'], 
           (err) => {
        if (err) {
            console.log(err)
           return res.status(400).json({ error: err.message });
        } 
        res.status(201).json({ message: 'Task created' });
    });
});

app.get('/tasks', requireAuth, (req, res) => {
    db.all(`SELECT * FROM tasks WHERE user_id = ?`, [req.userId], (err, tasks) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(tasks);
    });
});

app.put('/tasks/:id', requireAuth, (req, res) => {
    const { title, status } = req.body;
    db.run(`UPDATE tasks SET title = ?, status = ? WHERE id = ? AND user_id = ?`, 
           [title, status, req.params.id, req.userId], 
           (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Task updated' });
    });
});

app.delete('/tasks/:id', requireAuth, (req, res) => {
    db.run(`DELETE FROM tasks WHERE id = ? AND user_id = ?`, [req.params.id, req.userId], (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Task deleted' });
    });
});

// Profile Management routes (CRUD)
app.get('/profile', requireAuth, (req, res) => {
    db.get(`SELECT name, email FROM users WHERE id = ?`, [req.userId], (err, user) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(user);
    });
});

app.put('/profile', requireAuth, (req, res) => {
    const { name, email, password } = req.body;
    db.run(`UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?`,
           [name, email, password ? bcrypt.hashSync(password, 10) : undefined, req.userId],
           (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Profile updated' });
    });
});

// Start server
app.listen(8000, () => console.log('Server running on port 8000'));
