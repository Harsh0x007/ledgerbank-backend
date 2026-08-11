# LedgerBank — Backend

A REST API for a ledger-based banking application. Implements JWT authentication, a double-entry transaction ledger, multi-account support, idempotent transfers, and a simulated payment gateway for adding funds.

## Tech stack
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (cookie + bearer token support)
- bcrypt for password hashing
- Nodemailer (Gmail OAuth2) for transaction email notifications

## Setup

1. Clone the repo and install dependencies:
- npm install

2. Create a `.env` file in the root with the following variables:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
EMAIL_USER=your_gmail_address
CLIENT_URL=http://localhost:5173
VAULT_ACCOUNT_ID=(leave unset for first-time setup — see step 3)

3. **Seed the vault account** (required before any transactions can be funded):
- npm run seed (node seed.js)
   This creates a system "vault" account with a starting reserve of ₹10,00,000, used to fund user accounts via the "Add Money" feature. Safe to re-run — if a vault already exists, it won't create a duplicate, it just prints that account's existing ID.
   **After seeding, copy the printed `VAULT_ACCOUNT_ID` into your `.env` (locally) or into the Environment tab on Render (production).** The transaction controller reads this from `process.env.VAULT_ACCOUNT_ID` — if it's unset or doesn't match a real account in the DB, "Add money" fails with `"Payment gateway is temporarily unavailable"`.

4. Start the dev server:
- npm run dev

## Resetting the database from scratch

If you ever wipe all collections (e.g. clearing test data before a demo), the vault account gets deleted along with everything else, and **must be recreated and re-wired** or "Add money" will break again:

1. Wipe the collections (Atlas → Browse Collections → Drop Collection, or drop the whole DB).
2. Re-run `npm run seed` **against the same DB your deployed app uses** — for production, either use Render's Shell tab (`npm run seed`), or run locally with `MONGO_URI="<prod connection string>" node seed.js`. This creates a fresh vault with a new `_id`.
3. **Update `VAULT_ACCOUNT_ID`** — in your local `.env` for dev, or in Render's Environment tab for production — to the new ID seed.js just printed. This is the step that's easy to forget: skipping it silently breaks "Add money" even though the vault exists.
4. If you edited Render's Environment tab, wait for the auto-triggered redeploy to finish ("Deploy live" in the Events tab) before testing.
5. Register a fresh user and confirm "Add money" works.