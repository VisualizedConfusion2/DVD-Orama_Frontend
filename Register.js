import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { BASE_URL } from "./api-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

Vue.createApp({
    data() {
        return {
            username: '',
            email: '',
            password: '',
            error: null,
            loading: false,
            usernameMsg: null,
            usernameOk: false,
        };
    },
    methods: {
        async checkUsername() {
            this.usernameMsg = null;
            if (!this.username) return;
            try {
                const res = await fetch(`${BASE_URL}user/check-username?username=${encodeURIComponent(this.username)}`);
                if (res.ok) {
                    this.usernameMsg = 'Brugernavnet er ledigt.';
                    this.usernameOk = true;
                } else {
                    this.usernameMsg = 'Brugernavnet er allerede taget.';
                    this.usernameOk = false;
                }
            } catch {
                // silently ignore — server will catch it on submit
            }
        },
        async register() {
            this.error = null;

            if (!this.username || !this.email || !this.password) {
                this.error = 'Udfyld alle felter.';
                return;
            }
            if (this.password.length < 6) {
                this.error = 'Password skal være mindst 6 tegn.';
                return;
            }
            if (!this.usernameOk) {
                this.error = 'Vælg et ledigt brugernavn.';
                return;
            }

            this.loading = true;
            try {
                // Create Firebase user
                const cred = await createUserWithEmailAndPassword(auth, this.email, this.password);

                // Set display name in Firebase
                await updateProfile(cred.user, { displayName: this.username });

                // Sync to backend DB
                const token = await cred.user.getIdToken();
                const syncRes = await fetch(BASE_URL + 'user/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        firebaseUid: cred.user.uid,
                        username: this.username,
                        email: this.email
                    })
                });

                if (syncRes.status === 409) {
                    const msg = await syncRes.text();
                    this.error = msg;
                    // Roll back the Firebase user so they don't get stuck
                    await cred.user.delete();
                    return;
                }

                localStorage.setItem('token', token);
                localStorage.setItem('username', this.username);
                localStorage.setItem('firebaseUid', cred.user.uid);
                window.location.href = 'index.html';

            } catch (ex) {
                if (ex.code === 'auth/email-already-in-use') {
                    this.error = 'E-mailen er allerede i brug.';
                } else if (ex.code === 'auth/invalid-email') {
                    this.error = 'Ugyldig e-mailadresse.';
                } else {
                    this.error = 'Noget gik galt. Prøv igen.';
                }
            } finally {
                this.loading = false;
            }
        }
    }
}).mount("#app");
