import { useState, useEffect, useRef } from 'react';
import { useSetPage } from '../hooks/usePage';
import pokemonData from '../pokemon-data.json';
// @ts-ignore
import '../App.css';
import { leaderboardService } from '../services/leaderboard';
import { formatTime } from '../services/formatter';

interface Pokemon {
  number: string;
  name: string;
  types: string[];
  imageUrl: string;
  fileName: string;
}

interface GameProps {
  currentPokemon: Pokemon | null;
  usedNumbers: Set<number>;
  score: {
    total: number;
    correct: number;
    wrong: number;
    skipped: number;
  };
  timer: number;
  showHints: boolean;
  gameStatus: 'playing' | 'revealed';
  guess: string;
  guessResult: null | 'correct' | 'wrong';
  canProceedWithEnter: boolean;
  gameTimer: number;
};

export const PokemonPage = () => {
  const setPage = useSetPage();
  const [gameState, setGameState] = useState<GameProps>({
    currentPokemon: null,
    usedNumbers: new Set(),
    score: {
      total: 0,
      correct: 0,
      wrong: 0,
      skipped: 0
    },
    timer: 5,
    showHints: false,
    gameStatus: 'playing', // playing, revealed
    guess: '',
    guessResult: null, // 'correct' or 'wrong'
    canProceedWithEnter: false,
    gameTimer: 0,
  });
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [postAsComment, setPostAsComment] = useState<boolean>(false);
  const canvasRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const getRandomPokemon = () => {
    const availablePokemon = pokemonData.filter(
      pokemon => !gameState.usedNumbers.has(parseInt(pokemon.number))
    );

    if (availablePokemon.length === 0) {
      // Game completed - all Pokemon have been shown
      return null;
    }

    const randomIndex = Math.floor(Math.random() * 151); //availablePokemon.length);
    return availablePokemon[randomIndex];
  };

  const loadPokemon = () => {
    const pokemon = getRandomPokemon();

    if (!pokemon) {
      // Handle game completion
      alert("Congratulations! You've seen all Pokemon!");
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = `/assets/images/artwork/${parseInt(pokemon.number)}.png`;

    image.onload = () => {
      imageRef.current = image;
      setGameState(prev => ({
        ...prev,
        currentPokemon: pokemon,
        timer: 5,
        showHints: false,
        gameStatus: 'playing',
        guess: '',
        guessResult: null,
        canProceedWithEnter: false,
        usedNumbers: new Set([...prev.usedNumbers, parseInt(pokemon.number)])
      }));

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    };
  };

  const drawSilhouette = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;  // Add safety check

    const ctx = canvas.getContext('2d');
    if (!ctx) return;  // Add safety check for context

    const img = imageRef.current;

    // Set canvas size while maintaining aspect ratio
    const maxSize = 300;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Draw the image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get image data and create silhouette
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) { // If pixel is not transparent
        data[i] = 0;     // Red
        data[i + 1] = 0; // Green
        data[i + 2] = 0; // Blue
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const checkGuess = (guess: string, pokemonName: string) => {
    // Convert both strings to lowercase and trim whitespace
    const normalizeString = (str: string) => {
      return str.toLowerCase().trim();
    };

    const normalizedGuess = normalizeString(guess);
    const normalizedName = normalizeString(pokemonName);

    // Calculate Levenshtein distance
    const levenshteinDistance = (str1: string, str2: string) => {
      const matrix = Array(str2.length + 1).fill(null)
        .map(() => Array(str1.length + 1).fill(null));

      for (let i = 0; i <= str1.length; i++) {
        matrix[0][i] = i;
      }
      for (let j = 0; j <= str2.length; j++) {
        matrix[j][0] = j;
      }

      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1, // deletion
            matrix[j - 1][i] + 1, // insertion
            matrix[j - 1][i - 1] + substitutionCost // substitution
          );
        }
      }
      return matrix[str2.length][str1.length];
    };

    // Calculate maximum allowed distance (10% of the longer string length)
    const maxLength = Math.max(normalizedGuess.length, normalizedName.length);
    const maxAllowedDistance = Math.ceil(maxLength * 0.1);

    // Get actual distance between strings
    const distance = levenshteinDistance(normalizedGuess, normalizedName);

    // Return true if the distance is within the tolerance
    return distance <= maxAllowedDistance;
  };

  const handleGuess = () => {
    if (!gameState.currentPokemon) return;

    const isCorrect = checkGuess(gameState.guess, gameState.currentPokemon.name);

    setGameState(prev => ({
      ...prev,
      gameStatus: 'revealed',
      guessResult: isCorrect ? 'correct' : 'wrong',
      canProceedWithEnter: true,
      score: {
        ...prev.score,
        correct: isCorrect ? prev.score.correct + 1 : prev.score.correct,
        wrong: isCorrect ? prev.score.wrong : prev.score.wrong + 1,
        total: prev.score.total + 1
      }
    }));
  };

  const handleSkip = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'revealed',
      guessResult: null,
      canProceedWithEnter: true,
      score: {
        ...prev.score,
        skipped: prev.score.skipped + 1,
        total: prev.score.total + 1
      }
    }));
  };

  const handleQuit = () => {
    setShowQuitModal(true);
  };

  const confirmQuit = () => {
    if (postAsComment) {
      // Logic to post as comment
      leaderboardService.addScore({
        playTimeInSeconds: gameState.gameTimer,
        correct: gameState.score.correct,
        total: gameState.score.total,
        skip: gameState.score.skipped
      });
    }
    setShowQuitModal(false);
    setPage('home');
  };

  const cancelQuit = () => {
    setShowQuitModal(false);
  };

  const renderHints = () => {
    if (!gameState.currentPokemon) return null;

    const pokemon = gameState.currentPokemon;
    const id = parseInt(pokemon.number);
    const generation = () => {
      if (id <= 151) return 'Kanto';
      if (id <= 251) return 'Johto';
      if (id <= 386) return 'Hoenn';
      if (id <= 493) return 'Sinnoh';
      if (id <= 649) return 'Unova';
      if (id <= 721) return 'Kalos';
      if (id <= 809) return 'Alola';
      if (id <= 905) return 'Galar';
      if (id <= 1017) return 'Hisui';
    };

    return (
      <div className="hints">
        <p>Types: {pokemon.types.join(', ')}</p>
        <p>Generation: {generation()}</p>
        {/* Add more hints as needed */}
      </div>
    );
  };

  useEffect(() => {
    loadPokemon();
  }, []);

  useEffect(() => {
    const gameTimerInterval = setInterval(() => {
      if (showQuitModal) 
        return;

      setGameState(prev => ({
        ...prev,
        gameTimer: prev.gameTimer + 1
      }));
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(gameTimerInterval);
  }, []);

  useEffect(() => {
    if (gameState.timer > 0 && gameState.gameStatus === 'playing') {
      drawSilhouette();
      timerRef.current = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timer: prev.timer - 1,
          showHints: prev.timer <= 1
        }));
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [gameState.timer, gameState.gameStatus]);

  // Add a useEffect to handle the keypress event
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' &&
        gameState.gameStatus === 'revealed' &&
        !gameState.canProceedWithEnter) {
        loadPokemon();
      }
      if (e.key === 'Enter' &&
        gameState.gameStatus === 'revealed' &&
        gameState.canProceedWithEnter) {
        gameState.canProceedWithEnter = false;
      }
    };

    // Add event listener
    window.addEventListener('keypress', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [gameState.gameStatus]); // Only re-run if gameStatus changes

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowQuitModal(false);
      }
    };

    if (showQuitModal) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showQuitModal]);

  return (
    <div className="pokemon-game">
      <button
        onClick={handleQuit}
        className="quit-button"
        aria-label="Quit game"
      >
        ×
      </button>

      <div className="score-board">
        <p>Time: {formatTime(gameState.gameTimer)}</p>
        <p>Total: {gameState.score.total}</p>
        <p>Correct: {gameState.score.correct}</p>
      </div>

      <div className="game-area">
        <div className="pokemon-display">
          {gameState.gameStatus === 'playing' && (
            <>
              <canvas ref={canvasRef} className="pokemon-canvas" />
              {gameState.showHints && renderHints()}
            </>
          )}
          {gameState.gameStatus === 'revealed' && (
            <div className="reveal-animation">
              <img
                src={imageRef.current?.src}
                alt={gameState.currentPokemon?.name}
                className="revealed-pokemon"
              />
              <div className="reveal-content">
                <div className={`guess-result ${gameState.guessResult}`}>
                  {gameState.guessResult === 'correct' ?
                    '✅ Correct!' :
                    gameState.guessResult === 'wrong' ?
                      '❌ Wrong! The correct answer is:' :
                      ''
                  }
                </div>
                <h2>{gameState.currentPokemon?.name}</h2>
                <div className="button-group">
                  <button onClick={loadPokemon}>Next</button>
                  <button className="button-danger" onClick={handleQuit}>End</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {gameState.gameStatus === 'playing' && (
          <div className="game-controls">
            <div className="timer">Hints in: {gameState.timer}s</div>
            <div className="game-input-area">
              <div className="game-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  value={gameState.guess}
                  onChange={(e) => setGameState(prev => ({
                    ...prev,
                    guess: e.target.value
                  }))}
                  placeholder="Who's that Pokemon?"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleGuess();
                  }}
                />
              </div>
              <div className="button-group">
                <button onClick={handleGuess}>Guess!</button>
                <button onClick={handleSkip}>I don't know</button>
              </div>
            </div>

          </div>
        )}

      </div>

      {showQuitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>End Game</h2>
            <p>Are you sure you want to quit? Your progress will be end here.</p>

            <div className="checkbox-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={postAsComment}
                  onChange={(e) => setPostAsComment(e.target.checked)}
                />
                Post result as comment
              </label>
            </div>

            <div className="modal-buttons">
              <button
                className="modal-button cancel"
                onClick={cancelQuit}
              >
                Cancel
              </button>
              <button
                className="modal-button confirm"
                onClick={confirmQuit}
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
