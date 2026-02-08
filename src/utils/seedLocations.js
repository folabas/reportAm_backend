const mongoose = require('mongoose');
const dotenv = require('dotenv');
const State = require('../models/state.model');
const City = require('../models/city.model');
const LGA = require('../models/lga.model');
const connectDB = require('../config/db');

dotenv.config();

const seedLocations = async () => {
    await connectDB();

    try {
        // Clear existing
        await State.deleteMany({});
        await City.deleteMany({});
        await LGA.deleteMany({});

        // 1. Create State
        const oyoState = await State.create({ name: 'Oyo State' });

        // 2. Create City
        const ibadan = await City.create({
            name: 'Ibadan',
            state_id: oyoState._id
        });

        // 3. Create LGAs (Example sets for Ibadan)
        const lgas = [
            'Ibadan North',
            'Ibadan North-East',
            'Ibadan North-West',
            'Ibadan South-East',
            'Ibadan South-West',
            'Akinyele',
            'Egbeda',
            'Ido',
            'Lagelu',
            'Ona Ara',
            'Oluyole'
        ];

        for (const lgaName of lgas) {
            await LGA.create({
                name: lgaName,
                city_id: ibadan._id,
                state_id: oyoState._id
            });
        }

        console.log('Location data seeded successfully (Oyo State -> Ibadan)');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedLocations();
