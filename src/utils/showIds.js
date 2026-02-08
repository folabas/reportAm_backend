const mongoose = require('mongoose');
const dotenv = require('dotenv');
const State = require('../models/state.model');
const LGA = require('../models/lga.model');
const Community = require('../models/community.model');
const connectDB = require('../config/db');

dotenv.config();

const showIds = async () => {
    await connectDB();

    try {
        console.log('\n--- DATA CHEAT SHEET FOR POSTMAN ---');

        // Get Lagos as an example
        const state = await State.findOne({ name: 'Lagos' });
        if (state) {
            console.log(`\nSTATE ID (Lagos): ${state._id}`);

            const lga = await LGA.findOne({ state_id: state._id });
            if (lga) {
                console.log(`LGA ID (${lga.name}): ${lga._id}`);

                const community = await Community.findOne({ lga_id: lga._id, is_approved: true });
                if (community) {
                    console.log(`COMMUNITY ID (${community.name}): ${community._id}`);
                } else {
                    console.log('COMMUNITY ID: (No approved communities found yet in Lagos)');
                }
            }
        } else {
            const anyState = await State.findOne({});
            if (anyState) {
                console.log(`\nSTATE ID (${anyState.name}): ${anyState._id}`);
            } else {
                console.log('\nNo states found. Please run: node src/utils/seedLocations.js');
            }
        }

        console.log('\n------------------------------------\n');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

showIds();

