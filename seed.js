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
        vault = new accountModel({
            status: "ACTIVE",
            accountType: "SAVINGS",
            currency: "INR"
        })
        await vault.save({ validateBeforeSave: false })
        console.log(`Created new vault account: ${vault._id}`)
    }

    const existingLedgerEntry = await ledgerModel.findOne({ account: vault._id })

    if (existingLedgerEntry) {
        console.log("Vault already has ledger entries, skipping seed credit.")
    } else {
        const entry = new ledgerModel({
            account: vault._id,
            amount: VAULT_STARTING_BALANCE,
            type: "CREDIT"
        })
        await entry.save({ validateBeforeSave: false })
        console.log(`Seeded vault with ₹${VAULT_STARTING_BALANCE}`)
    }

    console.log("\n=========================================")
    console.log(`VAULT_ACCOUNT_ID = "${vault._id}"`)
    console.log("Set this as the VAULT_ACCOUNT_ID env var")
    console.log("(Render dashboard → Environment tab) so it")
    console.log("can't drift out of sync with the controller.")
    console.log("=========================================\n")

    await mongoose.connection.close()
    process.exit(0)
}

seed().catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
})