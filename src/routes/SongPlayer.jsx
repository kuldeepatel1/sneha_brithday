import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import songList from '../assets/data/song-list';
import Song from '../components/Song';

export default function SongPlayer() {
    const { id } = useParams();

    const [currentSongId, setCurrentSongId] = useState(parseInt(id) || 1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const [showGuide, setShowGuide] = useState(true);
    const hasPlayedOnce = useRef(false);
    const isScrollingProgrammatically = useRef(false);

    const audioRefs = useRef({});
    const containerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const initPlayAttemptRef = useRef(0);
    // Initial load - scroll to selected song and play it
    useEffect(() => {
        const targetSongId = parseInt(id) || 1;
        const targetSongIdStr = String(targetSongId);

        // Set the current song id and start playing
        setCurrentSongId(targetSongId);
        setIsPlaying(true);

        // PAUSE ALL OTHER AUDIO FIRST before playing the selected song
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });

        // SCROLL TO THE SELECTED SONG - with retry mechanism
        isScrollingProgrammatically.current = true;
        const tryScroll = () => {
            const container = containerRef.current;
            if (container) {
                const targetIndex = songList.findIndex(song => parseInt(song.id) === targetSongId);
                if (targetIndex >= 0) {
                    const cardHeight = 568;
                    container.scrollTop = targetIndex * cardHeight;
                    
                    // Verify scroll happened, retry if needed
                    if (container.scrollTop !== targetIndex * cardHeight) {
                        setTimeout(tryScroll, 50);
                    } else {
                        // Allow scroll handler after scroll is complete
                        setTimeout(() => {
                            isScrollingProgrammatically.current = false;
                        }, 100);
                    }
                }
            } else {
                setTimeout(tryScroll, 50);
            }
        };
        
        // Start scrolling after a small delay
        setTimeout(tryScroll, 100);

        // Try to play the audio with retry mechanism
        const tryPlayAudio = () => {
            initPlayAttemptRef.current += 1;
            // Use string ID to match audioRef registration
            const audio = audioRefs.current[targetSongIdStr];

            if (audio) {
                audio.play()
                    .then(() => {
                        console.log('Audio started playing for song:', targetSongId);
                    })
                    .catch(e => {
                        console.log('Play prevented:', e);
                        // Retry a few times if play is prevented
                        if (initPlayAttemptRef.current < 5) {
                            setTimeout(tryPlayAudio, 100);
                        }
                    });
            } else if (initPlayAttemptRef.current < 10) {
                // Audio ref not ready yet, retry
                setTimeout(tryPlayAudio, 50);
            }
        };

        // Start trying to play after a small delay
        const timer = setTimeout(tryPlayAudio, 100);

        return () => {
            clearTimeout(timer);
            initPlayAttemptRef.current = 0;
        };
    }, [id]);

    // Handle scroll - infinite loop with 3 copies
    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const cardHeight = 568;
        const index = Math.round(container.scrollTop / cardHeight);

        const clampedIndex = Math.max(0, Math.min(index, songList.length - 1));
        const newSongId = parseInt(songList[clampedIndex].id);
        const newSongIdStr = songList[clampedIndex].id; // Already a string

        if (newSongId !== currentSongId) {
            Object.values(audioRefs.current).forEach(a => a?.pause());

            setCurrentSongId(newSongId);
            setIsPlaying(true);

            window.history.replaceState(null, '', `/song/${newSongId}`);

            setTimeout(() => {
                const audio = audioRefs.current[newSongIdStr];
                if (audio) {
                    audio.muted = isMuted;
                    audio.play().catch(() => { });

                    // SHOW GUIDE ONLY ON FIRST PLAY
                    if (!hasPlayedOnce.current) {
                        hasPlayedOnce.current = true;
                        setShowGuide(false);
                    }
                }
            }, 50);
        }
    }, [currentSongId, isMuted]);

    useEffect(() => {
        let isScrolling = false;
        const container = containerRef.current;

        const onScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                if (!isScrolling) {
                    isScrolling = true;
                    handleScroll();
                    isScrolling = false;
                }
            }, 50);
        };

        if (container) {
            container.addEventListener('scroll', onScroll, { passive: true });
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', onScroll);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [handleScroll]);

    const handleMuteToggle = useCallback((songId) => {
        if (songId === currentSongId) {
            const audio = audioRefs.current[String(songId)];
            if (audio) {
                audio.muted = !isMuted;
                setIsMuted(!isMuted);
            }
        }
    }, [currentSongId, isMuted]);

    // Continue playing (loop) the same song when it ends
    const handleSongEnded = useCallback((currentId) => {
        const audio = audioRefs.current[String(currentId)];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    }, []);

    const handleStop = useCallback((songId) => {
        if (songId === currentSongId) {
            const audio = audioRefs.current[String(songId)];
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            setIsPlaying(false);
        }
    }, [currentSongId]);

    return (
        <>
            <main className="player-page d-flex flex-column align-items-center justify-content-center">
                <div className="score-area">
                    {showGuide && (
                        <p className="score-guide">
                            👆 Swipe up/down to change songs
                            🔊 Tap mute to control sound
                        </p>
                    )}
                </div>

                <div className="video-container" ref={containerRef}>
                    {songList.map((song, ind) => (
                        <Song
                            key={song.id}
                            song={song}
                            ind={ind}
                            audioRef={(audio) => {
                                if (audio) audioRefs.current[song.id] = audio;
                            }}
                            isPlaying={currentSongId === parseInt(song.id) && isPlaying}
                            isMuted={currentSongId === parseInt(song.id) && isMuted}
                            onMute={() => handleMuteToggle(parseInt(song.id))}
                            onEnded={() => handleSongEnded(parseInt(song.id))}
                            onStop={() => handleStop(parseInt(song.id))}
                        />
                    ))}
                </div>
            </main>
        </>
    );
};
