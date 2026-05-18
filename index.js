const baseUri = "https://dvd-oramaservices-e5bfgqbse9g5edg7.swedencentral-01.azurewebsites.net/api/"

Vue.createApp({
    data() {
        return {
            movies: [],
            movie: null,
            UserName: null,
            searchTitle: '',
            selectedGenre: '',
            selectedService: '',
            isSearching: false,
            genres: [],
            streamingServices: [],
        }
    },
    async created() {
        //await Promise.all([
        //    this.getMovies(baseUri + "movie"),
        //    this.loadGenres(),
        //    this.loadStreamingServices(),
        //]);
            await this.getMovies(baseUri + "movie");
            await this.loadGenres();
            await this.loadStreamingServices();
    },
    methods: {
        async getMovies(uri) {
            try {
                const response = await axios.get(uri);
                this.movies = response.data;
            } catch (ex) {
                console.log("ERROR:", ex);
            }
        },
        async loadGenres() {
            try {
                const response = await axios.get(baseUri + "genre");
                this.genres = response.data;
            } catch (ex) {
                console.log("ERROR loading genres:", ex);
            }
        },
        async loadStreamingServices() {
            try {
                const response = await axios.get(baseUri + "streamingservice");
                this.streamingServices = response.data;
            } catch (ex) {
                console.log("ERROR loading streaming services:", ex);
            }
        },
        async searchMovies() {
            const hasTitle = this.searchTitle.trim();
            const hasGenre = this.selectedGenre;
            const hasService = this.selectedService;

            if (!hasTitle && !hasGenre && !hasService) {
                this.clearSearch();
                return;
            }

            try {
                const params = {};
                if (hasTitle)   params.title = this.searchTitle;
                if (hasGenre)   params.genres = this.selectedGenre;
                if (hasService) params.streamingServices = this.selectedService;

                const response = await axios.get(baseUri + "movie/search", { params });
                this.movies = response.data;
                this.isSearching = true;
            } catch (ex) {
                if (ex.response?.status === 404) {
                    this.movies = [];
                }
                console.log("ERROR:", ex);
            }
        },
        clearSearch() {
            this.searchTitle = '';
            this.selectedGenre = '';
            this.selectedService = '';
            this.isSearching = false;
            this.getMovies(baseUri + "movie");
        }
    }
}).mount("#app")
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

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

Vue.createApp({
    data() {
        return {
            movies: [],
            movie: null,
            UserName: localStorage.getItem('username'),
            // Settings modal
            showSettings: false,
            settingsUsername: '',
            settingsEmail: '',
            settingsNewPassword: '',
            settingsCurrentPassword: '',
            settingsError: null,
            settingsSuccess: null,
            settingsSaving: false,
        }
    },
    async created() {
        if (!localStorage.getItem('token')) {
            window.location.href = 'Log-in.html';
            return;
        }
        this.getMovies(baseUri + "movie");
    },
    methods: {
        getAllMovies() {
            this.getMovies(baseUri + "movie");
        },
        async getMovies(Uri) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(Uri, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.movies = response.data;
            } catch (ex) {
                console.log("ERROR:", ex);
            }
        },
        redirectToLogin() {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
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
                // Reauthenticate if changing email or password (Firebase requires it)
                if ((changingEmail || changingPassword) && this.settingsCurrentPassword) {
                    const credential = EmailAuthProvider.credential(user.email, this.settingsCurrentPassword);
                    await reauthenticateWithCredential(user, credential);
                } else if (changingEmail || changingPassword) {
                    this.settingsError = 'Indtast dit nuværende password for at ændre email eller password.';
                    this.settingsSaving = false;
                    return;
                }

                // Update display name
                if (this.settingsUsername !== user.displayName) {
                    await updateProfile(user, { displayName: this.settingsUsername });
                }

                // Update email in Firebase
                if (changingEmail) {
                    await updateEmail(user, this.settingsEmail);
                }

                // Update password in Firebase
                if (changingPassword) {
                    if (this.settingsNewPassword.length < 6) {
                        this.settingsError = 'Nyt password skal være mindst 6 tegn.';
                        this.settingsSaving = false;
                        return;
                    }
                    await updatePassword(user, this.settingsNewPassword);
                }

                // Sync updated username + email to backend DB
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

                // Update local state
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
}).mount("#app")
