# MOB HUB — Release Readiness

## Automated gates
- [x] Node 20+ and pnpm 10+ are declared by the workspace.
- [x] Frozen-lockfile installation is enforced in CI.
- [x] Workspace typecheck is a CI gate.
- [x] Workspace lint is a CI gate.
- [x] Workspace build is a CI gate.
- [x] Repository is checked for tracked real `.env` files.
- [x] CI blocks known purchase/payment implementation markers.
- [x] API has a health endpoint at `/healthz`.
- [x] API startup validates required `PORT`, JWT secrets, and production CORS configuration.

## Reservation-only release contract
MOB HUB does not sell or process payments online. The customer reserves a device and completes payment in the physical store. Release validation must preserve this contract.

## Functional acceptance flows
1. Guest opens the app and can browse products/stores.
2. Customer authenticates and session restoration works.
3. Customer opens a product and creates a reservation.
4. Reservation appears in My Reservations with its current status.
5. Customer can open reservation details and cancel when the state permits.
6. Merchant can view reservations for the merchant's own store only.
7. Merchant can confirm, decline, and complete reservations according to allowed transitions.
8. Unauthorized users cannot access another customer's reservation or another merchant's store reservations.
9. Health endpoint returns a valid healthy response.

## Environment contract
Required API variables:
- `NODE_ENV`
- `PORT`
- `JWT_SECRET` (32+ characters)
- `JWT_REFRESH_SECRET` (32+ characters)

Production also requires:
- `CORS_ORIGIN`

Never commit real `.env` files or credentials.

## Final release gate
A release is approved only after the GitHub Actions CI workflow is green and the functional acceptance flows above have been exercised against the configured runtime/database environment. GitHub repository tooling alone cannot claim successful runtime/device execution without a CI or local execution result.
