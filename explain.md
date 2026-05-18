# Harbour Side Backend Map

This file is a mental map of how the app works so future changes are easier to make.

## Big Picture

The app has two main sides:

1. Admin dashboard
   - Used by the property/admin owner.
   - Lets admin manage rates, taxes, fees, policies, and calendar/iCal sync.
   - Main page: `/dashboard`

2. Public frontend APIs
   - Used by the website/frontend.
   - Frontend asks for rates, booked dates, and quote totals.
   - Main quote endpoint: `POST /api/quote`

The database stores:

- Admin users
- Seasonal/default rates
- Property settings such as fees, taxes, policies, and iCal URL

## Main Files

### App Setup

- `src/app.js`
  - Creates the Express app.
  - Enables JSON/body parsing.
  - Serves static frontend assets from `public`.
  - Registers all routes.
  - Registers 404 and error handlers.

- `src/server.js`
  - Starts the app.

### Models

- `src/models/SeasonalRate.js`
  - Stores all rate rows.
  - A default/regular rate has:
    - `startDate = null`
    - `endDate = null`
    - `seasonName = Standard`
  - A seasonal rate has:
    - `startDate`
    - `endDate`
    - nightly price
    - weekend price
    - weekend days
    - minimum stay

- `src/models/Setting.js`
  - Stores one settings row, usually `id = 1`.
  - Holds:
    - iCal URL
    - cleaning fee
    - pet fee
    - extra guest fee
    - taxable flags
    - tax rate
    - damage deposit
    - rental notes
    - cancellation policy

- `src/models/Admin.js`
  - Stores admin login data.

## Admin Flow

### Login

Routes:

- `GET /`
- `POST /login`
- `GET /logout`

Files:

- `src/routes/auth.routes.js`
- `src/controllers/auth.controller.js`
- `src/services/auth.service.js`
- `src/views/login.ejs`

Flow:

1. Admin opens login page.
2. Login form posts email/password.
3. Auth service checks admin credentials.
4. On success, session stores admin email.
5. Admin is redirected to `/dashboard`.

Protected dashboard routes use:

- `src/middlewares/isAuthenticated.js`

## Dashboard Flow

Route:

- `GET /dashboard`

Files:

- `src/routes/dashboard.routes.js`
- `src/controllers/dashboard.controller.js`
- `src/views/dashboard.ejs`
- `public/js/dashboard.js`
- `public/css/dashboard.css`

Flow:

1. Admin visits `/dashboard`.
2. `showDashboard` loads all rates.
3. Rates are passed through `calculateDynamicRates`.
4. Settings row is loaded or created.
5. iCal calendar data is loaded if an iCal URL exists.
6. `dashboard.ejs` renders Rates, Taxes, and Calendar tabs.

## Rates Logic

Admin routes:

- `POST /rate/save`
- `POST /rate/delete`

Files:

- `src/controllers/dashboard.controller.js`
- `src/services/rate.service.js`
- `src/utils/rateCalculator.js`
- `src/views/dashboard.ejs`

### Default / Regular Rate

The default rate is the fallback price.

It has no dates:

```txt
startDate = null
endDate = null
seasonName = Standard
```

It is used when a booking night does not match any seasonal rate.

Admin UI location:

- Dashboard
- Rates tab
- Price Type dropdown
- Regular / Default Price

Important rule:

- Default rate can be updated.
- Default rate cannot be deleted.
- Quotes do not always require a default rate if seasonal rates cover every night.
- But dates outside seasonal ranges need a default fallback.

### Seasonal Rates

Seasonal rates override the default rate for matching dates.

Admin UI location:

- Dashboard
- Rates tab
- Price Type dropdown
- Seasonal Price

Fields:

- Season name
- Start date
- End date
- Nightly rate
- Weekend rate
- Weekend days
- Minimum stay

Date logic:

- Start date is the first check-in date covered.
- End date is checkout-style/exclusive.
- Example:

```txt
Season: 2026-06-21 to 2026-06-30
Charged nights: 2026-06-21 through 2026-06-29
Not charged: 2026-06-30
```

This matches quote and calendar logic.

### Weekend Logic

Each rate has `weekendDays`, stored as comma-separated days:

```txt
Fri,Sat
Sat,Sun
Thu,Fri,Sat,Sun
```

If a booking night's day name is in `weekendDays`, weekend price is used.
Otherwise nightly price is used.

### Weekly / Monthly Display

File:

- `src/utils/rateCalculator.js`

Used for dashboard/API display only.

It calculates:

- Weekly rate as 6 nights
- Monthly rate as 29 nights

These are derived display values, not separate stored database fields.

## Taxes And Fees Flow

Admin route:

- `POST /settings/taxes`

Files:

- `src/controllers/dashboard.controller.js`
- `src/models/Setting.js`
- `src/views/dashboard.ejs`

Settings controlled from dashboard:

- Extra guest taxable
- Extra guest fee type
- Extra guest fee
- Extra guest threshold
- Cleaning taxable
- Cleaning fee type
- Cleaning fee
- Pet taxable
- Pet fee type
- Pet fee
- Damage deposit
- Property tax rate

Fee types:

```txt
Cleaning:
- Per Stay
- Per Night

Pets:
- Per Stay
- Per Night

Extra Guests:
- Per Guest Per Stay
- Per Guest Per Night
```

Tax logic:

- Accommodation is always taxable.
- Cleaning fee is taxable only if `cleaningFeeTaxable = true`.
- Pet fee is taxable only if `petFeeTaxable = true`.
- Extra guest fee is taxable only if `extraGuestTaxable = true`.
- Damage deposit is included in grand total but is not taxable.

## Policies Flow

Admin route:

- `POST /settings/policies`

Files:

- `src/controllers/dashboard.controller.js`
- `src/models/Setting.js`
- `src/views/dashboard.ejs`

Stored fields:

- `rentalNotes`
- `cancellationPolicy`

Quote response also returns these policies so the frontend can display them.

## Calendar Flow

Admin routes:

- `POST /ical/save`
- `GET /api/calendar/sync`

Public route:

- `GET /api/booked-dates`

Files:

- `src/services/ical.service.js`
- `src/controllers/dashboard.controller.js`
- `src/routes/api.routes.js`
- `public/js/dashboard.js`

Flow:

1. Admin saves iCal URL.
2. App fetches events from VRBO/Airbnb iCal feed.
3. Each event has a start/check-in and end/check-out date.
4. Booked nights are all dates from start up to, but not including, checkout.
5. Check-out date is available for a new check-in.

Calendar response shape:

```json
{
  "bookedDates": [],
  "startDates": [],
  "endDates": []
}
```

## Public Frontend Flow

### Get Rates

Endpoint:

```txt
GET /api/rates
```

Files:

- `src/routes/api.routes.js`
- `src/controllers/api.controller.js`

Response shape:

```json
{
  "success": true,
  "default_rate": null,
  "seasonal_rates": []
}
```

Use this when the frontend needs to show rates before calculating a quote.

### Get Booked Dates

Endpoint:

```txt
GET /api/booked-dates
```

Files:

- `src/routes/api.routes.js`
- `src/services/ical.service.js`

Use this for frontend availability calendar.

### Get Quote

Endpoint:

```txt
POST /api/quote
```

Files:

- `src/routes/quote.routes.js`
- `src/controllers/quote.controller.js`
- `src/services/quote.service.js`

Accepted date formats:

```txt
2026-06-21
06/21/26
06/21/2026
```

Accepted body examples:

```json
{
  "checkIn": "06/21/26",
  "checkOut": "06/30/26",
  "guests": 3,
  "pets": 0
}
```

or:

```json
{
  "check_in": "2026-06-21",
  "check_out": "2026-06-30",
  "adults": 2,
  "children": 1,
  "infants": 1,
  "pet_count": 0
}
```

Guest logic:

- If `guests` is sent, that is used as the paying guest count.
- If `guests` is not sent, `adults + children` is used.
- Infants are returned in the response but not counted as paying guests.
- At least one paying guest is required.

Quote response includes:

- Normalized check-in/check-out dates
- Total nights
- Guest/pet counts
- Minimum stay required
- Itemized breakdown
- Nightly rate breakdown
- Policies
- Grand total

Example response shape:

```json
{
  "success": true,
  "quote": {
    "checkIn": "2026-06-21",
    "checkOut": "2026-06-30",
    "totalNights": 9,
    "guests": 3,
    "adults": 2,
    "children": 1,
    "infants": 1,
    "pets": 0,
    "minStayRequired": 1,
    "breakdown": {
      "accommodation": 3891,
      "cleaningFee": 200,
      "petFee": 0,
      "extraGuestFee": 0,
      "tax": 531.83,
      "damageDeposit": 0
    },
    "nightlyRates": [],
    "policies": {
      "rentalNotes": null,
      "cancellationPolicy": null
    },
    "grandTotal": 4622.83
  }
}
```

## Quote Calculation Flow

File:

- `src/services/quote.service.js`

Step by step:

1. Normalize frontend input.
   - Accepts camelCase and snake_case fields.
   - Converts dates to `YYYY-MM-DD`.

2. Validate dates.
   - Check-in cannot be in the past.
   - Check-out must be after check-in.

3. Count nights.
   - Check-in inclusive.
   - Check-out exclusive.

4. Load rates.
   - Load default rate if it exists.
   - Load all seasonal rates.

5. For each night:
   - Find matching seasonal rate.
   - If no seasonal rate matches, use default rate.
   - If neither exists, throw an error for that exact date.
   - Apply weekend price if the night is a configured weekend day.
   - Otherwise apply nightly price.

6. Enforce minimum stay.
   - Uses the highest minimum stay touched by the booked nights.

7. Calculate fees.
   - Cleaning
   - Pets
   - Extra guests

8. Calculate tax.
   - Accommodation is always taxable.
   - Optional taxable fee flags come from settings.

9. Add damage deposit.

10. Return itemized quote.

## Important Consistency Rules

Use these rules when changing the app:

1. Booking date ranges are checkout-style.
   - Start/check-in is included.
   - End/check-out is excluded.

2. Seasonal rates override default rates.

3. Default rate is fallback only.

4. If a quote date has no seasonal rate and no default rate, quote should fail with a clear date-specific error.

5. Dashboard, `/api/rates`, and quote logic should all treat default rate separately from seasonal rates.

6. Money values should never be negative.

7. Minimum stay should be at least 1 night.

8. Infants are not paying guests.

9. Damage deposit is shown in total but not taxed.

10. Policies belong in settings and can be returned with quote.

## Where To Change Things Later

### Change Quote Math

Edit:

- `src/services/quote.service.js`

### Change Admin Rate Save Rules

Edit:

- `src/services/rate.service.js`
- `src/controllers/dashboard.controller.js`

### Change Dashboard UI

Edit:

- `src/views/dashboard.ejs`
- `public/js/dashboard.js`
- `public/css/dashboard.css`

### Change Public API Response

Edit:

- `src/controllers/api.controller.js`
- `src/controllers/quote.controller.js`
- `src/services/quote.service.js`

### Change Database Fields

Edit models:

- `src/models/SeasonalRate.js`
- `src/models/Setting.js`
- `src/models/Admin.js`

Then make sure the database schema is updated too.

## Current Known Behavior

With the current DB data checked during this cleanup:

```txt
Season: 2026
Start: 2026-05-19
End: 2026-12-31
Nightly: 399
Weekend: 499
Weekend days: Sat,Sun
Cleaning: 200 per stay
Tax: 13%
```

Quote for:

```txt
06/21/26 to 06/30/26
```

Means:

```txt
2026-06-21 through 2026-06-29
9 nights
```

Expected total with current settings:

```txt
Accommodation: 3891
Cleaning: 200
Tax: 531.83
Grand Total: 4622.83
```

