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
            didYouMean: [],
            movie: null,
            loading: true,  // starts true so table waits for data
            UserName: localStorage.getItem('username'),
            searchTitle: '',
            showSettings: false,
            selectedGenre: '',
            selectedService: '',
            selectedYear: null,
            isSearching: false,
            genres: [],
            streamingServices: [],
            suggestions: [],
            activeSuggestion: -1,
            suggestDebounce: null,
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
        await this.getMovies(baseUri + "movie");
        await this.loadGenres();
        await this.loadStreamingServices();
    },
    methods: {
        getAllMovies() {
            this.getMovies(baseUri + "movie");
        },
        async getMovies(uri) {
            this.loading = true;
            try {
                const response = await axios.get(uri);
                this.movies = response.data;
            } catch (ex) {
                console.log("ERROR:", ex);
            } finally {
                this.loading = false;
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
            const hasTitle   = this.searchTitle.trim();
            const hasGenre   = this.selectedGenre;
            const hasService = this.selectedService;
            const hasYear    = this.selectedYear;

            if (!hasTitle && !hasGenre && !hasService && !hasYear) {
                this.clearSearch();
                return;
            }

            this.loading = true;
            try {
                const params = {};
                if (hasTitle)   params.title = this.searchTitle;
                if (hasGenre)   params.genres = this.selectedGenre;
                if (hasService) params.streamingServices = this.selectedService;
                if (hasYear)    params.publicationYear = this.selectedYear;

                const response = await axios.get(baseUri + "movie/search", { params });
                this.movies = response.data;
                this.isSearching = true;
                this.didYouMean = [];
            } catch (ex) {
                if (ex.response?.status === 404) {
                    this.movies = [];
                    this.isSearching = true;
                    if (this.searchTitle.trim()) {
                        await this.fetchSuggestions(this.searchTitle.trim());
                    }
                }
                console.log("ERROR:", ex);
            } finally {
                this.loading = false;
            }
        },
        async fetchSuggestions(title) {
            try {
                const response = await axios.get(baseUri + "movie/suggest", {
                    params: { title }
                });
                this.didYouMean = response.data;
            } catch {
                this.didYouMean = [];
            }
        },
        clearSearch() {
            this.searchTitle    = '';
            this.selectedGenre  = '';
            this.selectedService = '';
            this.selectedYear   = null;
            this.isSearching    = false;
            this.didYouMean     = [];
            this.getMovies(baseUri + "movie");
        },
        async onTitleInput() {
            clearTimeout(this.suggestDebounce);
            const q = this.searchTitle.trim();
            if (q.length < 2) {
                this.suggestions = [];
                return;
            }
            const self = this;
            this.suggestDebounce = setTimeout(async () => {
                try {
                    const res = await axios.get(baseUri + 'movie/suggestions', {
                        params: { query: q }
                    });
                    self.suggestions = res.data;
                    self.activeSuggestion = -1;
                } catch (e) {
                    self.suggestions = [];
                }
            }, 250);
        },
        selectSuggestion(title) {
            this.searchTitle = title;
            this.suggestions = [];
            this.searchMovies();
        },
        hideSuggestions() {
            setTimeout(() => { this.suggestions = []; }, 400);
        },
        onSuggestionKeydown(e) {
            if (!this.suggestions.length) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.activeSuggestion = Math.min(this.activeSuggestion + 1, this.suggestions.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.activeSuggestion = Math.max(this.activeSuggestion - 1, 0);
            } else if (e.key === 'Enter' && this.activeSuggestion >= 0) {
                this.selectSuggestion(this.suggestions[this.activeSuggestion]);
            } else if (e.key === 'Escape') {
                this.suggestions = [];
            }
        },
        redirectToLogin() {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'Log-in.html';
        },
        openSettings() {
            const user = auth.currentUser;
            this.settingsUsername    = user?.displayName || this.UserName || '';
            this.settingsEmail       = user?.email || '';
            this.settingsNewPassword = '';
            this.settingsCurrentPassword = '';
            this.settingsError   = null;
            this.settingsSuccess = null;
            this.showSettings    = true;
        },
        async saveSettings() {
            this.settingsError   = null;
            this.settingsSuccess = null;
            this.settingsSaving  = true;

            const user = auth.currentUser;
            if (!user) {
                this.settingsError  = 'Ikke logget ind. Genindlæs siden.';
                this.settingsSaving = false;
                return;
            }

            const changingEmail    = this.settingsEmail !== user.email;
            const changingPassword = this.settingsNewPassword.length > 0;

            try {
                if ((changingEmail || changingPassword) && this.settingsCurrentPassword) {
                    const credential = EmailAuthProvider.credential(user.email, this.settingsCurrentPassword);
                    await reauthenticateWithCredential(user, credential);
                } else if (changingEmail || changingPassword) {
                    this.settingsError  = 'Indtast dit nuværende password for at ændre email eller password.';
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
                        this.settingsError  = 'Nyt password skal være mindst 6 tegn.';
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
}).mount("#app")
