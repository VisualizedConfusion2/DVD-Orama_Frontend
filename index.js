const baseUri = "https://dvd-oramaservices-e5bfgqbse9g5edg7.swedencentral-01.azurewebsites.net/api/"
console.log("Base URI:", baseUri) // <-- check the base URI
Vue.createApp({
    data(){
        return{
            movies: [],
            movie: null,

        }
    },
    async created() {console.log("Base URI in created hook:", baseUri+"movie") // <-- check the base URI in created hook
        console.log("created method called")
        this.getMovies(baseUri+"movie") // <-- check the URI being called

    },
    methods: {
            getAllMovies(){
                this.getMovies(baseUri+"movie") // <-- check the URI being called
            },
            async getMovies(Uri) {
        try {
            const response = await axios.get(Uri);

            console.log("RAW RESPONSE:", response);
            console.log("DATA:", response.data);

            this.movies = response.data;
            console.log("MOVIES STATE:", this.movies);

        } catch (ex) {
            console.log(this.baseUri)
            console.log("ERROR:", ex);
        }
    }
    }
}).mount("#app")