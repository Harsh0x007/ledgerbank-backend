const mongoose = require('mongoose')

const legderSchema = new mongoose.Schema({

    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: [ true, "Ledger must be associated with an account" ],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [ true, "Amount is required for creating a ledger entry" ],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transaction',
        required: [ true, "Ledger must be associated with a transaction" ],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: [ "CREDIT", "DEBIT" ],
            message: "Type can be either CREDIT or DEBIT ",
        },
        required: [ true, "Ledger type is required" ],
        immutable: true
    }
})


function preventLedgerModification() {
    throw new Error("Ledger entries are immutable and cannot be modified or deleted" );
}

legderSchema.pre('findOneAndUpdate', preventLedgerModification)
legderSchema.pre('updateMany', preventLedgerModification)
legderSchema.pre('updateOne', preventLedgerModification)
legderSchema.pre('deleteOne', preventLedgerModification)
legderSchema.pre('deleteMany', preventLedgerModification)
legderSchema.pre('remove', preventLedgerModification)
legderSchema.pre('findOneAndDelte', preventLedgerModification)
legderSchema.pre('findOneAndReplace', preventLedgerModification)

const ledgerModel = mongoose.model("legder", legderSchema)

module.exports = ledgerModel