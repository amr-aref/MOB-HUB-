# MOB HUB — P1 Reservation Flow

## Product rule
MOB HUB is a reservation marketplace, not an e-commerce checkout.

- No online payment.
- No payment gateway.
- No cart-as-purchase flow.
- The customer reserves a phone/store appointment and pays in the physical store.
- Reservation status is the source of truth for the booking lifecycle.

## Required customer flow
Home → Browse/Search → Filters → Product Details → Store Selection → Reservation → Reservation Confirmation → My Reservations

Wishlist and Compare remain independent discovery features and do not imply purchase.

## Reservation lifecycle
`pending` → `confirmed` → `completed`

Cancellation is handled as a terminal customer action and must not create a payment/order record.

## P1 implementation scope
1. Every marketplace CTA must route to a real screen or action.
2. Product details must expose a reservation action, not purchase/checkout.
3. Reservation creation must persist against the authenticated customer and selected product/store.
4. Reservation confirmation must show the reservation reference and selected store/product details.
5. My Reservations must load persisted reservations from the API.
6. Loading, empty, error, and cancellation states must be handled.
7. No UI or API work should introduce payment processing.
