const request = require('supertest');
const path = require('path');
const fs = require('fs');
// Removed server and mongoose requires to avoid DB connection side effects


// Create a dummy image file for testing
const testImagePath = path.join(__dirname, 'test-image.jpg');
if (!fs.existsSync(testImagePath)) {
    // Create a 1x1 pixel dummy jpg
    const buffer = Buffer.from('ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080d141e17131310131d161a292631302b262828373f5546373b503d2828405841454c4e515354512e36585e574f5c4a515151ffc0000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090affda000c03010002110311003f00bf00ff00', 'hex');
    fs.writeFileSync(testImagePath, buffer);
}

// Standalone verification script

// Standalone script to verify upload
const express = require('express');
const { upload, handleMulterError } = require('./src/config/multer.config');

const testUpload = async () => {
    console.log('Starting Cloudinary upload test...');

    // Check if env vars are loaded
    require('dotenv').config();
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.error('Error: CLOUDINARY_CLOUD_NAME not found in .env');
        return;
    }

    try {
        // We will manually invoke the storage engine to test configuration
        const req = {
            file: {
                fieldname: 'image',
                originalname: 'test-image.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                buffer: fs.readFileSync(testImagePath)
            }
        };

        // Multer-storage-cloudinary doesn't expose a simple "upload" method easily for unit testing without req/res flow
        // So we will spin up a temporary server to test the full flow

        const app = express();

        app.post('/test-upload', upload.single('image'), handleMulterError, (req, res) => {
            if (req.file && req.file.path && req.file.path.includes('cloudinary')) {
                res.json({ success: true, url: req.file.path });
            } else {
                res.status(500).json({ success: false, file: req.file, message: 'File not uploaded or path missing' });
            }
        });

        const port = 3001;
        const server = app.listen(port, () => {
            console.log(`Test server running on port ${port}`);

            // Send request
            request(app)
                .post('/test-upload')
                .attach('image', testImagePath)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        console.error('Upload failed:', JSON.stringify(err, null, 2));
                        console.error('Response body:', res ? JSON.stringify(res.body, null, 2) : 'No response');
                        console.error('Response text:', res ? res.text : 'No response text');
                    } else {
                        console.log('Upload successful! URL:', res.body.url);
                    }
                    server.close();
                    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
                });
        });

    } catch (error) {
        console.error('Test execution error:', error);
    }
};

testUpload();
