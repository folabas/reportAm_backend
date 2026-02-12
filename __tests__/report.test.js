const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Report = require('../src/models/report.model');
const State = require('../src/models/state.model');
const LGA = require('../src/models/lga.model');
const AffectedReport = require('../src/models/affectedReport.model');
const path = require('path');
const fs = require('fs');

let mongoServer;
let testStateId;
let testLgaId;
let testReportId;

// Create a test image file
const testImagePath = path.join(__dirname, 'test-image.jpg');
const createTestImage = () => {
    // Create a minimal valid JPEG file (1x1 pixel)
    const buffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, buffer);
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test image
    createTestImage();

    // Create test state and LGA
    const testState = await State.create({ name: 'Test State', code: 'TS' });
    testStateId = testState._id.toString();

    const testLga = await LGA.create({ name: 'Test LGA', state_id: testStateId });
    testLgaId = testLga._id.toString();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();

    // Clean up test image
    if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
    }
});

beforeEach(async () => {
    await Report.deleteMany({});
    await AffectedReport.deleteMany({});
});

describe('Report Endpoints', () => {
    describe('POST /api/reports', () => {
        it('should create a new report with image upload', async () => {
            const response = await request(app)
                .post('/api/reports')
                .field('type', 'community')
                .field('category', 'Road')
                .field('description', 'Test report description')
                .field('city_id', testStateId)
                .field('address_text', 'Test address')
                .field('community_name', 'Test Community')
                .attach('image', testImagePath);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Report created successfully');
            expect(response.body).toHaveProperty('report');
            expect(response.body.report).toHaveProperty('_id');
            expect(response.body.report.type).toBe('community');
            expect(response.body.report.category).toBe('Road');
            expect(response.body.report.affected_count).toBe(0);
            expect(response.body.report.image).toMatch(/^\/uploads\//);

            testReportId = response.body.report._id;
        });

        it('should accept state_id instead of city_id', async () => {
            const response = await request(app)
                .post('/api/reports')
                .field('type', 'general')
                .field('category', 'Security')
                .field('description', 'Test report')
                .field('state_id', testStateId)
                .field('address_text', 'Test address')
                .field('community_name', 'Test Community')
                .attach('image', testImagePath);

            expect(response.status).toBe(201);
            expect(response.body.report.state_id).toBe(testStateId);
        });

        it('should return 400 when missing required fields', async () => {
            const response = await request(app)
                .post('/api/reports')
                .field('type', 'community')
                .field('category', 'Road')
                .attach('image', testImagePath);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Missing required fields');
            expect(response.body).toHaveProperty('missing');
        });

        it('should return 400 when image is missing', async () => {
            const response = await request(app)
                .post('/api/reports')
                .field('type', 'community')
                .field('category', 'Road')
                .field('description', 'Test report')
                .field('city_id', testStateId)
                .field('address_text', 'Test address')
                .field('community_name', 'Test Community');

            expect(response.status).toBe(400);
            expect(response.body.missing).toContain('image');
        });

        it('should handle optional fields correctly', async () => {
            const response = await request(app)
                .post('/api/reports')
                .field('type', 'community')
                .field('category', 'Road')
                .field('description', 'Test report')
                .field('city_id', testStateId)
                .field('lga_id', testLgaId)
                .field('address_text', 'Test address')
                .field('community_name', 'Test Community')
                .field('lat', '6.5244')
                .field('lng', '3.3792')
                .field('is_emergency', 'true')
                .attach('image', testImagePath);

            expect(response.status).toBe(201);
            expect(response.body.report.lga_id).toBe(testLgaId);
            expect(response.body.report.lat).toBe(6.5244);
            expect(response.body.report.lng).toBe(3.3792);
            expect(response.body.report.is_emergency).toBe(true);
        });
    });

    describe('POST /api/reports/emergency', () => {
        it('should create emergency report with is_emergency flag', async () => {
            const response = await request(app)
                .post('/api/reports/emergency')
                .field('type', 'general')
                .field('category', 'Security')
                .field('description', 'Emergency SOS')
                .field('city_id', testStateId)
                .field('address_text', 'Emergency location')
                .field('community_name', 'Test Community')
                .attach('image', testImagePath);

            expect(response.status).toBe(201);
            expect(response.body.report.is_emergency).toBe(true);
        });
    });

    describe('GET /api/reports', () => {
        beforeEach(async () => {
            // Create test reports
            await Report.create([
                {
                    type: 'community',
                    category: 'Road',
                    image: '/uploads/test1.jpg',
                    description: 'Test 1',
                    state_id: testStateId,
                    address_text: 'Address 1',
                    community_name: 'Community 1',
                    status: 'pending'
                },
                {
                    type: 'general',
                    category: 'Security',
                    image: '/uploads/test2.jpg',
                    description: 'Test 2',
                    state_id: testStateId,
                    address_text: 'Address 2',
                    community_name: 'Community 2',
                    status: 'resolved',
                    is_emergency: true
                }
            ]);
        });

        it('should get all reports with pagination', async () => {
            const response = await request(app).get('/api/reports');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('reports');
            expect(response.body).toHaveProperty('page', 1);
            expect(response.body).toHaveProperty('pages');
            expect(response.body).toHaveProperty('total', 2);
            expect(response.body.reports).toHaveLength(2);
            expect(response.body.reports[0]).toHaveProperty('affected_count');
        });

        it('should filter by status', async () => {
            const response = await request(app).get('/api/reports?status=pending');

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(1);
            expect(response.body.reports[0].status).toBe('pending');
        });

        it('should filter by is_emergency', async () => {
            const response = await request(app).get('/api/reports?is_emergency=true');

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(1);
            expect(response.body.reports[0].is_emergency).toBe(true);
        });

        it('should filter by category', async () => {
            const response = await request(app).get('/api/reports?category=Road');

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(1);
            expect(response.body.reports[0].category).toBe('Road');
        });
    });

    describe('POST /api/reports/:id/affected', () => {
        let reportId;

        beforeEach(async () => {
            const report = await Report.create({
                type: 'community',
                category: 'Road',
                image: '/uploads/test.jpg',
                description: 'Test',
                state_id: testStateId,
                address_text: 'Address',
                community_name: 'Community',
                status: 'pending'
            });
            reportId = report._id.toString();
        });

        it('should mark user as affected', async () => {
            const response = await request(app)
                .post(`/api/reports/${reportId}/affected`)
                .send({ fingerprint: 'test-fingerprint' });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Marked as affected');
            expect(response.body).toHaveProperty('affected_count', 1);
        });

        it('should prevent duplicate affected marks', async () => {
            await request(app)
                .post(`/api/reports/${reportId}/affected`)
                .send({ fingerprint: 'test-fingerprint' });

            const response = await request(app)
                .post(`/api/reports/${reportId}/affected`)
                .send({ fingerprint: 'test-fingerprint' });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already marked');
        });
    });

    describe('DELETE /api/reports/:id/affected', () => {
        let reportId;

        beforeEach(async () => {
            const report = await Report.create({
                type: 'community',
                category: 'Road',
                image: '/uploads/test.jpg',
                description: 'Test',
                state_id: testStateId,
                address_text: 'Address',
                community_name: 'Community',
                status: 'pending'
            });
            reportId = report._id.toString();

            await request(app)
                .post(`/api/reports/${reportId}/affected`)
                .send({ fingerprint: 'test-fingerprint' });
        });

        it('should remove affected status', async () => {
            const response = await request(app)
                .delete(`/api/reports/${reportId}/affected`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Unmarked as affected');
            expect(response.body).toHaveProperty('affected_count', 0);
        });
    });
});

module.exports = { testStateId, testLgaId };
