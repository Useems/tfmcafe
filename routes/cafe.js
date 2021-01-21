const router = require("express").Router();
const path = require('path')
const jwt = require('jsonwebtoken');

router.get('/', async (req,res) => {
    res.sendFile(path.join(__dirname, '../') + '/public/index.html');
})

module.exports = router;