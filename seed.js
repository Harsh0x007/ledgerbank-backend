require("dotenv").config()
const mongoose = require("mongoose")
const connectToDb = require("./src/config/db")
const accountModel = require("./src/models/account.model")
const ledgerModel = require("./src/models/ledger.model")

const VAULT_STARTING_BALANCE = 1000000 // ₹10,00,000

async function seed() {
    connectToDb()

    // wait a moment for the connection to establish
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("Checking for an existing vault account...")

    let vault = await accountModel.findOne({ user: { $exists: false } })

    if (vault) {
        console.log(`Vault account already exists: ${vault._id}`)
    } else {
        vault = await accountModel.create({
            status: "ACTIVE",
            accountType: "SAVINGS",
            currency: "INR"
        })
        console.log(`Created new vault account: ${vault._id}`)
    }

    const existingLedgerEntry = await ledgerModel.findOne({ account: vault._id })

    if (existingLedgerEntry) {
        console.log("Vault already has ledger entries, skipping seed credit.")
    } else {
        await ledgerModel.create({
            account: vault._id,
            amount: VAULT_STARTING_BALANCE,
            type: "CREDIT"
        })
        console.log(`Seeded vault with ₹${VAULT_STARTING_BALANCE}`)
    }

    console.log("\n=========================================")
    console.log(`VAULT_ACCOUNT_ID = "${vault._id}"`)
    console.log("Copy this into transaction.controller.js")
    console.log("=========================================\n")

    await mongoose.connection.close()
    process.exit(0)
}

seed().catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
})