# MOB HUB — P2 UX / Polish

## Scope
P2 is a presentation and interaction-quality pass over the existing reservation marketplace. It does not introduce purchasing, checkout, or online payments.

## UX standards
- Arabic-first RTL behavior must remain correct across navigation, forms, filters, lists, product details, stores, and reservations.
- Interactive controls use clear pressed/disabled/loading states.
- Lists provide explicit loading, empty, and error states.
- Reservation states are visually distinct and use consistent semantic treatment.
- Search and filters preserve readable spacing and predictable focus/interaction behavior.
- Product/store cards use the shared design tokens and consistent touch targets.
- Tablet/web layouts use constrained content widths and responsive grids where appropriate.
- Destructive actions require clear confirmation and feedback.
- Guest browsing remains available; authenticated actions must provide an explicit sign-in path.

## Reservation-only UX
User-facing actions must use reservation language: Reserve, Reservation, My Reservations, Confirm Reservation, Cancel Reservation. No purchase, checkout, or payment UI is part of MOB HUB.

## Quality gate
P2 is considered complete only after the mobile workspace has been typechecked successfully and the resulting branch contains no payment/checkout flow.
