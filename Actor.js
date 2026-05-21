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
            menuOpen: false,
            UserName: localStorage.getItem('username'),
            actorName: '',
            loading: true,
        }
    },
    async created() {
        await loadMovieModalHTML();
        initMovieModal();

        const params = new URLSearchParams(window.location.search);
        this.actorName = params.get('name') || '';
        if (this.actorName) {
            await this.getActorMovies(this.actorName);
        }
    },
    methods: {
        redirectToLogin() {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'Log-in.html';
        },
        async getActorMovies(actorName) {
            try {
                const token = localStorage.getItem('token');
                const url = baseUri + 'Movie/search?Actors=' + encodeURIComponent(actorName);
                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.movies = response.data;
                this.loading = false;
            } catch (ex) {
                console.log("ERROR:", ex);
                this.loading = false;
            }
        }
    }
}).mount('#app');