const express = require('express');
const router = express.Router();
const {
    getStates,
    getCities,
    getLGAs,
    getCommunities,
    getGlobalCommunities
} = require('../controllers/location.controller');

router.get('/states', getStates);
router.get('/states/:stateId/lgas', getLGAs);
router.get('/lgas/:lgaId/communities', getCommunities);
router.get('/communities', getGlobalCommunities);

module.exports = router;
