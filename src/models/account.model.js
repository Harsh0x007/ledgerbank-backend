const mongoose = require('mongoose')
const ledgerModel = require('./ledger.model')

const accountSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Accont must be associated with a user"],
        index: true
    },
    status: {
        type: String,
        enum: {
            type: String,
            values: ["ACTIVE", "FROZEN", "CLOSED"],
            message: "Status can be either ACTIVE, FROZEN or CLOSED",

        },
        default: "ACTIVE"
    },
    accountType: {
        type: String,
        enum: {
            type: String,
            values: ["SAVINGS", "CURRENT"],
            message: "Account type must be SAVINGS or CURRENT",
        },
        default: "SAVINGS"
    },
    name: {
        type: String,
        trim: true,
        maxlength: [25, "Account name cannot exceed 25 characters"],
        default: "My Account"
    },
    currency: {
        type: String,
        required: [true, "Currency is required for creating an account"],
        default: "INR"
    },
}, {
    timestamps: true
})

accountSchema.index({ user: 1, status: 1 })

accountSchema.methods.getBalance = async function () {
    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "DEBIT"] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredits: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] }, "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ["$totalCredits", "$totalDebit"] }
            }
        }
    ])

    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[0].balance
}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel