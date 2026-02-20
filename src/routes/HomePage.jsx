import React from 'react';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bars } from 'react-loader-spinner';



export default function SongPage() {

    const [index, setIndex] = React.useState(0);
    const [loading, setLoading] = React.useState(false);

    const words = ['Euphoria!', 'Enchanting!', 'Cheers!'];

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
    const interval = setInterval(() => {
        setIndex(prev => (prev + 1) % words.length);
    }, 3000);

    return () => clearInterval(interval);
}, [words.length]);

    React.useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {loading ? (
                <div style={{ height: "100vh" }}
                    className="loading-page w-100 d-flex align-items-center justify-content-center">
                    <Bars height="40" width="40" color="#ff6fab" ariaLabel="bars-loading" visible />
                </div>
            ) : (
                <main className='home d-flex flex-column align-items-center justify-content-center'>

                    <motion.div
                        className='motion-write text-center mulish ibm-plex-sans text-uppercase'
                        key={index}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                    >
                        {words[index]}
                    </motion.div>

                    <motion.div
                        className="transition-write-box text-center overpass d-flex align-items-center justify-content-center"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                    >
                        <Typewriter
                            words={[
                                'Happy Birthday Sneha (nuski)!',
                                'May this special day be as vibrant and wonderful as your presence in our lives.',
                                'Wishing you joy, success, and endless reasons to celebrate in the coming year.',
                                'Discover the heartwarming songs that have been specially dedicated by clicking the button below.'
                            ]}
                            loop={0}
                            cursor
                            typeSpeed={100}
                            deleteSpeed={100}
                            delaySpeed={1000}
                        />
                    </motion.div>

                    <motion.div
                        className="home-bottom overpass w-100 d-flex align-items-center justify-content-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45 }}
                    >
                        <Link to='/songs' className='home-btn overpass'>
                            Explore the Tunes
                        </Link>
                    </motion.div>

                </main>
            )}
        </>
    );
}