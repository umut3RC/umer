import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import crypto from 'crypto'; 
import { EnokiClient } from '@mysten/enoki';
import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';

// Çevresel değişkenleri yükle
dotenv.config();

// --- AYARLAR ---
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "kral_gizli_anahtar_degistir"; 
const PACKAGE_ID = process.env.PACKAGE_ID;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID;

// --- 1. ADMIN CÜZDANINI YÜKLE (Pusula Dağıtmak İçin) ---
let adminKeypair;
try {
    // .env dosyasındaki 'suiprivkey...' ile başlayan anahtarı çözer
    const { secretKey } = decodeSuiPrivateKey(process.env.ADMIN_PRIVATE_KEY);
    adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);
    console.log(`👑 Admin Cüzdanı Yüklendi: ${adminKeypair.toSuiAddress()}`);
} catch (e) {
    console.error("❌ Admin Private Key Hatalı veya Eksik! (.env dosyasını kontrol et)");
    // Hata olsa da sunucuyu başlatıyoruz ama pusula dağıtımı çalışmaz.
}

// --- 2. SERVİSLERİ BAŞLAT ---
const app = express();
const enoki = new EnokiClient({ apiKey: process.env.ENOKI_API_KEY });
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

app.use(cors());
app.use(express.json());

// --- 3. VERİTABANI BAĞLANTISI ---
let db;
(async () => {
    try {
        db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
        
        // Tabloyu oluştur (TC No Unique + hasReceivedTicket sütunu var)
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
                hasReceivedTicket INTEGER DEFAULT 0,
                createdAt TEXT
            )
        `);
        console.log("✅ Veritabanı Hazır.");
    } catch (error) {
        console.error("Veritabanı Hatası:", error);
    }
})();

// --- 4. SİHİRLİ FONKSİYON: CÜZDAN TÜRETME ---
// TC ve Şifre aynı olduğu sürece hep aynı cüzdan adresini verir.
function deriveUserKeypair(identityNumber, password) {
    const input = `${identityNumber}-${password}-${SECRET_KEY}`;
    // SHA-256 hash fonksiyonu ile sabit bir anahtar üret
    const hash = crypto.createHash('sha256').update(input).digest();
    return Ed25519Keypair.fromSecretKey(hash);
}

// --- YARDIMCI FONKSİYONLAR ---
const isValidIdentityNumber = (id) => /^[0-9]{11}$/.test(id);

const verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(403).json({ error: "Token gerekli." });
    
    jwt.verify(header.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Geçersiz Token." });
        req.user = decoded;
        next();
    });
};

// --- ENDPOINTLER ---

// A. KULLANICI KAYDI
app.post('/api/register', async (req, res) => {
    try {
        const { identityNumber, firstName, lastName, address, city, district, neighborhood, age, password } = req.body;

        if (!identityNumber || !firstName || !lastName || !password || !age) {
            return res.status(400).json({ error: "Eksik bilgi." });
        }
        if (!isValidIdentityNumber(identityNumber)) {
            return res.status(400).json({ error: "Geçersiz TC Formatı." });
        }
        if (age < 18) {
            return res.status(400).json({ error: "Yaşınız 18'den küçük." });
        }

        // 1. Yazılımsal Kontrol
        const existingUser = await db.get('SELECT identityNumber FROM users WHERE identityNumber = ?', [identityNumber]);
        if (existingUser) {
            return res.status(409).json({ error: "Bu TC zaten kayıtlı!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Veritabanı Kaydı
        await db.run(
            `INSERT INTO users (identityNumber, firstName, lastName, fullAddress, city, district, neighborhood, age, password, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [identityNumber, firstName, lastName, address, city, district, neighborhood, age, hashedPassword, new Date().toISOString()]
        );

        res.status(201).json({ message: "Kayıt Başarılı." });

    } catch (error) {
        // Çift dikiş güvenlik: DB hatasını yakala
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: "Bu TC zaten kayıtlı! (DB)" });
        }
        console.error("Register Error:", error);
        res.status(500).json({ error: "Sunucu Hatası." });
    }
});

// B. GİRİŞ YAP (Deterministik Cüzdan Adresi Döner)
app.post('/api/login', async (req, res) => {
    try {
        const { identityNumber, password } = req.body;

        const user = await db.get('SELECT * FROM users WHERE identityNumber = ?', [identityNumber]);
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Hatalı Bilgiler." });
        }

        // Cüzdan adresini anlık hesapla (DB'de tutmuyoruz, anlık türüyor)
        const wallet = deriveUserKeypair(identityNumber, password);
        const walletAddress = wallet.toSuiAddress();

        const token = jwt.sign(
            { id: user.id, identityNumber: user.identityNumber }, 
            SECRET_KEY, 
            { expiresIn: '1h' }
        );

        res.json({
            message: "Giriş Başarılı.",
            token: token,
            walletAddress: walletAddress, // Frontend bu adresi saklayacak
            hasReceivedTicket: !!user.hasReceivedTicket, // Pusulası var mı?
            user: {
                firstName: user.firstName,
                lastName: user.lastName
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Sunucu Hatası." });
    }
});

// C. PROFİL SORGULA
app.get('/api/me', verifyToken, async (req, res) => {
    const user = await db.get(
        'SELECT identityNumber, firstName, lastName, fullAddress, city, district, neighborhood, age, hasReceivedTicket FROM users WHERE identityNumber = ?', 
        [req.user.identityNumber]
    );
    
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }
});

// D. PUSULA İSTE (Admin Gönderir)
// Frontend, kullanıcının hesaplanan adresini buraya yollar.
app.post('/api/voter/assign-ticket', verifyToken, async (req, res) => {
    try {
        const { targetWalletAddress } = req.body; 

        // Kontrol: Daha önce almış mı?
        const user = await db.get('SELECT hasReceivedTicket FROM users WHERE identityNumber = ?', [req.user.identityNumber]);
        if (user.hasReceivedTicket) return res.status(400).json({ error: "Zaten oy pusulası aldınız." });

        if (!adminKeypair) return res.status(500).json({ error: "Admin sistemi hazır değil." });

        const txb = new Transaction();
        txb.setSender(adminKeypair.toSuiAddress());

        // TC'yi Move kontratının istediği formatta (byte array) hazırla
        const tcBytes = new TextEncoder().encode(req.user.identityNumber);

        // Move Fonksiyonunu Çağır
        txb.moveCall({
            target: `${PACKAGE_ID}::voting_system::register_voter`,
            arguments: [
                txb.object(ADMIN_CAP_ID),
                txb.pure.address(targetWalletAddress), // Pusula kullanıcının adresine gider
                txb.pure.vector('u8', tcBytes)
            ],
        });

        // Admin imzalar ve gönderir (Gas ücreti Admin'den çıkar)
        const result = await suiClient.signAndExecuteTransactionBlock({
            signer: adminKeypair,
            transactionBlock: txb,
            options: { showObjectChanges: true }
        });

        // Veritabanını güncelle
        await db.run('UPDATE users SET hasReceivedTicket = 1 WHERE identityNumber = ?', [req.user.identityNumber]);

        // Oluşan Ticket ID'sini bulup frontend'e dön
        const ticketId = result.objectChanges?.find(o => o.type === 'created' && o.objectType.includes('CitizenVote'))?.objectId;

        res.json({ success: true, voteTicketId: ticketId });

    } catch (error) {
        console.error("Assign Ticket Error:", error);
        res.status(500).json({ error: "Pusula tanımlama başarısız." });
    }
});

// E. OY KULLAN (Enoki Sponsorlu)
// Kullanıcı Frontend'de "Oy Ver"e basınca burası çalışır.
app.post('/api/vote/sponsor', verifyToken, async (req, res) => {
    try {
        // signerAddress: Kullanıcının kendi adresi
        const { signerAddress, voteTicketId, candidateId, regionId } = req.body;

        const txb = new Transaction();
        txb.setSender(signerAddress);

        // Kullanıcı kendi cüzdanıyla moveCall yapar
        txb.moveCall({
            target: `${PACKAGE_ID}::voting_system::cast_vote`,
            arguments: [
                txb.object(voteTicketId),
                txb.object(candidateId),
                txb.object(regionId)
            ],
        });

        // İşlemi byte dizisine çevir
        const transactionBlockKindBytes = await txb.build({ client: suiClient, onlyTransactionKind: true });

        // Enoki API'ye gönder ve sponsorluk (imza) iste
        const sponsoredTx = await enoki.createSponsoredTransaction({
            network: 'testnet',
            transactionBlockKindBytes,
            sender: signerAddress,
            allowedAddresses: [signerAddress]
        });

        // Sponsorlanmış işlemi frontend'e geri dön (Kullanıcı imzalayacak)
        res.json({ sponsoredTx });

    } catch (error) {
        console.error("Sponsor Error:", error);
        res.status(500).json({ error: "Sponsorluk işlemi başarısız." });
    }
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`   MODERN KRAL BACKEND ÇALIŞIYOR: ${PORT}`);
    console.log(`=========================================`);
});