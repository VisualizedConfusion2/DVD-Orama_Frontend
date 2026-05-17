const baseUri = "https://dvd-oramaservices-e5bfgqbse9g5edg7.swedencentral-01.azurewebsites.net/api/"
console.log("Base URI:", baseUri) // <-- check the base URI
Vue.createApp({
    data() {
        return {
            movies: [],
            movie: null,
            UserName: null,
            searchTitle: '',
            isSearching: false,
        }
    },
    async created() {
        this.getMovies(baseUri + "movie")
    },
    methods: {
        getAllMovies() {
            this.getMovies(baseUri + "movie")
        },
        async getMovies(Uri) {
            try {
                const response = await axios.get(Uri);
                this.movies = response.data;
            } catch (ex) {
                console.log("ERROR:", ex);
            }
        },
        async searchMovies() {
            if (!this.searchTitle.trim()) {
                this.clearSearch();
                return;
            }
            try {
                const response = await axios.get(baseUri + "movie/search", {
                    params: { title: this.searchTitle }
                });
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
            this.isSearching = false;
            this.getMovies(baseUri + "movie");
        }
    }
}).mount("#app")