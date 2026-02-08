const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const State = require('../models/state.model');
const LGA = require('../models/lga.model');
const City = require('../models/city.model'); // Still imported to clear it
const connectDB = require('../config/db');

dotenv.config();

const seedLocations = async () => {
    await connectDB();

    try {
        console.log('Clearing existing location data...');
        await State.deleteMany({});
        await City.deleteMany({});
        await LGA.deleteMany({});

        // Drop LGA indices to handle schema change (name_1_city_id_1 -> name_1_state_id_1)
        try {
            await LGA.collection.dropIndexes();
            console.log('LGA indexes dropped.');
        } catch (e) {
            console.log('No LGA indexes to drop or error dropping them.');
        }

        const filePath = path.join(__dirname, '../states_lga/gistfile1.txt');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // The data is an array containing one object with a "states" property
        const statesData = data[0].states;

        console.log(`Starting to seed ${statesData.length} states...`);

        for (const stateData of statesData) {
            const state = await State.create({ name: stateData.name });
            console.log(`Seeding LGAs for ${state.name}...`);

            const lgaPromises = stateData.lgas.map(lgaName => {
                return LGA.create({
                    name: lgaName,
                    state_id: state._id
                });
            });

            await Promise.all(lgaPromises);
        }

        console.log('Location data seeded successfully (Nigeria States & LGAs)');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedLocations();
