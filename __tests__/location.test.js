const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const State = require('../src/models/state.model');
const LGA = require('../src/models/lga.model');

let mongoServer;
let testStateId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test state with code
    const testState = await State.create({ name: 'Oyo State', code: 'OY' });
    testStateId = testState._id.toString();

    // Create test LGAs
    await LGA.create([
        { name: 'Ibadan North', state_id: testStateId },
        { name: 'Ibadan South-West', state_id: testStateId }
    ]);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Location Endpoints', () => {
    describe('GET /api/locations/states', () => {
        it('should return all states wrapped in data property', async () => {
            const response = await request(app).get('/api/locations/states');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should include id field in state objects', async () => {
            const response = await request(app).get('/api/locations/states');

            expect(response.status).toBe(200);
            const state = response.body.data[0];
            expect(state).toHaveProperty('_id');
            expect(state).toHaveProperty('id');
            expect(state).toHaveProperty('name');
            expect(state.id).toBe(state._id);
        });

        it('should include code field if present', async () => {
            const response = await request(app).get('/api/locations/states');

            expect(response.status).toBe(200);
            const oyoState = response.body.data.find(s => s.name === 'Oyo State');
            expect(oyoState).toBeDefined();
            expect(oyoState.code).toBe('OY');
        });

        it('should return states sorted by name', async () => {
            // Create another state
            await State.create({ name: 'Abia State', code: 'AB' });

            const response = await request(app).get('/api/locations/states');

            expect(response.status).toBe(200);
            const names = response.body.data.map(s => s.name);
            const sortedNames = [...names].sort();
            expect(names).toEqual(sortedNames);
        });
    });

    describe('GET /api/locations/states/:stateId/lgas', () => {
        it('should return LGAs for a specific state wrapped in data property', async () => {
            const response = await request(app)
                .get(`/api/locations/states/${testStateId}/lgas`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(2);
        });

        it('should include id field in LGA objects', async () => {
            const response = await request(app)
                .get(`/api/locations/states/${testStateId}/lgas`);

            expect(response.status).toBe(200);
            const lga = response.body.data[0];
            expect(lga).toHaveProperty('_id');
            expect(lga).toHaveProperty('id');
            expect(lga).toHaveProperty('name');
            expect(lga).toHaveProperty('state_id');
            expect(lga.id).toBe(lga._id);
        });

        it('should return LGAs sorted by name', async () => {
            const response = await request(app)
                .get(`/api/locations/states/${testStateId}/lgas`);

            expect(response.status).toBe(200);
            const names = response.body.data.map(l => l.name);
            const sortedNames = [...names].sort();
            expect(names).toEqual(sortedNames);
        });

        it('should return empty array for state with no LGAs', async () => {
            const emptyState = await State.create({ name: 'Empty State', code: 'ES' });
            const response = await request(app)
                .get(`/api/locations/states/${emptyState._id}/lgas`);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });

        it('should handle invalid state ID', async () => {
            const response = await request(app)
                .get('/api/locations/states/invalid-id/lgas');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Invalid ID format');
        });
    });
});
