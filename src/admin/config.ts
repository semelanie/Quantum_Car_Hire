// Change this to set your own admin password.
//
// IMPORTANT: this is a *casual* gate, not real security. The password is
// bundled into the JavaScript that ships to every visitor's browser, so
// anyone who opens devtools can read it. It's only meant to keep casual
// visitors from stumbling into /admin and poking around — don't use it to
// protect anything sensitive.
export const ADMIN_PASSWORD = 'quantum2026';

export const ADMIN_SESSION_KEY = 'qch_admin_authed';
