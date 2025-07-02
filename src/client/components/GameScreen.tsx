import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Deck, 
  PlayerSession, 
  QuestionStats, 
  SubmitAnswerResponse,
  Question,
} from '../../shared/types/redditTypes';

interface GameScreenProps {
  deck: Deck;
  playerSession: PlayerSession;
  onSubmitAnswer: (answer: string | string[], timeRemaining: number) => Promise<SubmitAnswerResponse | undefined>;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  deck,
  playerSession,
  onSubmitAnswer,

}) => {
  
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [lastScore, setLastScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentQuestion = deck.questions[playerSession.currentQuestionIndex];
  const isLastQuestion = playerSession.currentQuestionIndex >= deck.questions.length - 1;
  const ANSWER_DISPLAY_MS = 3500;
  const [sequenceOrder, setSequenceOrder] = useState<Record<string, number>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [answeredQuestion, setAnsweredQuestion] = useState<Question | null>(null);
  const [answeredQuestionIndex, setAnsweredQuestionIndex] = useState(-1);
  const [displayedTotalScore, setDisplayedTotalScore] = useState(playerSession.totalScore);
  const [countdownProgress, setCountdownProgress] = useState(0);

  const total = deck.questions.length;
  const [progressOnResult, setProgressOnResult] = useState(0);
  const TIMER_STORAGE_KEY = `debateTimer_${deck.id}_${playerSession.currentQuestionIndex}`;

  const getCurrentQuestionStats = (): QuestionStats | null => {
    if (!currentQuestion || !deck.questionStats) return null;
    return deck.questionStats.find(stats => stats.questionId === currentQuestion.id) || null;
  };

  // Sequence selection handler - tracks order
  const handleSequenceSelect = (cardId: string) => {
    if (showResults || isSubmitting) return;
    
    // If card already selected, remove it
    if (sequenceOrder[cardId]) {
      const newOrder = {...sequenceOrder};
      delete newOrder[cardId];
      
      // Reorder remaining cards
      const ordered = Object.entries(newOrder)
        .sort((a, b) => a[1] - b[1])
        .map(([id], i) => [id, i + 1]);
      
      setSequenceOrder(Object.fromEntries(ordered));
      return;
    }
    
    // Add new card to sequence
    const currentIndex = Object.keys(sequenceOrder).length + 1;
    setSequenceOrder(prev => ({
      ...prev,
      [cardId]: currentIndex
    }));
  };

  // Submit sequence answer
  const submitSequence = () => {
    // Convert order mapping to sorted array
    const sequence = Object.entries(sequenceOrder)
      .sort((a, b) => a[1] - b[1])
      .map(([cardId]) => cardId);
    
    handleSubmitAnswer(sequence, timeRemaining);
  };

  // Submit handler
  const handleSubmitAnswer = useCallback(async (answer: string | string[], timeLeft: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const justAnsweredIndex = playerSession.currentQuestionIndex;
    const newProgress = ((justAnsweredIndex + 1) / total) * 100;
    setProgressOnResult(newProgress);
    const result = await onSubmitAnswer(answer, timeLeft);

    localStorage.removeItem(TIMER_STORAGE_KEY);
    
    if (result?.status === "success") {
      if (currentQuestion) {
        setAnsweredQuestion(currentQuestion);
      }
      setAnsweredQuestionIndex(playerSession.currentQuestionIndex);
      setLastScore(result.score);
      setShowResults(true);

      // Reset sequence for next question
      if (currentQuestion?.questionType === 'sequence') {
        setSequenceOrder({});
      }
      
      setTimeout(() => {
        if (!result.isGameComplete) {
          setShowResults(false);
          setSelectedCardId(null);
          setIsSubmitting(false);
        }
      }, ANSWER_DISPLAY_MS);
    } else {
      setIsSubmitting(false);
    }
  }, [onSubmitAnswer, isSubmitting, currentQuestion, playerSession]);

  // Handle card select based on question type
  const handleCardSelect = (cardId: string) => {
    if (showResults || isSubmitting || !currentQuestion) return;
    
    if (currentQuestion.questionType === 'sequence') {
      handleSequenceSelect(cardId);
    } else {
      setSelectedCardId(cardId);
      handleSubmitAnswer(cardId, timeRemaining);
    }
  };

  const getCardPercentage = (cardId: string): number => {
    const stats = getCurrentQuestionStats();
    if (!stats || stats.totalResponses === 0) return 0;
    const count = stats.cardStats[cardId] || 0;
    return Math.round((count / stats.totalResponses) * 100);
  };

  const getScoringModeIcon = () => {
    switch (playerSession.scoringMode) {
      case 'contrarian': return '🎭';
      case 'conformist': return '👥';
      case 'trivia': return '🧠';
      default: return '🎯';
    }
  };

  const displayQuestion = showResults ? answeredQuestion : currentQuestion;
  const displayQuestionIndex = showResults ? answeredQuestionIndex : playerSession.currentQuestionIndex;

  const getProgressPercentage = () => {
    if (showResults) {
      return progressOnResult;
    }
    return (playerSession.currentQuestionIndex / total) * 100;
  };

  const progressPercentage = getProgressPercentage();
  
  // Timer effect
  useEffect(() => {
    if (showResults || !currentQuestion) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimeRemaining(currentQuestion.timeLimit);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          // Auto-submit if time runs out
          if (currentQuestion.questionType === 'sequence' && Object.keys(sequenceOrder).length > 0) {
            submitSequence();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        localStorage.setItem(TIMER_STORAGE_KEY, timeRemaining.toString());
      }
    };
  }, [currentQuestion, showResults]);

  // Animate score increase
  useEffect(() => {
    if (showResults) {
      const targetScore = playerSession.totalScore;
      const startScore = targetScore - lastScore;
      const duration = 750;
      const startTime = Date.now();
      
      const animateScore = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentScore = Math.floor(startScore + lastScore * progress);
        setDisplayedTotalScore(currentScore);
        
        if (progress < 1) {
          requestAnimationFrame(animateScore);
        }
      };
      
      requestAnimationFrame(animateScore);
    } else {
      setDisplayedTotalScore(playerSession.totalScore);
    }
  }, [playerSession.totalScore, showResults, lastScore]);

  // Countdown progress during answer display
  useEffect(() => {
    if (showResults && !isLastQuestion) {
      setCountdownProgress(0);
      const startTime = Date.now();
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / ANSWER_DISPLAY_MS, 1);
        setCountdownProgress(progress * 100);
        
        if (progress >= 1) {
          clearInterval(interval);
        }
      }, 50);
      
      return () => {
        clearInterval(interval);
        setCountdownProgress(0);
      };
    }
  }, [showResults, isLastQuestion]);

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-[clamp(.5rem,2vw,1rem)] py-[clamp(.25rem,1vw,.75rem)]">
        <div className="text-white">
          <div className="flex items-center space-x-[clamp(.25rem,1vw,.5rem)]">
            <span className="text-[clamp(1rem,3vw,1.5rem)]">{getScoringModeIcon()}</span>
            <span className="font-semibold capitalize text-[clamp(.75rem,2vw,1rem)]">
              {playerSession.scoringMode}
            </span>
          </div>
          <div className="text-[clamp(.5rem,1.5vw,.75rem)] opacity-75 mt-[clamp(.25rem,1vw,.5rem)]">
            Q{displayQuestionIndex + 1}/{deck.questions.length}
          </div>
        </div>
        <div className="text-white text-right">
          <div className="font-bold text-[clamp(1.25rem,4vw,2rem)]">{displayedTotalScore}</div>
          <div className="text-[clamp(.5rem,1.5vw,.75rem)] opacity-75">Total Score</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/20 h-[clamp(.25rem,.5vw,.5rem)] mb-[clamp(.5rem,1vw,1rem)]">
        <div
          className="bg-gradient-to-r from-pink-500 to-purple-600 h-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Timer */}
      {!showResults && (
        <div className="flex justify-center mb-[clamp(.5rem,1vw,1rem)]">
          <div
            className="flex items-center justify-center"
            style={{
              width: 'clamp(2rem,8vw,4rem)',
              height: 'clamp(2rem,8vw,4rem)'
            }}
          >
            <span
              className="font-bold text-[clamp(1rem,4vw,2rem)]"
              style={{ color: timeRemaining <= 5 ? '#f87171' : '#fff' }}
            >
              {timeRemaining}
            </span>
          </div>
        </div>
      )}

      {/* Question Area */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-[clamp(.5rem,2vw,1rem)] mx-[clamp(.5rem,2vw,1rem)] mb-[clamp(.5rem,1vw,1rem)]">
        <h2 className="text-white font-bold text-center text-[clamp(1rem,4vw,2rem)] leading-tight">
          {displayQuestion?.prompt}
        </h2>
        {displayQuestion?.authorUsername && (
          <p className="text-blue-200 text-[clamp(.5rem,1.5vw,.75rem)] text-center mt-[clamp(.25rem,1vw,.5rem)]">
            by u/{displayQuestion?.authorUsername}
          </p>
        )}
      </div>

      {/* Results Display */}
      {showResults && (
        <div className="relative bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg
                        p-[clamp(.5rem,2vw,1rem)] mx-[clamp(.5rem,2vw,1rem)] mb-[clamp(.5rem,1vw,1rem)]">
          <div className="text-center">
            <div className="font-bold text-[clamp(1.5rem,5vw,3rem)] text-white mb-[clamp(.25rem,1vw,.5rem)]">
              +{lastScore}
            </div>
            <div className="text-[clamp(.75rem,2vw,1.25rem)] text-green-200">
              {isLastQuestion ? 'Final Question Complete!' : 'Next question...'}
            </div>
            
            {!isLastQuestion && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent rounded-b-lg overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-100"
                  style={{ width: `${countdownProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Answer Cards */}
      <div
        className="
          flex-grow overflow-y-auto pb-[clamp(.5rem,1vw,1rem)]
          px-[clamp(.5rem,2vw,1rem)]
        "
      >
        {displayQuestion?.questionType === 'sequence' ? (
          // Sequence question UI
          <div className="flex flex-col gap-4">
            {/* Selected sequence with order indicators */}
            <div className="min-h-[60px] bg-white/10 border border-white/20 rounded-lg p-3">
              <h3 className="text-blue-200 text-center mb-2">Your Sequence:</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.entries(sequenceOrder)
                  .sort((a, b) => a[1] - b[1])
                  .map(([cardId, order]) => {
                    const card = displayQuestion?.cards.find(c => c.id === cardId);
                    return card ? (
                      <div 
                        key={cardId}
                        className="flex items-center bg-purple-600/50 border border-purple-400 rounded-full px-3 py-1"
                      >
                        <span className="text-white mr-2 font-bold">{order}.</span>
                        <span className="text-white">{card.text}</span>
                        <button 
                          onClick={() => handleSequenceSelect(cardId)}
                          className="ml-2 text-red-300 hover:text-red-100"
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}
              </div>
            </div>

            {/* Available cards with order indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(.25rem,1vw,.5rem)]">
              {displayQuestion.cards.map(card => {
                const order = sequenceOrder[card.id];
                return (
                  <button
                    key={card.id}
                    onClick={() => handleSequenceSelect(card.id)}
                    disabled={showResults || isSubmitting}
                    className={`
                      relative flex items-center justify-center w-full
                      min-h-[clamp(5rem,12vw,7rem)]
                      p-[clamp(1rem,2.5vw,2.2rem)]
                      rounded-xl border-2 overflow-hidden transition-all
                      border-white/50 bg-white/10 hover:bg-white/20 active:scale-[0.98]
                      disabled:opacity-50
                      ${sequenceOrder[card.id] ? 'border-purple-400 bg-purple-500/20' : ''}
                    `}
                  >
                    {order && (
                      <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-purple-500 rounded-full text-white font-bold">
                        {order}
                      </div>
                    )}
                    <span
                      className="relative flex-1 font-semibold text-center
                                 text-[clamp(1.25rem,3vw,1.75rem)] text-white"
                    >
                      {card.text}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Submit button for sequence */}
            {Object.keys(sequenceOrder).length > 0 && !showResults && (
              <div className="mt-2 flex justify-center">
                <button
                  onClick={submitSequence}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                  Submit Sequence
                </button>
              </div>
            )}
          </div>
        ) : (
          // Multiple choice UI (unchanged)
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(.25rem,1vw,.5rem)]">
            {displayQuestion?.cards.map((card) => {
              const isSelected = selectedCardId === card.id;
              const pct = showResults ? getCardPercentage(card.id) : 0;

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardSelect(card.id)}
                  disabled={showResults || isSubmitting}
                  className={`
                    relative flex items-center justify-between w-full
                    min-h-[clamp(3rem,10vw,5rem)]
                    p-[clamp(.5rem,1.5vw,1rem)]
                    rounded-xl border-2 overflow-hidden transition-all
                    ${isSelected && showResults
                      ? 'border-yellow-400 bg-yellow-500/20'
                      : isSelected
                        ? 'border-white bg-white/20'
                        : showResults
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/50 bg-white/10 hover:bg-white/20 active:scale-[0.98]'}
                  `}
                >
                  {showResults && (
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  )}

                  <span
                    className="relative flex-1 font-semibold text-left
                               text-[clamp(1rem,2.5vw,1.25rem)] text-white"
                  >
                    {card.text}
                  </span>

                  {showResults && (
                    <div className="relative flex items-center space-x-[clamp(.25rem,1vw,.5rem)]">
                      <span className="font-bold text-[clamp(1rem,3vw,1.5rem)] text-white">
                        {pct}%
                      </span>
                      {isSelected && (
                        <span className="text-[clamp(1.5rem,4vw,2rem)] text-yellow-400">✓</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Status */}
      <div className="text-center p-[clamp(.25rem,1vw,.5rem)] bg-white/5">
        <p className="text-[clamp(.5rem,1.5vw,.75rem)] text-blue-200">
          {getCurrentQuestionStats() && getCurrentQuestionStats()!.totalResponses > 0
            ? `${getCurrentQuestionStats()!.totalResponses} players have answered`
            : 'Be the first to answer!'}
        </p>
      </div>
    </div>
  );
};