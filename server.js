// ============================================================
//  server.js  —  DevForm Registration Backend
//  Stack : Node.js + Express
//  Storage : In-memory array (no DB required for demo)
// ============================================================

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));          // serve index.html

// ── In-memory "database" ─────────────────────────────────────
const users = [];

// ── Server-side validation helper ───────────────────────────
function validateUser(data) {
  const errors = [];
  const { name, email, phone, age, password } = data;

  /* Name */
  if (!name || typeof name !== 'string')
    errors.push('Name is required.');
  else if (name.trim().length < 2)
    errors.push('Name must be at least 2 characters.');
  else if (!/^[a-zA-Z\s'-]+$/.test(name.trim()))
    errors.push('Name may only contain letters, spaces, hyphens, or apostrophes.');

  /* Email */
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!email || typeof email !== 'string')
    errors.push('Email is required.');
  else if (!emailRe.test(email.trim()))
    errors.push('Email format is invalid.');
  else if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase()))
    errors.push('This email is already registered.');

  /* Phone */
  const phoneRe = /^[+]?[\d\s\-().]{7,15}$/;
  if (!phone || typeof phone !== 'string')
    errors.push('Phone number is required.');
  else if (!phoneRe.test(phone.trim()))
    errors.push('Phone number must be 7–15 digits and can include +, -, spaces.');

  /* Age */
  const parsedAge = parseInt(age, 10);
  if (age === undefined || age === null || age === '')
    errors.push('Age is required.');
  else if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120)
    errors.push('Age must be a number between 1 and 120.');

  /* Password */
  if (!password || typeof password !== 'string')
    errors.push('Password is required.');
  else {
    if (password.length < 8)
      errors.push('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(password))
      errors.push('Password must include at least one uppercase letter.');
    if (!/[0-9]/.test(password))
      errors.push('Password must include at least one number.');
    if (!/[^a-zA-Z0-9]/.test(password))
      errors.push('Password must include at least one special character.');
  }

  return errors;
}

// ── Routes ───────────────────────────────────────────────────

/* Serve the HTML form */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* POST /register — server-side validation + store */
app.post('/register', (req, res) => {
  const { name, email, phone, age, password } = req.body;

  const errors = validateUser({ name, email, phone, age, password });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors
    });
  }

  // Store (never store raw passwords in production — hash with bcrypt)
  const newUser = {
    id:        users.length + 1,
    name:      name.trim(),
    email:     email.trim().toLowerCase(),
    phone:     phone.trim(),
    age:       parseInt(age, 10),
    // In production: password: await bcrypt.hash(password, 10)
    password:  '***hidden***',
    createdAt: new Date().toISOString()
  };
  users.push(newUser);

  console.log(`[${new Date().toLocaleTimeString()}] ✅ Registered: ${newUser.name} <${newUser.email}>`);

  res.status(201).json({
    success: true,
    message: `Welcome, ${newUser.name}! Your account has been created.`,
    user: {
      id:    newUser.id,
      name:  newUser.name,
      email: newUser.email
    }
  });
});

/* GET /users — return all registered users (passwords excluded) */
app.get('/users', (req, res) => {
  const safeUsers = users.map(({ password, ...rest }) => rest);
  res.json({ success: true, count: safeUsers.length, users: safeUsers });
});

/* Health check */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime().toFixed(1) + 's', registeredUsers: users.length });
});

/* 404 fallback */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ⚡ DevForm Server running');
  console.log(`  ➜  Local: http://localhost:${PORT}`);
  console.log('');
});
