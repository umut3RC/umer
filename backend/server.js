const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const PORT = 3000;
const SECRET_KEY = "kral_gizli_anahtar_buraya";

app.use(cors());
app.use(bodyParser.json());

let db;

(async () => {
    try {
        db = await open({
            filename: './database.sqlite',
            driver: sqlite3.Database
        });

        // identityNumber sütunu UNIQUE olarak işaretlendi.
        // Bu, veritabanının aynı TC'den ikinciye asla izin vermemesi demektir.
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                identityNumber TEXT UNIQUE, 
                firstName TEXT,
                lastName TEXT,
                fullAddress TEXT,
                city TEXT,
                district TEXT,
                neighborhood TEXT,
                age INTEGER,
                password TEXT,
                createdAt TEXT
            )
        `);
        console.log("✅ SQLite Database Connected and Tables Ready.");
    } catch (error) {
        console.error("Database initialization error:", error);
    }
})();

const isValidIdentityNumber = (id) => {
    return /^[0-9]{11}$/.test(id);
};

// --- REGISTER ENDPOINT (GÜNCELLENDİ) ---
app.post('/api/register', async (req, res) => {
    try {
        const { identityNumber, firstName, lastName, address, city, district, neighborhood, age, password } = req.body;

        if (!identityNumber || !firstName || !lastName || !password || !age) {
            return res.status(400).json({ error: "Please fill in all required fields." });
        }

        if (!isValidIdentityNumber(identityNumber)) {
            return res.status(400).json({ error: "Invalid Identity Number format." });
        }

        if (age < 18) {
            return res.status(400).json({ error: "You must be over 18 to vote." });
        }

        // 1. KORUMA: Manuel Kontrol
        // Veritabanına bu TC var mı diye soruyoruz.
        const existingUser = await db.get('SELECT identityNumber FROM users WHERE identityNumber = ?', [identityNumber]);
        
        if (existingUser) {
            // Eğer varsa işlemi burada kesip hata dönüyoruz.
            console.log(`[BLOCK] Duplicate registration attempt for: ${identityNumber}`);
            return res.status(409).json({ error: "This Identity Number is already registered!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. KORUMA: Veritabanı Ekleme
        const result = await db.run(
            `INSERT INTO users (identityNumber, firstName, lastName, fullAddress, city, district, neighborhood, age, password, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [identityNumber, firstName, lastName, address, city, district, neighborhood, age, hashedPassword, new Date().toISOString()]
        );

        console.log(`[REGISTER] New User ID: ${result.lastID} - ${firstName} ${lastName}`);

        res.status(201).json({ 
            message: "Registration successful.",
            user: {
                identityNumber: identityNumber,
                fullName: `${firstName} ${lastName}`
            }
        });

    } catch (error) {
        // EKSTRA GÜVENLİK: Eğer yukarıdaki kontrolü bir şekilde aşarsa (race condition),
        // SQLite'ın kendi UNIQUE hatasını yakalıyoruz.
        if (error.code === 'SQLITE_CONSTRAINT') {
            console.error("[DB ERROR] Unique constraint failed.");
            return res.status(409).json({ error: "This Identity Number is already registered! (DB Error)" });
        }

        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { identityNumber, password } = req.body;

        const user = await db.get('SELECT * FROM users WHERE identityNumber = ?', [identityNumber]);
        
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password!" });
        }

        const token = jwt.sign(
            { id: user.id, identityNumber: user.identityNumber, firstName: user.firstName }, 
            SECRET_KEY,
            { expiresIn: '1h' } 
        );

        console.log(`[LOGIN] ${user.firstName} logged in.`);

        res.json({
            message: "Login successful.",
            token: token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                city: user.city
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
});

const verifyToken = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];
    if (!tokenHeader) return res.status(403).json({ error: "Token required." });

    const token = tokenHeader.split(' ')[1];
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid token." });
        req.user = decoded;
        next();
    });
};

app.get('/api/me', verifyToken, async (req, res) => {
    const user = await db.get(
        'SELECT identityNumber, firstName, lastName, fullAddress, city, district, neighborhood, age FROM users WHERE identityNumber = ?', 
        [req.user.identityNumber]
    );
    
    if (user) {
        res.json({
            identityNumber: user.identityNumber,
            firstName: user.firstName,
            lastName: user.lastName,
            address: {
                street: user.fullAddress,
                city: user.city,
                district: user.district,
                neighborhood: user.neighborhood
            },
            age: user.age
        });
    } else {
        res.status(404).json({ error: "User data not found." });
    }
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`   KING BACKEND (SECURE) RUNNING - PORT: ${PORT}`);
    console.log(`=========================================`);
});