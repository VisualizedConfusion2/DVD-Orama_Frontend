import { BASE_URL as baseUri } from "./api-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { loadMovieModalHTML, initMovieModal } from "./movieModal.js";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
window.baseUri = baseUri;

Vue.createApp({
    data() {
        return {
            movies: [],
            movie: null,
            movieCollection: [],
            movieCollectionName: '',
            menuOpen: false,
            showCreateCollection: false,
            UserName: localStorage.getItem('username'),
            showSettings: false,
            settingsUsername: '',
            settingsEmail: '',
            settingsNewPassword: '',
            settingsCurrentPassword: '',
            settingsError: null,
            settingsSuccess: null,
            settingsSaving: false,
            isPublic: false,
            showDropdown: false,
            showCreateCollection: false,
        }
    },
    async created() {
        if (!localStorage.getItem('token')) {
            window.location.href = 'Log-in.html';
            return;
        }
        await loadMovieModalHTML();
        initMovieModal();
        await this.GetMovieCollections();
    },
    methods: {
        async RemoveMovieFromCollection(collectionId, movieId) {
            try {
                await axios.delete(baseUri + "MovieCollection/" + collectionId + "/movies/" + movieId + "/userId/" + localStorage.getItem('firebaseUid'));
                await this.GetMovieCollections();
            } catch (ex) {
                if (ex.response?.status === 403) {
                    alert('You do not have permission to remove movies from this collection.');
                } else {
                    console.log("ERROR:", ex);
                }
            }
        },
        async GetMovieCollections() {
            try {
                const response = await axios.get(baseUri + "MovieCollection/ByUser/" + localStorage.getItem('firebaseUid'));
                this.movieCollection = response.data;
                console.log(response.data);
            } catch (ex) {
                console.log("ERROR:", ex);
            }
        },
        UpdateCollectionPublicity(collection, newValue) {
            axios.put(baseUri + "MovieCollection/" + collection.id + "/userId/" + localStorage.getItem('firebaseUid'), {
                name: collection.name,
                isPublic: newValue,
            }).then(() => {
                collection.isPublic = newValue; // update local state
                console.log("Updated successfully:", newValue);
            }).catch(ex => {
                console.log("ERROR:", ex);
            });
        },
        CreateMovieCollection() {
            if (this.movieCollectionName.trim() === '') {
                alert('Indtast et navn til samlingen');
                return;
            }
            else {
                axios.post(baseUri + "MovieCollection/Create", {
                    name: this.movieCollectionName,
                    firebaseUid: localStorage.getItem('firebaseUid'),
                    isPublic: this.isPublic
                }).then(response => {
                    this.movieCollectionName = '';
                    this.GetMovieCollections();
                });
            }
        },
        redirectToLogin() {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('firebaseUid');
            window.location.href = 'Log-in.html';
        },
        openSettings() {
            const user = auth.currentUser;
            this.settingsUsername = user?.displayName || this.UserName || '';
            this.settingsEmail = user?.email || '';
            this.settingsNewPassword = '';
            this.settingsCurrentPassword = '';
            this.settingsError = null;
            this.settingsSuccess = null;
            this.showSettings = true;
        },
        async saveSettings() {
            this.settingsError = null;
            this.settingsSuccess = null;
            this.settingsSaving = true;

            const user = auth.currentUser;
            if (!user) {
                this.settingsError = 'Ikke logget ind. Genindlæs siden.';
                this.settingsSaving = false;
                return;
            }

            const changingEmail = this.settingsEmail !== user.email;
            const changingPassword = this.settingsNewPassword.length > 0;

            try {
                if ((changingEmail || changingPassword) && this.settingsCurrentPassword) {
                    const credential = EmailAuthProvider.credential(user.email, this.settingsCurrentPassword);
                    await reauthenticateWithCredential(user, credential);
                } else if (changingEmail || changingPassword) {
                    this.settingsError = 'Indtast dit nuværende password for at ændre email eller password.';
                    this.settingsSaving = false;
                    return;
                }

                if (this.settingsUsername !== user.displayName) {
                    await updateProfile(user, { displayName: this.settingsUsername });
                }

                if (changingEmail) {
                    await updateEmail(user, this.settingsEmail);
                }

                if (changingPassword) {
                    if (this.settingsNewPassword.length < 6) {
                        this.settingsError = 'Nyt password skal være mindst 6 tegn.';
                        this.settingsSaving = false;
                        return;
                    }
                    await updatePassword(user, this.settingsNewPassword);
                }

                const token = await user.getIdToken(true);
                await fetch(baseUri + 'user/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        firebaseUid: user.uid,
                        username: this.settingsUsername,
                        email: this.settingsEmail
                    })
                });

                localStorage.setItem('username', this.settingsUsername);
                localStorage.setItem('token', token);
                this.UserName = this.settingsUsername;

                this.settingsSuccess = 'Ændringer gemt!';
                setTimeout(() => { this.showSettings = false; }, 1200);

            } catch (ex) {
                if (ex.code === 'auth/wrong-password' || ex.code === 'auth/invalid-credential') {
                    this.settingsError = 'Forkert nuværende password.';
                } else if (ex.code === 'auth/requires-recent-login') {
                    this.settingsError = 'Indtast dit nuværende password for at fortsætte.';
                } else if (ex.code === 'auth/email-already-in-use') {
                    this.settingsError = 'E-mailen er allerede i brug.';
                } else {
                    this.settingsError = 'Noget gik galt. Prøv igen.';
                }
            } finally {
                this.settingsSaving = false;
            }
        }
    }
}).mount("#app");