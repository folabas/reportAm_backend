const mongoose = require('mongoose');
const dotenv = require('dotenv');
const State = require('../models/state.model');
const City = require('../models/city.model');
const LGA = require('../models/lga.model');
const Community = require('../models/community.model');
const connectDB = require('../config/db');

dotenv.config();

const showIds = async () => {
    await connectDB();

    try {
        console.log('\n--- DATA CHEAT SHEET FOR POSTMAN ---');

        const state = await State.findOne({ name: 'Oyo State' });
        if (state) {
            console.log(`\nSTATE ID (Oyo State): ${state._id}`);

            const city = await City.findOne({ state_id: state._id });
            if (city) {
                console.log(`CITY ID (${city.name}): ${city._id}`);

                const lga = await LGA.findOne({ city_id: city._id });
                if (lga) {
                    console.log(`LGA ID (${lga.name}): ${lga._id}`);

                    const community = await Community.findOne({ lga_id: lga._id, is_approved: true });
                    if (community) {
                        console.log(`COMMUNITY ID (${community.name}): ${community._id}`);
                    } else {
                        console.log('COMMUNITY ID: (No approved communities found yet)');
                    }
                }
            }
        } else {
            console.log('\nNo data found. Please run: node src/utils/seedLocations.js first.');
        }

        console.log('\n------------------------------------\n');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

showIds();
