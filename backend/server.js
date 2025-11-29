import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import crypto from 'crypto'; 
import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';

dotenv.config();

// --- DEVLET SEÇİM SİSTEMİ AYARLARI ---
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "devlet_cok_gizli_anahtar_degistir"; 
const PACKAGE_ID = process.env.PACKAGE_ID;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID;

// --- 1. YSK (ADMIN) CÜZDANINI YÜKLE ---
let adminKeypair;
try {
    const { secretKey } = decodeSuiPrivateKey(process.env.ADMIN_PRIVATE_KEY);
    adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);
    console.log(`🏛️  YSK (Admin) Cüzdanı Yüklendi: ${adminKeypair.toSuiAddress()}`);
} catch (e) {
    console.error("❌ HATA: Admin Private Key okunamadı! .env dosyasını kontrol et.");
}

// --- 2. SERVİSLERİ BAŞLAT ---
const app = express();
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

app.use(cors());
app.use(express.json());

// --- 3. VERİTABANI BAĞLANTISI VE TABLOLAR ---
let db;
(async () => {
    try {
        db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
        
        // A. Vatandaşlar Tablosu (Artık burada pusula bilgisi yok, temiz kimlik verisi)
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
                walletAddress TEXT,
                createdAt TEXT
            )
        `);

        // B. Seçimler Tablosu (YENİ: Çoklu Seçim İçin)
        // Örn: ID: 1, Name: "2025 Genel Seçimleri"
        await db.exec(`
            CREATE TABLE IF NOT EXISTS elections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                description TEXT,
                isActive INTEGER DEFAULT 1,
                createdAt TEXT
            )
        `);

        // C. Oy Geçmişi Tablosu (YENİ)
        // Kim, Hangi Seçim İçin, Hangi Pusulayı Aldı?
        await db.exec(`
            CREATE TABLE IF NOT EXISTS voter_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                electionId INTEGER,
                ticketSuiId TEXT,
                FOREIGN KEY(userId) REFERENCES users(id),
                FOREIGN KEY(electionId) REFERENCES elections(id)
            )
        `);

        // D. Bölgeler ve Adaylar
        await db.exec(`
            CREATE TABLE IF NOT EXISTS regions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                regionName TEXT,
                suiObjectId TEXT UNIQUE,
                createdAt TEXT
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidateName TEXT,
                regionSuiId TEXT,
                suiObjectId TEXT UNIQUE,
                createdAt TEXT
            )
        `);

        console.log("✅ Ulusal Veritabanı (Çoklu Seçim Destekli) Hazır.");
    } catch (error) {
        console.error("Veritabanı Hatası:", error);
    }
})();

// --- 4. CÜZDAN TÜRETME ---
function deriveUserKeypair(identityNumber, password) {
    const input = `${identityNumber}-${password}-${SECRET_KEY}`;
    const hash = crypto.createHash('sha256').update(input).digest();
    return Ed25519Keypair.fromSecretKey(hash);
}

// --- YARDIMCI FONKSİYONLAR ---
const isValidIdentityNumber = (id) => /^[0-9]{11}$/.test(id);

const verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(403).json({ error: "Erişim Yetkisi Yok." });
    jwt.verify(header.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Geçersiz Oturum." });
        req.user = decoded;
        next();
    });
};

// ==========================================
// 🏛️ YSK (ADMIN) - SEÇİM YÖNETİMİ
// ==========================================

// 1. YENİ SEÇİM OLUŞTUR (Örn: "2025 CB Seçimi")
app.post('/api/admin/create-election', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: "Seçim adı gerekli." });

        const result = await db.run(
            `INSERT INTO elections (name, description, createdAt) VALUES (?, ?, ?)`,
            [name, description, new Date().toISOString()]
        );

        res.json({ message: "Seçim dönemi oluşturuldu.", electionId: result.lastID, name });
    } catch (error) {
        res.status(500).json({ error: "Seçim oluşturulamadı." });
    }
});

// 2. AKTİF SEÇİMLERİ LİSTELE (Vatandaşın göreceği liste)
app.get('/api/elections', async (req, res) => {
    try {
        const elections = await db.all('SELECT * FROM elections WHERE isActive = 1');
        res.json(elections);
    } catch (error) {
        res.status(500).json({ error: "Liste çekilemedi." });
    }
});

// 3. BÖLGE OLUŞTUR (Blokzincire Kayıt)
app.post('/api/admin/create-region', async (req, res) => {
    try {
        const { regionName } = req.body;
        if (!adminKeypair || !regionName) return res.status(400).json({ error: "Eksik bilgi veya yetki." });

        console.log(`🌍 Bölge Oluşturuluyor: ${regionName}...`);
        const txb = new Transaction();
        txb.setSender(adminKeypair.toSuiAddress());

        txb.moveCall({
            target: `${PACKAGE_ID}::voting_system::create_region`,
            arguments: [
                txb.object(ADMIN_CAP_ID),
                txb.pure.string(regionName)
            ]
        });

        const result = await suiClient.signAndExecuteTransaction({
            signer: adminKeypair,
            transaction: txb,
            options: { showObjectChanges: true }
        });

        const regionObj = result.objectChanges?.find(o => o.type === 'created' && o.objectType.includes('Region'));
        const regionSuiId = regionObj?.objectId;

        if (!regionSuiId) throw new Error("ID alınamadı.");

        await db.run(
            `INSERT INTO regions (regionName, suiObjectId, createdAt) VALUES (?, ?, ?)`,
            [regionName, regionSuiId, new Date().toISOString()]
        );

        res.json({ message: "Bölge oluşturuldu.", regionName, regionSuiId });
    } catch (error) {
        console.error("Hata:", error);
        res.status(500).json({ error: "Bölge oluşturulamadı." });
    }
});

// 4. ADAY OLUŞTUR (Blokzincire Kayıt)
app.post('/api/admin/create-candidate', async (req, res) => {
    try {
        const { candidateName, regionSuiId } = req.body;
        if (!adminKeypair || !candidateName || !regionSuiId) return res.status(400).json({ error: "Eksik bilgi veya yetki." });

        console.log(`👤 Aday Oluşturuluyor: ${candidateName}...`);
        const txb = new Transaction();
        txb.setSender(adminKeypair.toSuiAddress());

        txb.moveCall({
            target: `${PACKAGE_ID}::voting_system::create_candidate`,
            arguments: [
                txb.object(ADMIN_CAP_ID),
                txb.pure.string(candidateName),
                txb.object(regionSuiId)
            ]
        });

        const result = await suiClient.signAndExecuteTransaction({
            signer: adminKeypair,
            transaction: txb, 
            options: { showObjectChanges: true }
        });

        const candidateObj = result.objectChanges?.find(o => o.type === 'created' && o.objectType.includes('Candidate'));
        const candidateSuiId = candidateObj?.objectId;

        if (!candidateSuiId) throw new Error("ID alınamadı.");

        await db.run(
            `INSERT INTO candidates (candidateName, regionSuiId, suiObjectId, createdAt) VALUES (?, ?, ?, ?)`,
            [candidateName, regionSuiId, candidateSuiId, new Date().toISOString()]
        );

        res.json({ message: "Aday eklendi.", candidateName, candidateSuiId });
    } catch (error) {
        console.error("Hata:", error);
        res.status(500).json({ error: "Aday oluşturulamadı." });
    }
});

// 5. LİSTELEME ENDPOINTLERİ
app.get('/api/regions', async (req, res) => {
    const regions = await db.all('SELECT * FROM regions');
    res.json(regions);
});

app.get('/api/candidates', async (req, res) => {
    const candidates = await db.all('SELECT * FROM candidates');
    res.json(candidates);
});

// ==========================================
// 👤 VATANDAŞ İŞLEMLERİ
// ==========================================

// A. KAYIT
app.post('/api/register', async (req, res) => {
    try {
        const { identityNumber, firstName, lastName, address, city, district, neighborhood, age, password } = req.body;
        if (!isValidIdentityNumber(identityNumber)) return res.status(400).json({ error: "Geçersiz TC." });

        const wallet = deriveUserKeypair(identityNumber, password);
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
            `INSERT INTO users (identityNumber, firstName, lastName, fullAddress, city, district, neighborhood, age, password, walletAddress, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [identityNumber, firstName, lastName, address, city, district, neighborhood, age, hashedPassword, wallet.toSuiAddress(), new Date().toISOString()]
        );

        res.status(201).json({ message: "Kayıt başarılı." });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: "Mükerrer Kayıt." });
        res.status(500).json({ error: "Sistem hatası." });
    }
});

// B. GİRİŞ
app.post('/api/login', async (req, res) => {
    try {
        const { identityNumber, password } = req.body;
        const user = await db.get('SELECT * FROM users WHERE identityNumber = ?', [identityNumber]);
        
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Hatalı giriş." });

        const token = jwt.sign({ id: user.id, identityNumber: user.identityNumber }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            message: "Giriş Başarılı.",
            token: token,
            walletAddress: user.walletAddress,
            user: { firstName: user.firstName, lastName: user.lastName, id: user.id }
        });
    } catch (error) {
        res.status(500).json({ error: "Hata." });
    }
});

// C. VATANDAŞ BİLGİSİ
app.get('/api/me', verifyToken, async (req, res) => {
    const user = await db.get('SELECT identityNumber, firstName, lastName, fullAddress, walletAddress FROM users WHERE identityNumber = ?', [req.user.identityNumber]);
    if (user) res.json(user);
    else res.status(404).json({ error: "Bulunamadı." });
});

// D. PUSULA İSTE (ÇOKLU SEÇİM DESTEKLİ) 🎁
app.post('/api/voter/assign-ticket', verifyToken, async (req, res) => {
    try {
        const { targetWalletAddress, electionId } = req.body; 
        
        if (!electionId) return res.status(400).json({ error: "Hangi seçim için pusula istediğinizi belirtin (electionId)." });

        // 1. KONTROL: Bu seçim için daha önce almış mı?
        const history = await db.get(
            'SELECT * FROM voter_history WHERE userId = ? AND electionId = ?', 
            [req.user.id, electionId]
        );

        if (history) {
            return res.status(400).json({ error: "Bu seçim için zaten pusula aldınız!" });
        }

        if (!adminKeypair) return res.status(500).json({ error: "YSK sistemi devre dışı." });

        console.log(`🎁 Seçim #${electionId} için Pusula + Harçlık gönderiliyor...`);

        const txb = new Transaction();
        txb.setSender(adminKeypair.toSuiAddress());

        const tcBytes = new TextEncoder().encode(req.user.identityNumber);

        // Pusula Gönder
        txb.moveCall({
            target: `${PACKAGE_ID}::voting_system::register_voter`,
            arguments: [
                txb.object(ADMIN_CAP_ID),
                txb.pure.address(targetWalletAddress),
                txb.pure.vector('u8', tcBytes)
            ],
        });

        // Harçlık Gönder (0.05 SUI)
        const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(50000000)]);
        txb.transferObjects([coin], txb.pure.address(targetWalletAddress));

        const result = await suiClient.signAndExecuteTransaction({
            signer: adminKeypair,
            transaction: txb,
            options: { showObjectChanges: true }
        });

        const ticketId = result.objectChanges?.find(o => o.type === 'created' && o.objectType.includes('CitizenVote'))?.objectId;

        if (!ticketId) throw new Error("Pusula oluşturulamadı.");

        // 2. KAYIT: Tarihçeye ekle
        await db.run(
            `INSERT INTO voter_history (userId, electionId, ticketSuiId) VALUES (?, ?, ?)`,
            [req.user.id, electionId, ticketId]
        );

        res.json({ success: true, voteTicketId: ticketId, message: "Pusula teslim edildi." });

    } catch (error) {
        console.error("Pusula Hatası:", error);
        res.status(500).json({ error: "Pusula teslim edilemedi." });
    }
});

// E. OY KULLANMA (Devlet Sponsorlu)
app.post('/api/vote/sponsor', verifyToken, async (req, res) => {
    try {
        const { signerAddress, voteTicketId, candidateId, regionId } = req.body;
        
        // 1. İşlem Hazırlanıyor
        // DİKKAT: Burada işlem henüz çalışmıyor, sadece paketleniyor.
        // Asıl "Oy Artırma" işlemi, bu paket Frontend'de imzalanıp
        // Blokzincire gönderildiği an (Move Contract içinde) gerçekleşecek.
        const txb = new Transaction();
        txb.setSender(signerAddress);

        txb.moveCall({
            target: `${PACKAGE_ID}::voting_system::cast_vote`,
            arguments: [
                txb.object(voteTicketId),
                txb.object(candidateId),
                txb.object(regionId)
            ],
        });

        const transactionBlockKindBytes = await txb.build({ client: suiClient });
        const txBytesBase64 = Buffer.from(transactionBlockKindBytes).toString('base64');

        res.json({ sponsoredTx: { bytes: txBytesBase64 } });

    } catch (error) {
        console.error("İşlem Hatası:", error);
        res.status(500).json({ error: "İşlem hazırlanamadı." });
    }
});

app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(` 🇹🇷 ULUSAL SEÇİM SİSTEMİ (ÇOKLU SEÇİM) DEVREDE`);
    console.log(` 🔌 PORT: ${PORT}`);
    console.log(` 🔗 AĞ: SUI TESTNET`);
    console.log(`========================================================`);
});