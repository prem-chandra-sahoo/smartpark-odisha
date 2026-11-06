# SmartPark Odisha

# Build SmartPark Odisha – Authorised Parking Discovery & Booking Platform

Build a modern, responsive, production-ready web application called **SmartPark Odisha**. It helps people find, compare, and reserve authorised parking spaces across Odisha, India.

## 1. Project objective

People visiting unfamiliar locations often struggle to find safe, legal and available parking. SmartPark Odisha solves this by showing authorised parking facilities near a user's destination, displaying available slots, and allowing advance reservations.

The platform should cover major Odisha locations, including:

- Bhubaneswar
- Cuttack
- Puri
- Rourkela
- Sambalpur
- Berhampur
- Balasore
- Konark
- Other cities and tourist destinations across Odisha

**Important:** Do not label a parking facility as government-authorised or officially verified unless an administrator has checked and approved its authorisation documents. Never invent official parking locations, permissions, live slot counts, or government partnerships.

## 2. Design and branding

Create a premium, modern mobility-tech website.

- Brand name: SmartPark Odisha
- Tagline: "Find your parking before you reach your destination."
- Primary colours: dark green, white and lime green.
- Use a clean, professional interface with modern cards, rounded corners, subtle shadows and clear icons.
- Make it fully responsive for mobile, tablet and desktop.
- Use a modern map-based interface inspired by leading navigation and mobility applications.
- Add a simple SmartPark logo using a parking symbol and location pin.

## 3. Homepage

Create an attractive landing page containing:

**Navigation bar**
- SmartPark Odisha logo
- Home
- Find Parking
- How It Works
- List Your Parking
- About Us
- Login / Sign Up

**Hero section**

Heading: "Your Destination. Your Parking. Already Sorted."

Subheading: "Discover authorised parking spaces across Odisha, check available slots and reserve your parking before you arrive."

Add a prominent destination search box with:
- Search destination, area or landmark
- City selection
- Vehicle type (two-wheeler / four-wheeler)
- Search Parking button

Examples of destinations:
- KIIT Square, Bhubaneswar
- Master Canteen, Bhubaneswar
- Ravenshaw University, Cuttack
- Puri Sea Beach
- Jagannath Temple, Puri
- Railway stations, airports, shopping malls and hospitals

These are destination search examples, not claims that authorised parking exists at each location.

Below the hero section, add:
- Popular destinations in Odisha
- How SmartPark works
- Benefits of advance parking
- Parking facility owner registration section
- Footer with contact information and policies

## 4. Find Parking – Main functionality

This is the most important page.

When a user searches for a destination:

1. Identify the destination using Google Places Autocomplete.
2. Display authorised and verified parking facilities near that destination.
3. Show the parking facilities on an interactive map.
4. Display matching parking facilities in a list beside the map.
5. Allow users to compare facilities.

Each parking card must show:

- Parking facility name
- Full address
- Distance from the searched destination
- Total parking spaces
- Available spaces
- Occupied spaces
- Hourly and daily price
- Opening and closing time
- Supported vehicle types
- Authorisation / verification status
- Directions button
- View Details button
- Reserve Now button

Add filters:
- Nearest parking
- Lowest price
- Most available spaces
- Two-wheeler / four-wheeler
- Open now
- Covered / uncovered parking

Use clear availability indicators:
- Green: Available
- Orange: Limited availability
- Red: Full

## 5. Authorised parking verification system

Create a strict verification workflow.

Parking facilities can be registered by:
- Municipal or government parking operators
- Railway station parking operators
- Airport parking operators
- Shopping mall owners
- Hospital parking operators
- Private parking businesses with valid permission

Each parking owner must submit:
- Facility name
- Owner / operator name
- Full address
- Google Maps location
- Contact number
- Total parking capacity
- Vehicle types supported
- Parking rates
- Operating hours
- Authorisation or permission document
- Relevant issuing authority and document details

Admin must review the submitted information and documents.

Use three statuses:
- Pending Verification
- Verified
- Rejected

Only facilities approved by the admin should appear as **Verified Authorised Parking** in public search results.

Do not create fake government badges, official seals or false claims of government approval.

## 6. Parking details page

When a user clicks a parking facility, open a detailed page containing:

- Facility images
- Name and address
- Location map
- Verification status
- Parking rates
- Opening hours
- Available and total slots
- Vehicle categories
- Parking rules
- Contact details
- Slot selection interface

If the facility has multiple floors, show floor-wise parking layouts.

Create an interactive parking layout with individual slots:
- Green: Available
- Red: Occupied
- Yellow: Reserved
- Grey: Unavailable

Allow users to select an available slot.

## 7. Advance booking system

Build a complete booking interface.

Booking fields:
- User name
- Mobile number
- Email
- Vehicle registration number
- Vehicle type
- Parking facility
- Selected slot
- Booking date
- Arrival time
- Parking duration

Booking process:

1. User selects a verified parking facility.
2. User selects an available slot.
3. User enters vehicle and booking details.
4. System checks slot availability again on the server.
5. User confirms the booking.
6. System generates a unique booking ID.
7. Display a booking confirmation page with a QR code.
8. Allow the user to view or cancel the booking according to the facility's cancellation policy.

Prevent double booking through server-side reservation checks and database transactions or atomic operations.

Do not show a booking as confirmed until the backend has successfully reserved the slot.

## 8. Google Maps integration

Integrate Google Maps Platform.

Use:
- Google Maps JavaScript API
- Google Places API for destination autocomplete
- Directions API for navigation

Features:
- Display destination location.
- Display nearby verified parking facilities.
- Show parking markers on the map.
- Show the route from destination to selected parking facility.
- Add a "Get Directions" button that opens Google Maps navigation.

Use environment variables for API keys. Never expose secret keys in frontend code.

If API keys are unavailable, show a clearly labelled map placeholder and keep the rest of the website functional.

## 9. User dashboard

Create a user dashboard where customers can:

- View upcoming bookings
- View booking history
- View booking ID and QR code
- Cancel eligible bookings
- Update profile information
- View saved parking facilities

## 10. Admin dashboard

Create a secure admin dashboard.

Admin features:
- View total registered parking facilities
- Review pending parking applications
- Approve or reject parking facilities
- View uploaded authorisation documents
- Manage parking operators
- Add or edit parking facilities
- Update parking capacity and availability
- View bookings and cancellations
- View users
- View reports and analytics

Dashboard statistics:
- Total verified facilities
- Pending verification requests
- Total parking slots
- Currently available slots
- Total bookings
- Revenue (only if actual payment data is integrated)

## 11. Parking owner dashboard

Allow parking owners to:
- Register their parking facility
- Upload authorisation documents
- Track verification status
- Update parking rates and operating hours
- Manage parking slots
- Update live availability
- View reservations
- View booking history

Owners must only manage their own facilities.

## 12. Technology stack

Use the following technology:

Frontend:
- React
- Tailwind CSS
- Lucide icons

Backend & Database:
- Node.js / Express / MongoDB or Lovable Cloud Supabase for production database & auth

Integrations:
- Map & location discovery
- QR code generation
- Secure authentication

Use a clean, scalable folder structure and reusable components.

## 13. Database structure

Create suitable models for:
- Users
- ParkingFacilities
- ParkingSlots
- ParkingBookings
- ParkingOwners
- VerificationDocuments
- Admins

Each parking facility should store its authorisation status, location coordinates, capacity, rates, operating hours and owner information.
Each booking should store the user, facility, slot, date, time, duration, vehicle details and booking status.

## 14. Important data and functionality rules

- Do not invent real parking facilities or claim that demo data is official.
- Add clearly labelled sample data only for demonstration.
- Show "Demo Data – Not Live" wherever sample availability is displayed.
- Never show fake live availability.
- Only verified facilities should be included in the authorised parking search.
- Keep pending and rejected facilities hidden from public search.
- Use secure authentication and role-based permissions.
- Validate all forms.
- Prevent duplicate slot reservations.
- Make the application functional, not just a static UI.
- Keep the code ready for future integration with IoT sensors, ESP32 devices and automatic vehicle-slot detection.

## 15. Final expected result

Build a polished, professional SmartPark Odisha application with:
1. A modern homepage.
2. Destination-based parking discovery.
3. Interactive map and parking list.
4. Authorisation document verification.
5. Real-time or clearly labelled demo slot availability.
6. Individual slot selection.
7. Advance parking reservation.
8. QR-based booking confirmation.
9. User dashboard.
10. Parking owner dashboard.
11. Admin verification dashboard.
12. Responsive mobile-first design.

Prioritise the complete user journey:
Search Destination → Find Verified Parking → Compare Availability and Price → Select Slot → Reserve Parking → Receive QR Confirmation → Navigate to Parking.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fcae38dc-200b-42b1-895e-975a37bb8073).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
