import axios from "axios";
import config from "../config/env.config.js";
import movieService from "./movie.service.js";
import seriesService from "./series.service.js";
import musicService from "./music.service.js";
import bookService from "./book.service.js";

const TMDB_API_KEY = config.tmdb.apiKey;
const TMDB_AUTH_TOKEN = config.tmdb.accessToken;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const SPOTIFY_CLIENT_ID = config.spotify.clientId;
const SPOTIFY_CLIENT_SECRET = config.spotify.clientSecret;
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";

const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";

const getSpotifyAccessToken = async () => {
    try {
        const response = await axios.post(
            SPOTIFY_TOKEN_URL,
            new URLSearchParams({
                grant_type: "client_credentials",
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: SPOTIFY_CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        return response.data.access_token;
    } catch (error) {
        console.error(`Failed to fetch Spotify access token: ${error.message}`);
        throw new Error("Failed to authenticate with Spotify API");
    }
};

const getTrendingMovies = async () => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/day`, {
            params: { api_key: TMDB_API_KEY },
            headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
        });
        const trendingItems = response.data.results.slice(0, 10);
        const movies = await Promise.all(
            trendingItems.map(async (item) => {
                try {
                    return await movieService.getMovieDetails({ id: item.id.toString(), userId: null });
                } catch (error) {
                    console.error(`Failed to fetch details for movie ${item.id}: ${error.message}`);
                    return null;
                }
            })
        );
        return movies.filter(Boolean);
    } catch (error) {
        console.error(`Failed to fetch trending movies: ${error.message}`);
        return [];
    }
};

const getTrendingSeries = async () => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/trending/tv/day`, {
            params: { api_key: TMDB_API_KEY },
            headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
        });
        const trendingItems = response.data.results.slice(0, 10);
        const series = await Promise.all(
            trendingItems.map(async (item) => {
                try {
                    return await seriesService.getSeriesDetails({ id: item.id.toString(), userId: null });
                } catch (error) {
                    console.error(`Failed to fetch details for series ${item.id}: ${error.message}`);
                    return null;
                }
            })
        );
        return series.filter(Boolean);
    } catch (error) {
        console.error(`Failed to fetch trending series: ${error.message}`);
        return [];
    }
};

const getTrendingMusic = async () => {
    try {
        const token = await getSpotifyAccessToken();
        let playlistId = "37i9dQZEVXbMDoHDwVN2tF";
        console.log(`Using Global Top 50 playlist ID: ${playlistId}`);

        let trendingTracks = [];
        try {
            const response = await axios.get(`${SPOTIFY_BASE_URL}/playlists/${playlistId}/tracks`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 10, market: 'US' }, // Added market parameter to avoid regional 404s
            });
            trendingTracks = response.data.items || [];
            console.log(`Fetched ${trendingTracks.length} trending tracks from playlist ${playlistId}`);
        } catch (error) {
            console.error(`Failed to fetch playlist tracks: ${error.message}`, error.response?.data);
            // Fallback to featured playlists
            try {
                const featuredResponse = await axios.get(`${SPOTIFY_BASE_URL}/browse/featured-playlists`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { limit: 1, country: 'US' },
                });
                const playlists = featuredResponse.data.playlists?.items || [];
                if (playlists.length > 0) {
                    playlistId = playlists[0].id;
                    const response = await axios.get(`${SPOTIFY_BASE_URL}/playlists/${playlistId}/tracks`, {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { limit: 10, market: 'US' },
                    });
                    trendingTracks = response.data.items || [];
                    console.log(`Fetched ${trendingTracks.length} tracks from featured playlist ${playlistId} as fallback`);
                }
            } catch (fallbackError) {
                console.error(`Fallback to featured playlists failed: ${fallbackError.message}`);
            }
            // Ultimate fallback to new releases
            if (trendingTracks.length === 0) {
                const newReleasesResponse = await axios.get(`${SPOTIFY_BASE_URL}/browse/new-releases`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { limit: 10, country: 'US' },
                });
                const albums = newReleasesResponse.data.albums?.items || [];
                trendingTracks = await Promise.all(
                    albums.map(async (album) => {
                        try {
                            const albumTracksResponse = await axios.get(`${SPOTIFY_BASE_URL}/albums/${album.id}/tracks`, {
                                headers: { Authorization: `Bearer ${token}` },
                                params: { limit: 1, market: 'US' },
                            });
                            const track = albumTracksResponse.data.items?.[0];
                            if (track) {
                                return {
                                    track: {
                                        ...track,
                                        album: {
                                            id: album.id,
                                            name: album.name,
                                            images: album.images || [],
                                            release_date: album.release_date,
                                            external_urls: album.external_urls || {},
                                        },
                                        artists: album.artists || [],
                                        popularity: album.popularity || 0,
                                    }
                                };
                            }
                            return null;
                        } catch (error) {
                            console.error(`Failed to fetch track for album ${album.id}: ${error.message}`);
                            return null;
                        }
                    })
                );
                trendingTracks = trendingTracks.filter(item => item !== null);
                console.log(`Fetched ${trendingTracks.length} representative tracks from new releases as fallback`);
            }
        }

        if (trendingTracks.length === 0) {
            console.warn("All Spotify fetches failed; returning minimal fallback data");
            return [{
                title: "Fallback Track",
                artist: null,
                spotifyId: "fallback-id",
                album: "Unknown Album",
                coverImage: { url: "https://via.placeholder.com/500", publicId: "default-cover" },
                releaseYear: new Date().getFullYear(),
                duration: "0 min",
                genres: [],
                availableOn: { spotify: null },
                isActive: true,
                isVerified: false,
            }];
        }

        const musicItems = await Promise.all(
            trendingTracks.map(async (trackItem) => {
                const track = trackItem.track;
                try {
                    return await musicService.getMusicDetails({ id: track.id, userId: null });
                } catch (error) {
                    console.error(`Failed to fetch details for music track ${track.id}: ${error.message}`);
                    return {
                        title: track.name || 'Unknown Track',
                        artist: track.artists?.[0]?.name ? {
                            name: track.artists[0].name,
                            slug: track.artists[0].name.toLowerCase().replace(/\s+/g, '-'),
                            _id: track.artists[0].id || null
                        } : null,
                        spotifyId: track.id,
                        album: track.album?.name || 'Unknown Album',
                        coverImage: {
                            url: track.album?.images?.[0]?.url || 'https://via.placeholder.com/500',
                            publicId: track.album?.id || 'default-cover'
                        },
                        releaseYear: track.album?.release_date ? parseInt(track.album.release_date.split('-')[0]) : new Date().getFullYear(),
                        duration: track.duration_ms ? `${Math.floor(track.duration_ms / 60000)} min ${Math.floor((track.duration_ms % 60000) / 1000)} sec` : '0 min',
                        genres: track.album?.genres?.slice(0, 5) || [],
                        availableOn: {
                            spotify: track.external_urls?.spotify || null
                        },
                        isActive: true,
                        isVerified: false,
                    };
                }
            })
        );
        return musicItems.filter(Boolean);
    } catch (error) {
        console.error(`Failed to fetch trending music: ${error.message}`, error.response?.data);
        return [{
            title: "Fallback Track",
            artist: null,
            spotifyId: "fallback-id",
            album: "Unknown Album",
            coverImage: { url: "https://via.placeholder.com/500", publicId: "default-cover" },
            releaseYear: new Date().getFullYear(),
            duration: "0 min",
            genres: [],
            availableOn: { spotify: null },
            isActive: true,
            isVerified: false,
        }];
    }
};

const getTrendingBooks = async () => {
    try {
        const response = await axios.get(`${OPEN_LIBRARY_BASE_URL}/trending/daily.json`);
        const trendingWorks = response.data.works.slice(0, 10);
        console.log(`Fetched ${trendingWorks.length} trending books from Open Library`);
        const books = await Promise.all(
            trendingWorks.map(async (work) => {
                const workId = work.key.split("/").pop();
                try {
                    return await bookService.getBookDetails({ id: workId, userId: null });
                } catch (error) {
                    console.error(`Failed to fetch details for book ${workId}: ${error.message}`);
                    return null;
                }
            })
        );
        return books.filter(Boolean);
    } catch (error) {
        console.error(`Failed to fetch trending books: ${error.message}`);
        return [];
    }
};

const trendingService = {
    getTrendingMovies,
    getTrendingSeries,
    getTrendingMusic,
    getTrendingBooks,
};

export default trendingService;