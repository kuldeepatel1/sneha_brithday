import React, { useRef, useState, useEffect, useCallback } from 'react';
import speakerOn from '../assets/img/svg/speaker-on-icon.svg';
import speakerOff from '../assets/img/svg/speaker-off-icon.svg';
import PfpImg from '../assets/img/jpg/pfp.jpg';
import BigPlayImg from '../assets/img/svg/big-play-icon.svg';
import BigLikeImg from '../assets/img/svg/big-like-icon.svg';
import LikeWhite from '../assets/img/svg/like-icon.svg';
import LikeRed from '../assets/img/svg/red-like-icon.svg';
import ReelBack from '../assets/img/svg/reel-back-icon.svg';
import { Link } from 'react-router-dom';

export default function Song({ 
    song, 
    ind, 
    audioRef, 
    copyName,
    isPlaying = false, 
    isMuted = false,
    onMute,
    onEnded
}) {
    const [speaker, setSpeaker] = useState(speakerOff);
    const [isLiked, setIsLiked] = useState({});
    const [localPlaying, setLocalPlaying] = useState(false);
    const vidRef = useRef(null);
    const cardRef = useRef(null);

    // Forward audio ref to parent
    useEffect(() => {
        if (vidRef.current && audioRef) {
            audioRef(vidRef.current);
        }
    }, [audioRef]);

    // Sync speaker icon with isMuted prop
    useEffect(() => {
        setSpeaker(isMuted ? speakerOff : speakerOn);
    }, [isMuted]);

    // Sync with parent isPlaying prop
    useEffect(() => {
        setLocalPlaying(isPlaying);
        setSpeaker(isPlaying ? speakerOn : speakerOff);
        
        // Play/pause audio based on isPlaying (only for active copy)
        if (vidRef.current) {
            if (isPlaying) {
                vidRef.current.play().catch(e => console.log('Play prevented:', e));
            } else {
                vidRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Handle speaker toggle
    const toggleSpeaker = (e) => {
        e.stopPropagation();
        if (vidRef.current) {
            if (vidRef.current.paused) {
                vidRef.current.play();
                setSpeaker(speakerOn);
                setLocalPlaying(true);
            } else {
                vidRef.current.pause();
                setSpeaker(speakerOff);
                setLocalPlaying(false);
            }
        }
        if (onMute) {
            onMute();
        }
    };

    // Single click to toggle play/pause
    const togglePlay = () => {
        if (vidRef.current) {
            if (localPlaying) {
                vidRef.current.pause();
                setLocalPlaying(false);
                setSpeaker(speakerOff);
            } else {
                vidRef.current.play();
                setLocalPlaying(true);
                setSpeaker(speakerOn);
            }
        }
    };

    const heart = (index) => {
        const heartImg = document.querySelectorAll('.big-like-img img')[index];
        if (!heartImg) return;
        
        const startTime = performance.now();
        const duration = 1000;

        const animateHeartbeat = (timestamp) => {
            const progress = (timestamp - startTime) / duration;
            const easeProgress = easeInOutCubic(progress);
            const opacity = 1;
            const scale = 1 + 0.3 * easeProgress;
            heartImg.style.transform = `scale(${scale})`;
            heartImg.style.opacity = opacity;

            if (progress < 1) {
                requestAnimationFrame(animateHeartbeat);
            } else {
                heartImg.style.transform = 'scale(1)';
                heartImg.style.opacity = 0;
            }
        };

        requestAnimationFrame(animateHeartbeat);
    }
    
    const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const handleLike = (event, ind) => {
        event.stopPropagation();
        const songIndex = parseInt(ind);
        
        if (isLiked[songIndex]) {
            setIsLiked(prev => ({
                ...prev,
                [songIndex]: false
            }));
        } else {
            heart(songIndex);
            setIsLiked(prev => ({
                ...prev,
                [songIndex]: true
            }));
        }
    };

    const doubleClick = (event, ind) => {
        event.stopPropagation();
        heart(parseInt(ind));
        const songIndex = parseInt(ind);
        setIsLiked(prev => ({
            ...prev,
            [songIndex]: true
        }));
    }

    const handleAudioEnded = () => {
        if (onEnded) {
            onEnded();
        }
    };

    return (
        <>
            <div className="player-card d-flex flex-column position-relative"
                ref={cardRef}
                onClick={togglePlay}
                onDoubleClick={(event) => doubleClick(event, parseInt(song.id - 1))}>

                {/* Reel Back */}
                <Link to='/songs' className='reel-back' onClick={(e) => e.stopPropagation()}>
                    <img src={ReelBack} alt="reel-back-icon/svg" />
                </Link>

                {/* Speaker Label */}
                <div className="speaker-label d-flex align-items-center justify-content-center position-absolute" onClick={toggleSpeaker}>
                    <img src={speaker} alt="speaker-label" />
                </div>

                {/* BG Image */}
                <img className='player-img'
                    src={song.img}
                    alt={`player-img${ind}`} />

                {/* Like Code */}
                <button className="like-btn position-absolute" onClick={(event) => handleLike(event, parseInt(song.id - 1))}>
                    <img src={isLiked[parseInt(song.id - 1)] ? LikeRed : LikeWhite} alt={isLiked ? "like-red/svg" : "like-white/svg"} />
                </button>

                {/* Big Heart Icon */}
                {
                    <div className='big-like-img'>
                        <img src={BigLikeImg} alt="big-like-icon/svg" />
                    </div>
                }

                {/* Big Play Icon */}
                {
                    localPlaying ? <></> :
                        <div className='big-play-img'>
                            <img src={BigPlayImg} alt="big-play-icon/svg" />
                        </div>
                }

                {/* Audio */}
                <audio 
                    src={song.song} 
                    ref={vidRef} 
                    loop
                    onEnded={handleAudioEnded}
                ></audio>

                {/* Id: */}
                <div className="reel-id d-flex align-items-center">
                    <div className="pfp-img">
                        <img src={PfpImg} alt="pfp-img/jpg" />
                    </div>
                    <h6>Anshika Singh</h6>
                </div>

                {/* Description */}
                <p className='reel-desp'>
                    {song.p}
                </p>

                {/* Audio Sliding Title */}
                <a href={song.yt}
                    target='_blank'
                    rel='noreferrer'
                    className="tag-player-box position-absolute d-flex flex-column align-items-start overpass"
                    onClick={(e) => e.stopPropagation()}>
                    <span className="song-player-name d-flex align-items-center justify-content-center">
                        <p className="mb-0 position-relative">♪</p>{' '}{song.title}
                    </span>
                </a>
            </div>
        </>
    );
};

