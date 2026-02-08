const express = require('express');
const router = express.Router();
const {
    getStates,
    getCities,
    getLGAs,
    getCommunities
} = require('../controllers/location.controller');

router.get('/states', getStates);
router.get('/states/:stateId/cities', getCities);
router.get('/cities/:cityId/lgas', getLGAs);
router.get('/lgas/:lgaId/communities', getCommunities);

module.exports = router;
