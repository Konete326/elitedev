const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Session middleware
app.use(session({
    secret: 'your-secret-key', // Use a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day session expiry
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/portfolio', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  firstname: String,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

// Contact Form Schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true }
});

const Contact = mongoose.model('Contact', contactSchema);

// Signup Route
app.post('/signup', async (req, res) => {
  try {
    const { firstname, username, password } = req.body;
    const user = new User({ firstname, username, password });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error: error.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    // Check if user exists and verify password
    if (user && await bcrypt.compare(password, user.password)) {
      // Store user info in session
      req.session.user = { id: user._id, firstname: user.firstname };
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Logout Route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Error logging out' });
    res.json({ message: 'Logged out successfully' });
  });
});

// Contact Form Route
app.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const contactForm = new Contact({ name, email, subject, message });
    await contactForm.save();
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    res.status(400).json({ message: 'Error sending message', error: error.message });
  }
});

// Admin Login Route
const ADMIN_PASSWORD = 'sameer@24'; // Admin password

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    res.status(200).json({ message: 'Password is correct' });
  } else {
    res.status(403).json({ message: 'Invalid password' });
  }
});

// Admin Route to Fetch Data
app.get('/admin', async (req, res) => {
  try {
    const contacts = await Contact.find();
    const users = await User.find({}, { password: 1, firstname: 1, username: 1 });
    res.json({ contacts, users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

// Check login status
app.get('/check-login', (req, res) => {
  if (req.session.user) {
    const firstLetter = req.session.user.firstname.charAt(0).toUpperCase();
    res.json({ loggedIn: true, firstname: firstLetter });
  } else {
    res.json({ loggedIn: false });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
