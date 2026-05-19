import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { BASE_URL } from "./api-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

async function saveTokenAndRedirect(userCredential) {
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('token', token);
    localStorage.setItem('username', userCredential.user.displayName || userCredential.user.email);
    localStorage.setItem('firebaseUid', userCredential.user.uid);
    window.location.href = 'index.html';
}

Vue.createApp({
    data() {
        return {
            email: '',
            password: '',
            error: null,
            showForgotPassword: false,
            resetEmail: '',
            resetMsg: null,
            resetError: false,
        };
    },
    methods: {
        async loginEmail() {
            this.error = null;
            try {
                const cred = await signInWithEmailAndPassword(auth, this.email, this.password);
                await saveTokenAndRedirect(cred);
            } catch (ex) {
                this.error = 'Forkert mail eller password.';
            }
        },
        async loginGoogle() {
            this.error = null;
            try {
                const cred = await signInWithPopup(auth, googleProvider);
                // Sync Google user to backend (username = displayName or email prefix)
                const token = await cred.user.getIdToken();
                const username = cred.user.displayName || cred.user.email.split('@')[0];
                await fetch(BASE_URL + 'user/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ firebaseUid: cred.user.uid, username, email: cred.user.email })
                });
                await saveTokenAndRedirect(cred);
            } catch (ex) {
                this.error = 'Google sign-in mislykkedes.';
            }
        },
        async sendReset() {
            this.resetMsg = null;
            this.resetError = false;
            if (!this.resetEmail) {
                this.resetMsg = 'Indtast din e-mail.';
                this.resetError = true;
                return;
            }
            try {
                // handleCodeInApp: true makes Firebase link directly to our custom reset page
                const actionCodeSettings = {
                    url: window.location.origin + '/Reset-password.html',
                    handleCodeInApp: true,
                };
                await sendPasswordResetEmail(auth, this.resetEmail, actionCodeSettings);
                this.resetMsg = 'Reset-link sendt! Tjek din indbakke.';
            } catch (ex) {
                this.resetMsg = 'Kunne ikke sende reset-link. Er e-mailen korrekt?';
                this.resetError = true;
            }
        }
    }
}).mount("#app");
