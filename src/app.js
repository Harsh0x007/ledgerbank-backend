const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors');


/**
 * - Routes required
 */
const authRouter = require('../src/routes/auth.routes')
const accountRouter = require('./routes/account.routes')
const transactionRoutes = require('./routes/transaction.routes')


const app = express()

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

/**
 * - Use Routes
 */

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

module.exports = app  