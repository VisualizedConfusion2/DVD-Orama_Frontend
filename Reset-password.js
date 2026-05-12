import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    verifyPasswordResetCode,
    confirmPasswordReset,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Firebase sends ?mode=resetPassword&oobCode=XXXX in the URL
const params = new URLSearchParams(window.location.search);
const oobCode = params.get('oobCode');

Vue.createApp({
    data() {
        return {
            newPassword: '',
            error: null,
            loading: false,
            invalid: false,
            done: false,
            email: null,
        };
    },
    async created() {
        if (!oobCode) {
            this.invalid = true;
            return;
        }
        try {
            // Verify the code and get the email it belongs to
            this.email = await verifyPasswordResetCode(auth, oobCode);
        } catch {
            this.invalid = true;
        }
    },
    methods: {
        async resetPassword() {
            this.error = null;
            if (this.newPassword.length < 6) {
                this.error = 'Password skal være mindst 6 tegn.';
                return;
            }
            this.loading = true;
            try {
                await confirmPasswordReset(auth, oobCode, this.newPassword);

                // Auto-login after reset
                const cred = await signInWithEmailAndPassword(auth, this.email, this.newPassword);
                const token = await cred.user.getIdToken();
                localStorage.setItem('token', token);
                localStorage.setItem('username', cred.user.displayName || cred.user.email);

                this.done = true;
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            } catch {
                this.error = 'Noget gik galt. Prøv at anmode om et nyt reset-link.';
            } finally {
                this.loading = false;
            }
        }
    }
}).mount("#app");
