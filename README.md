# Kilroy

A location-anchored public memory layer for the World Network.

Leave something. Find something. Be somewhere.

## What is Kilroy?

Kilroy lets people leave an image + short caption at a real place. Others who physically visit that place later can see everything that's been left there. Content persists across time. There is no algorithm, no feed, no social graph. Discovery requires showing up.

### Circles

Two visibility layers at the same place:

- **Community**: Any World App user can see (anonymous)
- **Verified**: Only World ID-verified humans can see

No profiles. No usernames. No likes. No comments. No edits.

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Storage enabled
- A Google Cloud project with Places API enabled
- A World App developer account

### Setup

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.sample .env.local
```

4. Configure environment variables in `.env.local`:

```bash
# World Mini App
NEXT_PUBLIC_APP_ID='your-world-app-id'

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY='your-firebase-api-key'
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN='your-project.firebaseapp.com'
NEXT_PUBLIC_FIREBASE_PROJECT_ID='your-project-id'
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET='your-project.appspot.com'
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID='your-sender-id'
NEXT_PUBLIC_FIREBASE_APP_ID='your-app-id'

# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY='your-places-api-key'
```

5. Run the development server:
```bash
npm run dev
```

6. Use ngrok to expose your local server:
```bash
ngrok http 3000
```

7. Configure your World App in the developer portal with the ngrok URL.

### Firebase Setup

Create the following Firestore structure:

```
places/
  {place_id}/
    metadata (document with place_name, address, created_at)
    kilroys/
      {kilroy_id}/
        image_url: string
        caption: string
        circle: "community" | "verified"
        created_at: timestamp
```

Create a composite index on `kilroys`:
- `circle` (Ascending)
- `created_at` (Descending)

### World Developer Portal

1. Create an incognito action called `kilroy-verify` for World ID verification
2. Set up your Mini App with the ngrok URL for testing

## Architecture

```
/src
  /app
    page.tsx        # Landing: location resolution, navigation
    /view
      page.tsx      # View kilroys at current place
    /drop
      page.tsx      # Create new kilroy
  /components
    /CircleToggle   # Community/Verified toggle
    /PageLayout     # Consistent page structure
  /context
    KilroyContext   # App state (place, circle, verification)
  /lib
    firebase.ts     # Firebase initialization
    kilroys.ts      # Firestore operations
    place.ts        # Place resolution + caching
    image.ts        # Client-side image compression
    types.ts        # TypeScript types
```

## Key Decisions

- **No authentication**: Anonymous by design. World ID verification is client-side only.
- **Place-based, not coordinate-based**: Content anchors to named places via Google Places API.
- **Session caching**: Place resolution happens once per session to minimize API costs.
- **Client-side compression**: Images compressed to max 1200px width, 75% JPEG quality before upload.
- **Hierarchical Firestore**: `places/{place_id}/kilroys` structure for efficient queries.

## Testing

The app runs in a browser but is designed for World App. Outside World App:
- Location uses browser geolocation API
- World ID verification auto-approves (for testing)
- MiniKit commands are skipped

## Production

```bash
npm run build
```

Deploy the `.next` output to your hosting provider.

## Notes

- Eruda (in-browser console) is enabled in development for debugging
- No admin UI - use Firebase Console for moderation
- Content moderation is manual (delete from Firebase Console)
