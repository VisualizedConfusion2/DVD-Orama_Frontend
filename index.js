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