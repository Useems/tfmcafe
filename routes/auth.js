const router = require("express").Router();
const request = require("request");
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const bcrypt = require ('bcryptjs');
const isImageUrl = require('is-image-url')
const randomColor = require('randomcolor');
const Joi = require('@hapi/joi');

dotenv.config()

const schema = {
    username: Joi.string().min(3).max(20).required(),
    password: Joi.string().min(6).max(1024).required(),
    avatar: Joi.string()
};

function checkNickname(nickname) {
    if ( /^\+?[A-Z][a-z\d_]{2,19}$/.test(nickname)
    && nickname.split('_').length < 4
    && nickname.indexOf("__") == -1
    ) return true;
}

router.post('/register', async (req,res) => {
    if (!req.body.captcha || req.body.captcha == '') {
		return res.status(400).send("Please select captcha")
	} else {
		const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_SECRET}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`
		
		let result = await new Promise((resolve, reject) => {
			request(verifyUrl, (err, res, body) => {
				body = JSON.parse(body);
				
				if (body.success !== undefined && !body.success) {
					resolve(false)
				} else {
					resolve(true)
				}
			});
		})
		
		if (!result)
			return res.status(400).send("Failed captcha verification");
	}
    
    // Validate user data
    const {error} = Joi.validate({username: req.body.username, password: req.body.password, avatar: req.body.avatar}, schema)
    if (error) return res.status(400).send(error.details[0].message)

    // Check if the user is valid
    if(!checkNickname(req.body.username)) return res.status(400).send("Username is invalid")

    // Check if the user exists
    const userExist = await User.findOne({username: req.body.username});
    if (userExist) return res.status(400).send("Username is already in use")

    // Check if image is valid
    const validImage = await isImageUrl(req.body.avatar);
    if (!validImage) return res.status(400).send("Invalid image")

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    // Get user ip address
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Create user
    const user = new User({
        username: req.body.username,
        password: hashedPassword,
        avatar: req.body.avatar,
        colorName: randomColor(),
        privLevel: 1,
        ipAddress: ip,
    });

    try {
        const savedUser = await user.save();
        
        // Create token
        const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET)
        res.send({user: user._id, token})

    } catch(err) {
        res.status(400).send(err);
    }
})

router.post('/login', async (req, res) => {
    // Validate user data
    const {error} = Joi.validate({username: req.body.username, password: req.body.password}, schema)
    if (error) return res.status(400).send(error.details[0].message)

    // Check if the user exists
    const user = await User.findOne({username: req.body.username});
    if (!user) return res.status(400).send("User doesn't exist")

    // Check if the password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) return res.status(400).send("Password is incorrect")

    // Create token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET)

    // Login
    res.send({user: user._id, token: token})

    // Get user ip address
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    user.ipAddress = ip
    await user.save();
})

module.exports = router;