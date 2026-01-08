import React, { useState, useEffect, useRef } from 'react';

const ZONE_A_EXERCISES = [
    {
        id: 1,
        regression: "DB Floor Press",
        main: "DB Flat Bench Press",
        progression: "Single-Arm DB Bench Press"
    },
    {
        id: 2,
        regression: "Chest-Supported DB Row",
        main: "1-Arm DB Bench Row",
        progression: "Paused 1-Arm DB Row"
    },
    {
        id: 3,
        regression: "Split Squat (Rear Foot Down)",
        main: "DB Bulgarian Split Squat",
        progression: "Front-Rack DB Bulgarian Split Squat"
    },
    {
        id: 4,
        regression: "DB Hip Hinge to Bench",
        main: "DB Romanian Deadlift",
        progression: "Single-Leg DB RDL"
    },
    {
        id: 5,
        regression: "Low Box Step-Up (BW)",
        main: "DB Step-Up",
        progression: "Knee-Drive DB Step-Up"
    },
    {
        id: 6,
        regression: "Neutral-Grip Seated DB Press",
        main: "DB Incline Bench Press",
        progression: "Tempo Incline DB Press"
    },
    {
        id: 7,
        regression: "Bent-Arm Rear Delt Fly",
        main: "Chest-Supported Rear Delt Fly",
        progression: "Long-Lever Rear Delt Raise"
    },
    {
        id: 8,
        regression: "Back-Supported DB Press",
        main: "DB Z-Press",
        progression: "Single-Arm DB Z-Press"
    },
    {
        id: 9,
        regression: "Incline Bench Renegade Row",
        main: "Bench-Supported Renegade Row",
        progression: "Feet-Elevated Renegade Row + Push-Up"
    },
    {
        id: 10,
        regression: "DB Glute Bridge",
        main: "DB Hip Thrust on Bench",
        progression: "Single-Leg DB Hip Thrust"
    }
];

// Firebase configuration placeholder
const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID"
};

export default function ZoneACircuitSync() {
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [participants, setParticipants] = useState(4);
    const [workTime, setWorkTime] = useState(40);
    const [restTime, setRestTime] = useState(20);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isWorkPhase, setIsWorkPhase] = useState(true);
    const [currentRound, setCurrentRound] = useState(1);
    const [sessionCode, setSessionCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isCoach, setIsCoach] = useState(false);
    const [showSetup, setShowSetup] = useState(true);
    const intervalRef = useRef(null);
    const firebaseRef = useRef(null);
    const dbRef = useRef(null);

    // Detect orientation changes
    useEffect(() => {
        const handleResize = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    // Initialize Firebase (if available)
    useEffect(() => {
        if (typeof firebase !== 'undefined' && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY') {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(FIREBASE_CONFIG);
                }
                firebaseRef.current = firebase;
            } catch (error) {
                console.warn('Firebase not initialized:', error);
            }
        }
    }, []);

    // Generate session code
    const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    // Create new session
    const createSession = () => {
        const code = generateCode();
        setSessionCode(code);
        setIsCoach(true);
        setIsConnected(true);
        setShowSetup(false);
        randomizeExercises();

        // If Firebase is available, create session in database
        if (firebaseRef.current) {
            dbRef.current = firebaseRef.current.database().ref(`sessions/${code}`);
            const initialState = {
                participants,
                workTime,
                restTime,
                isRunning: false,
                timeLeft: workTime,
                isWorkPhase: true,
                currentRound: 1,
                exercises: [],
                lastUpdate: Date.now()
            };
            dbRef.current.set(initialState);
        }
    };

    // Join existing session
    const joinSession = () => {
        if (!inputCode.trim()) return;
        const code = inputCode.trim().toUpperCase();
        setSessionCode(code);
        setIsCoach(false);
        setIsConnected(true);
        setShowSetup(false);

        // If Firebase is available, listen to session
        if (firebaseRef.current) {
            dbRef.current = firebaseRef.current.database().ref(`sessions/${code}`);
            dbRef.current.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setParticipants(data.participants);
                    setWorkTime(data.workTime);
                    setRestTime(data.restTime);
                    setIsRunning(data.isRunning);
                    setTimeLeft(data.timeLeft);
                    setIsWorkPhase(data.isWorkPhase);
                    setCurrentRound(data.currentRound);
                    if (data.exercises && data.exercises.length > 0) {
                        setSelectedExercises(data.exercises);
                    }
                }
            });
        }
    };

    // Update Firebase when state changes (coach only)
    useEffect(() => {
        if (isCoach && isConnected && dbRef.current && firebaseRef.current) {
            dbRef.current.update({
                isRunning,
                timeLeft,
                isWorkPhase,
                currentRound,
                participants,
                workTime,
                restTime,
                exercises: selectedExercises,
                lastUpdate: Date.now()
            });
        }
    }, [isRunning, timeLeft, isWorkPhase, currentRound, participants, workTime, restTime, selectedExercises, isCoach, isConnected]);

    // Randomize exercises
    const randomizeExercises = () => {
        const shuffled = [...ZONE_A_EXERCISES].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, participants);
        setSelectedExercises(selected);
        setIsRunning(false);
        setTimeLeft(workTime);
        setIsWorkPhase(true);
        setCurrentRound(1);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    // Timer controls
    const startTimer = () => {
        if (!isRunning && (isCoach || !isConnected)) {
            setIsRunning(true);
            setTimeLeft(isWorkPhase ? workTime : restTime);
        }
    };

    const pauseTimer = () => {
        if (isCoach || !isConnected) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    };

    const resetTimer = () => {
        if (isCoach || !isConnected) {
            setIsRunning(false);
            setTimeLeft(workTime);
            setIsWorkPhase(true);
            setCurrentRound(1);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    };

    // Timer logic
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            if (isWorkPhase) {
                setIsWorkPhase(false);
                setTimeLeft(restTime);
            } else {
                setIsWorkPhase(true);
                setCurrentRound(prev => prev + 1);
                setTimeLeft(workTime);
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft, isWorkPhase, workTime, restTime]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Setup screen
    if (showSetup) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div style={{
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{
                            color: '#fff',
                            fontSize: '2rem',
                            fontWeight: '800',
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            Zone A Circuit
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                            Synced Training Sessions
                        </p>
                    </div>

                    {/* Create Session */}
                    <div style={{
                        background: '#1e293b',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{
                            color: '#fff',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            margin: '0 0 12px 0'
                        }}>
                            Coach / Start Session
                        </h2>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '0.875rem',
                            margin: '0 0 20px 0',
                            lineHeight: '1.5'
                        }}>
                            Create a new session and share the code with your athletes
                        </p>
                        <button
                            onClick={createSession}
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '1rem',
                                fontWeight: '700',
                                color: '#fff',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            🎯 Create Session
                        </button>
                    </div>

                    {/* Join Session */}
                    <div style={{
                        background: '#1e293b',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{
                            color: '#fff',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            margin: '0 0 12px 0'
                        }}>
                            Athlete / Join Session
                        </h2>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '0.875rem',
                            margin: '0 0 20px 0',
                            lineHeight: '1.5'
                        }}>
                            Enter the session code from your coach
                        </p>
                        <input
                            type="text"
                            placeholder="Enter code (e.g., ABC123)"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '1.1rem',
                                border: '2px solid #334155',
                                borderRadius: '12px',
                                background: '#0f172a',
                                color: '#fff',
                                fontWeight: '600',
                                textAlign: 'center',
                                letterSpacing: '2px',
                                marginBottom: '12px',
                                textTransform: 'uppercase'
                            }}
                        />
                        <button
                            onClick={joinSession}
                            disabled={!inputCode.trim()}
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '1rem',
                                fontWeight: '700',
                                color: '#fff',
                                background: inputCode.trim()
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                    : '#475569',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: inputCode.trim() ? 'pointer' : 'not-allowed',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                boxShadow: inputCode.trim() ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                            }}
                        >
                            🔗 Join Session
                        </button>
                    </div>

                    {/* Firebase status */}
                    <div style={{
                        marginTop: '20px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '0.75rem'
                    }}>
                        {firebaseRef.current ? (
                            <span style={{ color: '#10b981' }}>✓ Realtime sync enabled</span>
                        ) : (
                            <span>⚠ Local mode only - add Firebase for sync</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Main workout view - Different layouts for portrait vs landscape
    const timerSection = (
        <div style={{
            background: isWorkPhase ? '#10b981' : '#ef4444',
            borderRadius: isLandscape ? '12px' : '16px',
            padding: isLandscape ? '20px' : '30px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: isLandscape ? 'auto' : '200px'
        }}>
            {/* Session code badge */}
            {isConnected && (
                <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    display: 'inline-block',
                    letterSpacing: '2px'
                }}>
                    {isCoach ? '👑 COACH' : '💪 ATHLETE'} • CODE: {sessionCode}
                </div>
            )}

            <div style={{
                color: '#fff',
                fontSize: isLandscape ? '0.9rem' : '1rem',
                fontWeight: '600',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                {isWorkPhase ? '💪 WORK' : '🧘 REST'}
            </div>
            <div style={{
                color: '#fff',
                fontSize: isLandscape ? '3rem' : '4rem',
                fontWeight: '800',
                lineHeight: '1',
                marginBottom: '8px'
            }}>
                {formatTime(timeLeft)}
            </div>
            <div style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: isLandscape ? '0.85rem' : '0.95rem',
                fontWeight: '600'
            }}>
                Round {currentRound}
            </div>

            {/* Controls - only show for coach or solo */}
            {(isCoach || !isConnected) && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={startTimer}
                        disabled={isRunning}
                        style={{
                            flex: isLandscape ? '0' : '1',
                            minWidth: isLandscape ? '60px' : '80px',
                            padding: isLandscape ? '10px 16px' : '12px 20px',
                            fontSize: isLandscape ? '0.85rem' : '0.95rem',
                            fontWeight: '700',
                            color: '#fff',
                            background: isRunning ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '8px',
                            cursor: isRunning ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ▶
                    </button>
                    <button
                        onClick={pauseTimer}
                        disabled={!isRunning}
                        style={{
                            flex: isLandscape ? '0' : '1',
                            minWidth: isLandscape ? '60px' : '80px',
                            padding: isLandscape ? '10px 16px' : '12px 20px',
                            fontSize: isLandscape ? '0.85rem' : '0.95rem',
                            fontWeight: '700',
                            color: '#fff',
                            background: !isRunning ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '8px',
                            cursor: !isRunning ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ⏸
                    </button>
                    <button
                        onClick={resetTimer}
                        style={{
                            flex: isLandscape ? '0' : '1',
                            minWidth: isLandscape ? '60px' : '80px',
                            padding: isLandscape ? '10px 16px' : '12px 20px',
                            fontSize: isLandscape ? '0.85rem' : '0.95rem',
                            fontWeight: '700',
                            color: '#fff',
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        ↻
                    </button>
                </div>
            )}
        </div>
    );

    const exercisesSection = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isLandscape ? '8px' : '12px',
            flex: 1,
            overflow: isLandscape ? 'auto' : 'visible'
        }}>
            {selectedExercises.map((exercise, index) => (
                <div
                    key={exercise.id}
                    style={{
                        background: '#1e293b',
                        borderRadius: isLandscape ? '8px' : '12px',
                        padding: '3px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr 1fr',
                        gap: '3px',
                        position: 'relative'
                    }}
                >
                    {/* Station badge */}
                    <div style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: '#0f172a',
                        color: '#94a3b8',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        zIndex: 1
                    }}>
                        {index + 1}
                    </div>

                    {/* Regression */}
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '6px',
                        padding: isLandscape ? '14px 8px' : '18px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            color: '#fff',
                            fontSize: isLandscape ? '0.7rem' : '0.8rem',
                            fontWeight: '600',
                            lineHeight: '1.3'
                        }}>
                            {exercise.regression}
                        </div>
                    </div>

                    {/* Main */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: '6px',
                        padding: isLandscape ? '14px 8px' : '18px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        boxShadow: '0 0 0 2px #475569'
                    }}>
                        <div style={{
                            color: '#0f172a',
                            fontSize: isLandscape ? '0.85rem' : '1rem',
                            fontWeight: '800',
                            lineHeight: '1.2',
                            textTransform: 'uppercase'
                        }}>
                            {exercise.main}
                        </div>
                    </div>

                    {/* Progression */}
                    <div style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '6px',
                        padding: isLandscape ? '14px 8px' : '18px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            color: '#fff',
                            fontSize: isLandscape ? '0.7rem' : '0.8rem',
                            fontWeight: '600',
                            lineHeight: '1.3'
                        }}>
                            {exercise.progression}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Landscape layout: side-by-side
    if (isLandscape) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                padding: '12px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                display: 'flex',
                gap: '12px'
            }}>
                {/* Timer column */}
                <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column' }}>
                    {timerSection}

                    {/* Settings (coach only) */}
                    {(isCoach || !isConnected) && (
                        <div style={{
                            background: '#1e293b',
                            borderRadius: '12px',
                            padding: '12px',
                            marginTop: '12px'
                        }}>
                            <button
                                onClick={randomizeExercises}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: '700',
                                    color: '#fff',
                                    background: '#8b5cf6',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                🎲 Shuffle
                            </button>
                        </div>
                    )}
                </div>

                {/* Exercises column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {exercisesSection}
                </div>
            </div>
        );
    }

    // Portrait layout: stacked
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {timerSection}

            {/* Settings (coach only) */}
            {(isCoach || !isConnected) && (
                <div style={{
                    background: '#1e293b',
                    borderRadius: '12px',
                    padding: '16px',
                    margin: '16px 0',
                    display: 'flex',
                    gap: '8px'
                }}>
                    <button
                        onClick={randomizeExercises}
                        style={{
                            flex: 1,
                            padding: '12px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: '#fff',
                            background: '#8b5cf6',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        🎲 Shuffle
                    </button>
                    <button
                        onClick={() => setShowSetup(true)}
                        style={{
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: '#fff',
                            background: '#64748b',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        ⚙️
                    </button>
                </div>
            )}

            {exercisesSection}

            {/* Legend */}
            <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#1e293b',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        background: '#3b82f6'
                    }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
                        Easier
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        background: '#f8fafc',
                        border: '2px solid #475569'
                    }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
                        Standard
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        background: '#ef4444'
                    }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
                        Harder
                    </span>
                </div>
            </div>
        </div>
    );
}