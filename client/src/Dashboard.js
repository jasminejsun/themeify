import { useState, useEffect } from "react"
import useAuth from './useAuth'
import { Container, Form } from "react-bootstrap"
import SpotifyWebApi from "spotify-web-api-node"
import axios from "axios"
import TrackSearchResult from './TrackSearchResult'
import Player from './Player'
import './Dashboard.scss'

const spotifyApi = new SpotifyWebApi({
    clientId: "b5505dc1e4ae428e8d773a7066fa835f",
})

export default function Dashboard({ code }) {
    const accessToken = useAuth(code)
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [playingTrack, setPlayingTrack] = useState()
    const [lyrics, setLyrics] = useState()
    const [isNeutral, setIsNeutral] = useState(false)
    const [isCute, setIsCute] = useState(false)
    const [isClassic, setIsClassic] = useState(true)

    function chooseTrack(track) {
        setPlayingTrack(track)
        setSearch("")
        setLyrics("")
    }

    useEffect(() => {
        if (!playingTrack) return

        axios.get('http://localhost:3001/lyrics', {
            params: {
                track: playingTrack.title,
                artist: playingTrack.artist,
            },
        })
        .then(res => {
            setLyrics(res.data.lyrics)
        })
    }, [playingTrack])

    useEffect(() => {
        if (!accessToken) return
        spotifyApi.setAccessToken(accessToken)
    }, [accessToken])

    useEffect(() => {
        if (!search) return setSearchResults([])
        if (!accessToken) return

        let cancel = false
        spotifyApi.searchTracks(search).then(res => {
            if (cancel) return
            setSearchResults(res.body.tracks.items.map(track => {
                const smallestImage = track.album.images.reduce(
                (smallest, image) => {
                    if (image.height < smallest.height) return image
                    return smallest
                }, track.album.images[0])
                return {
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestImage.url
                }
            }))
        })

        return () => cancel = true
    }, [search, accessToken])

    const handleClassicToggle = () => {
        setIsCute(false)
        setIsNeutral(false)
        setIsClassic(true)
    };

    const handleNeutralToggle = () => {
        setIsCute(false)
        setIsNeutral(!isNeutral);
    };
    
    const handleCuteToggle = () => {
        setIsNeutral(false)
        setIsCute(!isCute);
    };

    return (
    <div className={isClassic ? "classic" : null}>
    <div className={isCute ? "cute" : null}>
    <div className={isNeutral ? "neutral" : null}>
    <Container className="d-flex flex-column py-2" style={{height: "100vh"}}>
        <Container className="d-flex flex-row">
            <button className="btn btn-dark btn-lg m-3" onClick={handleClassicToggle}>Classic</button>
            <button className="btn btn-cute btn-lg m-3" onClick={handleCuteToggle}>Cute</button>
            <button className="btn btn-neutral btn-lg m-3" onClick={handleNeutralToggle}>Neutral</button>
        </Container>
        <Form.Control 
        type="search" 
        placeholder="Artists, songs, or podcasts" 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
        />
        <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
            {searchResults.map(track => (
                <TrackSearchResult track={track} key={track.uri} chooseTrack={chooseTrack} />
            ))}
            {searchResults.length === 0 && (
            <div className="text-center" style={{ whiteSpace: "pre" }}>
                {lyrics}
            </div>
            )}
        </div>
        <div>
            <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
        </div>
    </Container>
    </div>
    </div>
    </div>
    )
}
