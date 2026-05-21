import { BASE_URL as baseUri } from "./api-config.js";
export async function loadMovieModalHTML() {
    const res = await fetch('./movieModal.html');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);
}
export function initMovieModal() {
    $(document).ready(function () {
        let currentMovieTitle = '';

        $('#movieModal').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget);
            currentMovieTitle = button.attr('data-title') || '—';

            // Poster
            var poster = button.attr('data-poster');
            var img = document.getElementById('modal-poster-img');
            if (poster && poster !== 'null' && poster !== 'undefined') {
                img.src = poster;
                img.style.display = 'block';
            } else {
                img.src = '';
                img.style.display = 'none';
            }

            // Text fields
            document.getElementById('modal-title').textContent    = currentMovieTitle;
            document.getElementById('modal-year').textContent     = button.attr('data-year')     || '—';
            document.getElementById('modal-duration').textContent = button.attr('data-duration') || '—';

            // Streaming locations
            var list = document.getElementById('modal-streaming-list');
            list.innerHTML = '';
            try {
                var locations = JSON.parse(button.attr('data-streaming') || '[]') || [];
                if (locations.length === 0) {
                    var empty = document.createElement('li');
                    empty.style.color = '#f0e8d5';
                    empty.textContent = 'No streaming locations available.';
                    list.appendChild(empty);
                } else {
                    locations.forEach(function (location) {
                        var url  = location.url || '#';
                        var name = location.streamingServiceName || url;
                        var a = document.createElement('a');
                        a.href = url;
                        a.target = '_blank';
                        a.rel = 'noopener';
                        a.style.color = '#0097EE';
                        a.textContent = name;
                        var li = document.createElement('li');
                        li.style.marginTop = '0.4rem';
                        li.appendChild(a);
                        list.appendChild(li);
                    });
                }
            } catch (e) {
                console.log('Streaming parse error:', e);
            }

            // Actors
            var actorsList = document.getElementById('modal-actors-list');
            actorsList.innerHTML = '';
            try {
                var actors = JSON.parse(button.attr('data-actors') || '[]') || [];
                if (actors.length === 0) {
                    var emptyActor = document.createElement('li');
                    emptyActor.style.color = '#f0e8d5';
                    emptyActor.textContent = 'No actors available.';
                    actorsList.appendChild(emptyActor);
                } else {
                    actors.forEach(function (actorName) {
                        var a = document.createElement('a');
                        a.href = 'Actor.html?name=' + encodeURIComponent(actorName);
                        a.style.color = '#0097EE';
                        a.style.cursor = 'pointer';
                        a.textContent = actorName;
                        var li = document.createElement('li');
                        li.style.marginTop = '0.4rem';
                        li.appendChild(a);
                        actorsList.appendChild(li);
                    });
                }
            } catch (e) {
                console.log('Actors parse error:', e);
            }
        });

        // Stop trailer when trailer modal closes
        $('#trailerModal').on('hide.bs.modal', function () {
            document.getElementById('trailer-iframe').src = '';
            document.getElementById('trailer-iframe').style.display = 'none';
            document.getElementById('trailer-loading').style.display = 'block';
            document.getElementById('trailer-not-found').style.display = 'none';
        });

        // Expose openTrailerModal globally
        window.openTrailerModal = function () {
            $('#trailerModal').modal('show');

            fetch(`${baseUri}trailer?title=${encodeURIComponent(currentMovieTitle)}`)
                .then(res => res.json())
                .then(data => {
                    document.getElementById('trailer-loading').style.display = 'none';
                    if (data.embedUrl) {
                        document.getElementById('trailer-iframe').src = data.embedUrl;
                        document.getElementById('trailer-iframe').style.display = 'block';
                    } else {
                        document.getElementById('trailer-not-found').style.display = 'block';
                    }
                })
                .catch(() => {
                    document.getElementById('trailer-loading').style.display = 'none';
                    document.getElementById('trailer-not-found').style.display = 'block';
                });
        };
    });
}