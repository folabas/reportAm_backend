const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Report = require('../src/models/report.model');
const Admin = require('../src/models/admin.model');
const State = require('../src/models/state.model');
const bcrypt = require('bcryptjs');

let mongoServer;
let adminToken;
let testStateId;
let testReportId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test state
    const testState = await State.create({ name: 'Test State', code: 'TS' });
    testStateId = testState._id.toString();

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Test Admin'
    });

    // Generate admin token
    adminToken = jwt.sign(
        { id: admin._id, email: admin.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1d' }
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Report.deleteMany({});
});

describe('Admin Endpoints', () => {
    describe('PATCH /api/admin/reports/:id/status', () => {
        beforeEach(async () => {
            const report = await Report.create({
                type: 'community',
                category: 'Road',
                image: '/uploads/test.jpg',
                description: 'Test report',
                state_id: testStateId,
                address_text: 'Test address',
                community_name: 'Test Community',
                status: 'pending'
            });
            testReportId = report._id.toString();
        });

        it('should update report status to in_progress', async () => {
            const response = await request(app)
                .patch(`/api/admin/reports/${testReportId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'in_progress' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('in_progress');
            expect(response.body.report.status).toBe('in_progress');
        });

        it('should update report status to resolved', async () => {
            const response = await request(app)
                .patch(`/api/admin/reports/${testReportId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'resolved' });

            expect(response.status).toBe(200);
            expect(response.body.report.status).toBe('resolved');
        });

        it('should update report status to pending', async () => {
            const response = await request(app)
                .patch(`/api/admin/reports/${testReportId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'pending' });

            expect(response.status).toBe(200);
            expect(response.body.report.status).toBe('pending');
        });

        it('should reject invalid status', async () => {
            const response = await request(app)
                .patch(`/api/admin/reports/${testReportId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'invalid_status' });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Invalid status');
            expect(response.body.message).toContain('pending, in_progress, or resolved');
        });

        it('should return 404 for non-existent report', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .patch(`/api/admin/reports/${fakeId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'resolved' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Report not found');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .patch(`/api/admin/reports/${testReportId}/status`)
                .send({ status: 'resolved' });

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /api/admin/reports/:id', () => {
        beforeEach(async () => {
            const report = await Report.create({
                type: 'community',
                category: 'Road',
                image: '/uploads/test.jpg',
                description: 'Test report',
                state_id: testStateId,
                address_text: 'Test address',
                community_name: 'Test Community',
                status: 'pending'
            });
            testReportId = report._id.toString();
        });

        it('should delete report successfully', async () => {
            const response = await request(app)
                .delete(`/api/admin/reports/${testReportId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Report deleted successfully');

            // Verify report is deleted
            const deletedReport = await Report.findById(testReportId);
            expect(deletedReport).toBeNull();
        });

        it('should return 404 for non-existent report', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/admin/reports/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Report not found');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .delete(`/api/admin/reports/${testReportId}`);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/admin/reports', () => {
        beforeEach(async () => {
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
                    status: 'resolved'
                },
                {
                    type: 'community',
                    category: 'Drainage',
                    image: '/uploads/test3.jpg',
                    description: 'Test 3',
                    state_id: testStateId,
                    address_text: 'Address 3',
                    community_name: 'Community 3',
                    status: 'in_progress'
                }
            ]);
        });

        it('should get all reports with affected counts', async () => {
            const response = await request(app)
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toHaveProperty('affected_count');
        });

        it('should filter by status', async () => {
            const response = await request(app)
                .get('/api/admin/reports?status=pending')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].status).toBe('pending');
        });

        it('should filter by type', async () => {
            const response = await request(app)
                .get('/api/admin/reports?type=community')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            response.body.forEach(report => {
                expect(report.type).toBe('community');
            });
        });
    });
});
