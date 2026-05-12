const baseUri = "https://dvd-oramaservices-e5bfgqbse9g5edg7.swedencentral-01.azurewebsites.net/api/"
console.log("Base URI:", baseUri)

Vue.createApp({
    data() {
        return {
            movies: [],
            movie: null,
            UserName: null,
            loading: true,  // ← add this
        }
    },
    async created() {
        console.log("Base URI in created hook:", baseUri + "movie")
        console.log("created method called")
        this.getMovies(baseUri + "movie")
    },
    methods: {
        redirectToLogin() {
            // add login redirect logic here
        },
        getAllMovies() {
            this.getMovies(baseUri + "movie")
        },
        async getMovies(Uri) {
            try {
                const response = await axios.get(Uri);
                console.log("RAW RESPONSE:", response);
                console.log("DATA:", response.data);
                this.movies = response.data;
                this.loading = false;
                console.log("MOVIES STATE:", this.movies);
                // Log first movie so you can see the exact field names from the API
                if (this.movies.length > 0) {
                    console.log("FIRST MOVIE:", this.movies[0]);
                    console.log("STREAMING LOCATIONS:", this.movies[0].streamingLocations);
                }
            } catch (ex) {
                console.log("ERROR:", ex);
            }
        },
    }
}).mount("#app")
