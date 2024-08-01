const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set secure to true if using HTTPS
}));

// Serve static files
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/html', express.static(path.join(__dirname, 'public/html')));

// Function to read users from Excel file
function readUsersFromExcel() {
    const filePath = path.join(__dirname, 'users.xlsx');
    if (!fs.existsSync(filePath)) {
        // If file doesn't exist, create an empty one with headers
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet([]);
        xlsx.utils.book_append_sheet(wb, ws, 'Users');
        xlsx.writeFile(wb, filePath);
    }
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets['Users'];
    return xlsx.utils.sheet_to_json(ws);
}

// Function to write users to Excel file
function writeUsersToExcel(users) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(users);
    xlsx.utils.book_append_sheet(wb, ws, 'Users');
    xlsx.writeFile(wb, path.join(__dirname, 'users.xlsx'));
}

// Routes to serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.get('/users', (req, res) => {
    if (req.session.user && req.session.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public/html/users.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/students', (req, res) => {
    if (req.session.user && req.session.role === 'student') {
        res.sendFile(path.join(__dirname, 'public/html/students.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/appointments', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public/html/appointments.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/admin', (req, res) => {
    if (req.session.user && req.session.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public/html/Admin.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/student-management', (req, res) => {
    if (req.session.user && req.session.role === 'student') {
        res.sendFile(path.join(__dirname, 'public/html/student-management.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/student-dashboard', (req, res) => {
    if (req.session.user && req.session.role === 'student') {
        res.sendFile(path.join(__dirname, 'public/html/student-dashboard.html'));
    } else {
        res.redirect('/');
    }
});

// Registration route
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    let users = readUsersFromExcel();
    // Check if user already exists
    if (users.find(user => user.Email === email)) {
        res.status(400).send('User already exists');
    } else {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Add new user
        users.push({ Email: email, Password: hashedPassword, Role: role });
        writeUsersToExcel(users);
        res.redirect('/');
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    let users = readUsersFromExcel();
    const user = users.find(user => user.Email === email && user.Role === role);
    if (user && await bcrypt.compare(password, user.Password)) {
        req.session.user = email;
        req.session.role = role;
        if (role === 'admin') {
            res.redirect('/admin');
        } else if (role === 'student') {
            res.redirect('/students');
        }
    } else {
        res.status(401).send('Invalid email or password');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/');
    });
});

// Starting the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
