const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const emailService = require('../services/email.service')
const tokenBlackListModel = require("../models/blackList.model")

/**
 * 
 * - user register controller
 * - Post /api/auth/register
 */

async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body

        const isExists = await userModel.findOne({ email })

        if (isExists) {
            return res.status(422).json({
                message: "User already exists.",
                status: "failed"
            })
        }

        const user = await userModel.create({
            email,
            password,
            name
        })

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "2d" }
        )

        res.cookie('token', token)

        // ✅ Send email BEFORE response
        await emailService.sendRegisterationEmail(user.email, user.name)

        res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })

    } catch (error) {
        console.error("Registration Error:", error)
        res.status(500).json({
            message: "Something went wrong"
        })
    }
}

/**
 * - user login controller
 * - POST /api/auth/login
 */

async function userLoginController(req, res) {
    
    const { email, password } = req.body

    if( !email || !password) {
        return res.status(400).json({
            message: "Email and Password are required"
        })
    }

    const user = await userModel.findOne({ email}).select('+password')

    if (!user) {
        return res.status(401).json({
            message: "Email or Password is Invalid"
        })
    }

    const isvalidPassword = await user.comparePassword(password)

    if(!isvalidPassword) {
        return res.status(401).json({
            message: "Password is Invalid"
        })
    }

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '2d'}
    )

    res.cookie('token', token)

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })
}

async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }

    
    
    await tokenBlackListModel.create({
        token: token
    })
    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}

module.exports = { 
    userRegisterController,
    userLoginController,
    userLogoutController
}