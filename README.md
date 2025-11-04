Simple Auth Demo (client-side)

What this is
- A minimal, client-side-only authentication demo implemented with HTML/CSS/JS.
- Allows registering a username and password, logging in, and accessing a protected dashboard page.
- All data is stored locally in your browser's storage (localStorage for user records, sessionStorage for session).

Files
- `index.html` — login page
- `register.html` — registration page
- `dashboard.html` — protected page (redirects to login if not signed in)
- `auth.js` — main logic (password hashing with Web Crypto, store users in localStorage)
- `style.css` — styles

How to run
1. Open `auth/index.html` in your browser (File > Open, or drag into browser window). No server required.
2. Click "Create account" to register a new username and password.
3. Return to login and sign in — you'll be redirected to `dashboard.html` on success.
4. Click Sign out to end the session.

Security note (important)
- This demo is intentionally simple and runs entirely in the browser. It is NOT secure for production:
  - Storing authentication data in localStorage is insecure for real applications.
  - Browser-side authentication can be trivially modified by an attacker with access to the client.
  - Use a proper server, HTTPS, sessions or JWTs, and salted password hashing (bcrypt/argon2) on the server in production.

What I used
- Web Crypto API (`crypto.subtle.digest`) for SHA-256 hashing and `crypto.getRandomValues` for salts and tokens.

Next steps (optional enhancements you might ask me to add)
- Move storage to a small server (Node/Express with bcrypt + sqlite) and implement real sessions.
- Add email-based verification or password reset flows.
- Improve UX (show password strength, remember-me, validation messages).

Enjoy — open `auth/index.html` to try it out.