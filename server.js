const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const pool = mysql.createPool({
  host: 'bmit0bpiau5ou7gx51fr-mysql.services.clever-cloud.com',
  user: 'uaa1hwklgilqtmzw',
  password: 'lU7UCzZBTZGGeBcdoVxe',
  database: 'bmit0bpiau5ou7gx51fr',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const JWT_SECRET = 'your_jwt_secret_here';

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Received signup request:', { name, email });
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    console.log('User inserted successfully:', result);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Detailed error in signup:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Received login request:', { email });
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
      console.log('Login successful for user:', email);
      res.status(200).json({ message: 'Login successful', token });
    } else {
      console.log('Invalid password for user:', email);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Detailed error in login:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});