import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import songList from '../assets/data/song-list';
import Song from '../components/Song';

export default function SongPlayer() {
    const { id } = useParams();
    const [currentSongId, setCurrentSongId] = useState(parseInt(id) || 1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentCopy, setCurrentCopy] = useState('middle'); // 'first', 'middle', or 'last'
    const audioRefs = useRef({});
    const containerRef = useRef(null);
    const isFirstLoad = useRef(true);
    const scrollTimeoutRef = useRef(null);
    const isTransitioning = useRef(false);

    // Initial load - scroll to selected song and play it
    useEffect(() => {
        const initPlayer = () => {
            const container = containerRef.current;
            if (!container) return;

            const targetSongId = parseInt(id) || 1;
            const cardHeight = 568;

            // Calculate position (we have 3 copies of the list)
            // Middle copy starts at songList.length * cardHeight
            const middleOffset = songList.length * cardHeight;
            const targetPosition = middleOffset + ((targetSongId - 1) * cardHeight);

            // Use scrollTop directly to avoid scrollTo behavior issues
            container.scrollTop = targetPosition;

            setTimeout(() => {
                // Stop all audios
                Object.keys(audioRefs.current).forEach(key => {
                    if (audioRefs.current[key]) {
                        audioRefs.current[key].pause();
                    }
                });

                setCurrentSongId(targetSongId);
                setCurrentCopy('middle');
                setIsPlaying(true);

                setTimeout(() => {
                    const audio = audioRefs.current[`middle-${targetSongId}`];
                    if (audio) {
                        audio.play().catch(e => console.log('Play prevented:', e));
                    }
                }, 50);
            }, 100);
        };

        initPlayer();
        isFirstLoad.current = false;
    }, [id]);

    // Handle scroll - infinite loop with 3 copies
    const handleScroll = useCallback(() => {
        if (isTransitioning.current) return;
        
        const container = containerRef.current;
        if (!container) return;

        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        const cardHeight = 568;
        const totalSongs = songList.length;
        const singleCopyHeight = totalSongs * cardHeight;
        
        // We have 3 copies: [First Copy][Middle Copy][Last Copy]
        // First copy: 0 to singleCopyHeight
        // Middle copy: singleCopyHeight to 2 * singleCopyHeight
        // Last copy: 2 * singleCopyHeight to 3 * singleCopyHeight
        const middleOffset = singleCopyHeight;
        const lastOffset = 2 * singleCopyHeight;
        let copyName = 'middle';

        if (scrollTop < middleOffset) {
            copyName = 'first';
        } else if (scrollTop >= lastOffset) {
            copyName = 'last';
        } else {
            copyName = 'middle';
        }

        // If scrolled to the end of middle copy, jump to middle of first copy
        if (scrollTop >= lastOffset + singleCopyHeight - 100) {
            isTransitioning.current = true;
            container.scrollTop = scrollTop - singleCopyHeight;
            setTimeout(() => { isTransitioning.current = false; }, 50);
            return;
        }
        
        // If scrolled to the start of middle copy, jump to end of last copy
        if (scrollTop <= 100) {
            isTransitioning.current = true;
            container.scrollTop = scrollTop + singleCopyHeight;
            setTimeout(() => { isTransitioning.current = false; }, 50);
            return;
        }

        // Calculate which song is visible
        const adjustedScrollTop = scrollTop - middleOffset;
        const centerPosition = adjustedScrollTop + (containerHeight / 2);
        let visibleIndex = Math.floor(centerPosition / cardHeight);
        
        // Clamp to valid range
        visibleIndex = Math.max(0, Math.min(visibleIndex, totalSongs - 1));
        
        const newSongId = parseInt(songList[visibleIndex].id);

        if (newSongId !== currentSongId) {
            // Stop all audios
            Object.keys(audioRefs.current).forEach(key => {
                if (audioRefs.current[key]) {
                    audioRefs.current[key].pause();
                }
            });

            setCurrentSongId(newSongId);
            setCurrentCopy(copyName);
            setIsPlaying(true);
            
            window.history.replaceState(null, '', `/song/${newSongId}`);

            setTimeout(() => {
                const audioKey = `${copyName}-${newSongId}`;
                const audio = audioRefs.current[audioKey];
                if (audio) {
                    audio.play().catch(e => console.log('Play prevented:', e));
                }
            }, 50);
        } else if (copyName !== currentCopy) {
            // Still same song but different copy - update copy
            setCurrentCopy(copyName);
        }
    }, [currentSongId, currentCopy]);

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

    const handleMuteToggle = useCallback((songId, copyName) => {
        if (currentSongId === songId) {
            const audioKey = `${copyName}-${songId}`;
            const audio = audioRefs.current[audioKey];
            if (audio) {
                if (isMuted) {
                    audio.muted = false;
                    setIsMuted(false);
                } else {
                    audio.muted = true;
                    setIsMuted(true);
                }
            }
        }
    }, [currentSongId, isMuted]);

    const handleSongEnded = useCallback((currentId) => {
        const currentIndex = songList.findIndex(s => parseInt(s.id) === currentId);
        const container = containerRef.current;
        const cardHeight = 568;
        const singleCopyHeight = songList.length * cardHeight;
        const middleOffset = singleCopyHeight;

        if (currentIndex < songList.length - 1) {
            // Go to next song in middle copy
            container.scrollTop = middleOffset + ((currentIndex + 1) * cardHeight);
        } else {
            // Loop back to first song in middle copy
            container.scrollTop = middleOffset;
        }
    }, []);

    return (
        <>
            <main className="player-page d-flex flex-column align-items-center justify-content-center">
                <div className="video-container" id="video-container" ref={containerRef}>
                    {/* First Copy */}
                    {songList.map((song, ind) => (
                        <Song 
                            song={song}
                            ind={ind}
                            key={`first-${song.id}`}
                            copyName="first"
                            audioRef={(audio) => {
                                if (audio && !audioRefs.current[`first-${song.id}`]) {
                                    audioRefs.current[`first-${song.id}`] = audio;
                                }
                            }}
                            isPlaying={currentCopy === 'first' && currentSongId === parseInt(song.id) && isPlaying}
                            isMuted={currentCopy === 'first' && currentSongId === parseInt(song.id) && isMuted}
                            onMute={() => handleMuteToggle(parseInt(song.id), 'first')}
                            onEnded={() => handleSongEnded(parseInt(song.id))}
                        />
                    ))}
                    
                    {/* Middle Copy - Primary */}
                    {songList.map((song, ind) => (
                        <Song 
                            song={song}
                            ind={ind}
                            key={`middle-${song.id}`}
                            copyName="middle"
                            audioRef={(audio) => {
                                if (audio && !audioRefs.current[`middle-${song.id}`]) {
                                    audioRefs.current[`middle-${song.id}`] = audio;
                                }
                            }}
                            isPlaying={currentCopy === 'middle' && currentSongId === parseInt(song.id) && isPlaying}
                            isMuted={currentCopy === 'middle' && currentSongId === parseInt(song.id) && isMuted}
                            onMute={() => handleMuteToggle(parseInt(song.id), 'middle')}
                            onEnded={() => handleSongEnded(parseInt(song.id))}
                        />
                    ))}
                    
                    {/* Last Copy */}
                    {songList.map((song, ind) => (
                        <Song 
                            song={song}
                            ind={ind}
                            key={`last-${song.id}`}
                            copyName="last"
                            audioRef={(audio) => {
                                if (audio && !audioRefs.current[`last-${song.id}`]) {
                                    audioRefs.current[`last-${song.id}`] = audio;
                                }
                            }}
                            isPlaying={currentCopy === 'last' && currentSongId === parseInt(song.id) && isPlaying}
                            isMuted={currentCopy === 'last' && currentSongId === parseInt(song.id) && isMuted}
                            onMute={() => handleMuteToggle(parseInt(song.id), 'last')}
                            onEnded={() => handleSongEnded(parseInt(song.id))}
                        />
                    ))}
                </div>
            </main>
        </>
    );
};

