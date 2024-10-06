import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { RotateCw } from 'lucide-react';

const BOARD_SIZE = 400;
const GRID_SIZE = 8;
const CELL_SIZE = BOARD_SIZE / GRID_SIZE;

const PIECES = [
  { shape: 'polygon(0% 0%, 50% 50%, 0% 100%)', color: 'red', name: 'A', vertices: [[0, 0], [0.5, 0.5], [0, 1]] },
  { shape: 'polygon(100% 0%, 100% 100%, 50% 50%)', color: 'blue', name: 'B', vertices: [[1, 0], [1, 1], [0.5, 0.5]] },
  { shape: 'polygon(50% 50%, 100% 0%, 50% 0%)', color: 'green', name: 'C', vertices: [[0.5, 0.5], [1, 0], [0.5, 0]] },
  { shape: 'polygon(0% 0%, 25% 25%, 50% 0%)', color: 'yellow', name: 'D', vertices: [[0, 0], [0.25, 0.25], [0.5, 0]] },
  { shape: 'polygon(50% 0%, 75% 25%, 100% 0%)', color: 'purple', name: 'E', vertices: [[0.5, 0], [0.75, 0.25], [1, 0]] },
  { shape: 'polygon(25% 25%, 50% 50%, 75% 25%, 50% 0%)', color: 'orange', name: 'F', vertices: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.25], [0.5, 0]] },
  { shape: 'polygon(75% 25%, 100% 50%, 100% 100%, 50% 50%)', color: 'pink', name: 'G', vertices: [[0.75, 0.25], [1, 0.5], [1, 1], [0.5, 0.5]] },
];

const TangramPiece = ({ shape, color, position, rotation, isFlipped, onMouseDown, onRotate, onFlip, gameStarted, name, isSelected, zIndex }) => {
  const style = {
    width: `${BOARD_SIZE}px`,
    height: `${BOARD_SIZE}px`,
    clipPath: shape,
    backgroundColor: color,
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1})`,
    cursor: gameStarted ? 'move' : 'default',
    touchAction: 'none',
    border: isSelected ? '3px solid white' : '1px solid black',
    boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
    transition: 'box-shadow 0.3s ease',
    zIndex: zIndex,
  };

  return (
    <div
      style={style}
      onMouseDown={gameStarted ? onMouseDown : undefined}
      onContextMenu={(e) => {
        e.preventDefault();
        if (gameStarted) onFlip();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (gameStarted) {
          if (e.key === 'r') onRotate();
          if (e.key === 'f') onFlip();
        }
      }}
      aria-label={`${color} piece ${name}`}
    />
  );
};

const TangramGame = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const [pieces, setPieces] = useState(PIECES.map((piece, index) => ({
    ...piece,
    position: { x: 0, y: 0 },
    rotation: 0,
    isFlipped: false,
    isSelected: false,
    zIndex: index,
  })));
  
  const [draggedPiece, setDraggedPiece] = useState(null);
  const boardRef = useRef(null);

  useEffect(() => {
    let timer;
    if (gameStarted && startTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, startTime]);

  const handleStart = () => {
    setGameStarted(true);
    setShowAnswer(false);
    setShowHint(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setPieces(prevPieces => prevPieces.map((piece, index) => ({
      ...piece,
      position: { 
        x: Math.floor(Math.random() * (BOARD_SIZE - CELL_SIZE)) / CELL_SIZE * CELL_SIZE,
        y: Math.floor(Math.random() * (BOARD_SIZE - CELL_SIZE)) / CELL_SIZE * CELL_SIZE
      },
      rotation: Math.floor(Math.random() * 4) * 90,
      isFlipped: Math.random() > 0.5,
      isSelected: false,
      zIndex: index,
    })));
  };

  const handleAnswer = () => {
    setShowAnswer(true);
    setGameStarted(false);
    setPieces(PIECES.map((piece, index) => ({
      ...piece,
      position: { x: 0, y: 0 },
      rotation: 0,
      isFlipped: false,
      isSelected: false,
      zIndex: index,
    })));
  };

  const handleMouseDown = useCallback((index, e) => {
    if (!gameStarted) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const startX = e.clientX - boardRect.left - pieces[index].position.x;
    const startY = e.clientY - boardRect.top - pieces[index].position.y;
    setDraggedPiece({ index, startX, startY });
    setPieces(prevPieces => {
      const newPieces = prevPieces.map((piece, i) => 
        i === index ? { ...piece, isSelected: true, zIndex: Math.max(...prevPieces.map(p => p.zIndex)) + 1 } : { ...piece, isSelected: false }
      );
      return newPieces;
    });
  }, [gameStarted, pieces]);

  const handleMouseMove = useCallback((e) => {
    if (draggedPiece !== null) {
      const { index, startX, startY } = draggedPiece;
      const boardRect = boardRef.current.getBoundingClientRect();
      setPieces(prevPieces => prevPieces.map((piece, i) => 
        i === index
          ? { ...piece, position: { 
              x: Math.round((Math.max(0, Math.min(e.clientX - boardRect.left - startX, BOARD_SIZE - CELL_SIZE))) / CELL_SIZE) * CELL_SIZE,
              y: Math.round((Math.max(0, Math.min(e.clientY - boardRect.top - startY, BOARD_SIZE - CELL_SIZE))) / CELL_SIZE) * CELL_SIZE
            }}
          : piece
      ));
    }
  }, [draggedPiece]);

  const handleMouseUp = useCallback(() => {
    if (draggedPiece !== null) {
      setDraggedPiece(null);
      checkCompletion();
    }
  }, [draggedPiece]);

  const handleRotate = useCallback((index) => {
    if (!gameStarted) return;
    setPieces(prevPieces => prevPieces.map((piece, i) => 
      i === index ? { ...piece, rotation: (piece.rotation + 90) % 360, isSelected: true, zIndex: Math.max(...prevPieces.map(p => p.zIndex)) + 1 } : { ...piece, isSelected: false }
    ));
    checkCompletion();
  }, [gameStarted]);

  const handleFlip = useCallback((index) => {
    if (!gameStarted) return;
    setPieces(prevPieces => prevPieces.map((piece, i) => 
      i === index ? { ...piece, isFlipped: !piece.isFlipped, isSelected: true, zIndex: Math.max(...prevPieces.map(p => p.zIndex)) + 1 } : { ...piece, isSelected: false }
    ));
    checkCompletion();
  }, [gameStarted]);

  const checkCompletion = () => {
    const isCompleted = pieces.every((piece) => 
      piece.position.x === 0 &&
      piece.position.y === 0 &&
      piece.rotation === 0 &&
      piece.isFlipped === false
    );

    if (isCompleted) {
      setGameStarted(false);
      const timeBonus = Math.max(0, 300 - elapsedTime);
      const newScore = score + 1000 + timeBonus;
      setScore(newScore);
      alert(`Congratulations! Your score is ${newScore}. Time: ${elapsedTime}s`);
    }
  };

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= GRID_SIZE; i++) {
      const position = i * CELL_SIZE;
      lines.push(
        <line key={`v${i}`} x1={position} y1={0} x2={position} y2={BOARD_SIZE} stroke="gray" strokeWidth="1" />,
        <line key={`h${i}`} x1={0} y1={position} x2={BOARD_SIZE} y2={position} stroke="gray" strokeWidth="1" />
      );
    }
    return lines;
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <button onClick={handleStart} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">
          Try
        </button>
        <button onClick={handleAnswer} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2">
          Answer
        </button>
        <button 
          onMouseDown={() => setShowHint(true)} 
          onMouseUp={() => setShowHint(false)}
          onMouseLeave={() => setShowHint(false)}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Hint
        </button>
      </div>
      <div className="mb-4">
        Score: {score} | Time: {elapsedTime}s
      </div>
      <div className="flex">
        <div 
          ref={boardRef}
          style={{ 
            width: `${BOARD_SIZE}px`, 
            height: `${BOARD_SIZE}px`, 
            border: '1px solid black', 
            position: 'relative',
            backgroundColor: 'white'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg 
            width={BOARD_SIZE} 
            height={BOARD_SIZE} 
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          >
            {gridLines}
          </svg>
          {showHint && (
            <div 
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'url("/path/to/hint-image.png")',
                backgroundSize: 'contain',
                opacity: 0.5,
                zIndex: 1000,
              }}
            />
          )}
          {pieces.map((piece, index) => (
            <TangramPiece
              key={index}
              {...piece}
              onMouseDown={(e) => handleMouseDown(index, e)}
              onRotate={() => handleRotate(index)}
              onFlip={() => handleFlip(index)}
              gameStarted={gameStarted}
            />
          ))}
        </div>
        <div className="ml-4">
          <button onClick={() => handleRotate(pieces.findIndex(p => p.isSelected))} className="p-2 bg-gray-200 rounded"><RotateCw /></button>
        </div>
      </div>
    </div>
  );
};

export default TangramGame;
