const baseUriLogIn = "https://dvd-oramaservices-e5bfgqbse9g5edg7.swedencentral-01.azurewebsites.net/api/"
console.log("Base URI:", baseUriLogIn) // <-- check the base URI
Vue.createApp({
    data(){
        return{
            Users: ['John Doe', 'Jane Smith', 'Alice Johnson'],
            User: null,
        }
    },
    methods:
    {
        redirect(userName) 
        {
            console.log("Selected user:", userName);
            this.User = userName;
            window.location.href = 'index.html';
            // Here you can add logic to redirect to another page or perform actions based on the selected user
            // For example, you could use window.location.href to navigate to a different page
            // window.location.href = `welcome.html?user=${encodeURIComponent(user)}`;
        },
    }
}).mount("#app")