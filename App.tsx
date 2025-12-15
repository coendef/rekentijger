import React, { useState, useEffect, useRef } from 'react';
import { GameState, ProblemType, MathProblem, Step } from './types';
import { generateProblem } from './services/mathService';
import { getExplanation, getEncouragement } from './services/geminiService';
import TenFrame from './components/TenFrame';
import Button from './components/Button';
import { 
  Play, 
  RotateCcw, 
  BrainCircuit, 
  ChevronRight, 
  Star,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [problemType, setProblemType] = useState<ProblemType>(ProblemType.ADDITION);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(Step.MAKE_TEN);
  const [inputValue, setInputValue] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [score, setScore] = useState(0);

  // Visual state for the 10-frames
  const [frame1Count, setFrame1Count] = useState(0);
  const [frame2Count, setFrame2Count] = useState(0);
  const [highlightCount, setHighlightCount] = useState(0);

  const startGame = (type: ProblemType) => {
    setProblemType(type);
    setScore(0);
    setGameState(GameState.PLAYING);
    nextProblem(type);
  };

  const nextProblem = (type: ProblemType) => {
    const newProblem = generateProblem(type);
    setCurrentProblem(newProblem);
    setCurrentStep(Step.MAKE_TEN);
    setInputValue('');
    setFeedback(null);
    setIsCorrect(null);
    setExplanation(null);
    
    // Initialize Visuals
    setFrame1Count(newProblem.num1);
    setFrame2Count(0);
    setHighlightCount(0);
  };

  const handleAiHelp = async () => {
    if (!currentProblem) return;
    setLoadingAi(true);
    const text = await getExplanation(currentProblem);
    setExplanation(text);
    setLoadingAi(false);
  };

  const handleSubmit = async () => {
    if (!currentProblem) return;
    
    const numInput = parseInt(inputValue);
    if (isNaN(numInput)) return;

    if (currentStep === Step.MAKE_TEN) {
      if (numInput === currentProblem.splitPart1) {
        // Correct step 1
        setFeedback("Goed zo! Nu is de eerste vol.");
        
        // Update visuals based on type
        if (problemType === ProblemType.ADDITION) {
          // Addition: Fill up the first frame to 10
          setFrame1Count(10);
          setHighlightCount(currentProblem.splitPart1); // Highlight the ones we just added
        } else {
            // Subtraction: Reduce first frame to 10
            setFrame1Count(10); 
            // We visualize taking away by removing dots, so frame1 goes from num1 to 10.
        }

        setTimeout(() => {
          setFeedback(null);
          setInputValue('');
          setCurrentStep(Step.ADD_REMAINDER);
          setHighlightCount(0);
        }, 1000);
      } else {
        setFeedback("Niet helemaal. Kijk naar de lege plekjes!");
        setIsCorrect(false);
      }
    } else if (currentStep === Step.ADD_REMAINDER) {
      if (numInput === currentProblem.splitPart2) {
        // Correct step 2
        setFeedback(problemType === ProblemType.ADDITION ? "Juist! En de rest?" : "Goed! En wat gaat er nog af?");
        
        if (problemType === ProblemType.ADDITION) {
          // Show the remainder in the second frame
          setFrame2Count(currentProblem.splitPart2);
          setHighlightCount(currentProblem.splitPart2);
        } else {
            // Subtraction: We are now at 10. We need to take away splitPart2.
            // Visually, we show 10 in frame 1, and maybe ghost out dots? 
            // For subtraction simple visualization: Just show 10, ask user to remove rest.
            // Let's update frame1 to the final answer visually for step 3
             setFrame1Count(10);
        }

        setTimeout(() => {
          setFeedback(null);
          setInputValue('');
          setCurrentStep(Step.FINAL_ANSWER);
          setHighlightCount(0);
        }, 1000);
      } else {
        setFeedback("Probeer het nog eens.");
        setIsCorrect(false);
      }
    } else if (currentStep === Step.FINAL_ANSWER) {
      if (numInput === currentProblem.answer) {
        setIsCorrect(true);
        setScore(prev => prev + 1);
        
        // Final Visual State
        if (problemType === ProblemType.SUBTRACTION) {
            setFrame1Count(currentProblem.answer);
        }

        const msg = await getEncouragement(true);
        setFeedback(msg);
      } else {
        setFeedback("Bijna! Tel de stippen nog eens.");
        setIsCorrect(false);
      }
    }
  };

  // Keyboard support for input
  const handleNumClick = (num: number) => {
    setInputValue(prev => prev + num.toString());
  };

  const handleBackspace = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  if (gameState === GameState.MENU) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-indigo-600 tracking-tight">RekenTijger 🐯</h1>
            <p className="text-slate-500 text-lg">Word kampioen in sommen over het tiental!</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              size="lg" 
              onClick={() => startGame(ProblemType.ADDITION)}
              className="w-full justify-between group"
            >
              <span>Plus Sommen (+)</span>
              <span className="bg-blue-400 text-white rounded-full w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ChevronRight size={20} />
              </span>
            </Button>
            
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => startGame(ProblemType.SUBTRACTION)}
              className="w-full justify-between group"
            >
              <span>Min Sommen (-)</span>
              <span className="bg-purple-400 text-white rounded-full w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ChevronRight size={20} />
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-slate-50 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setGameState(GameState.MENU)}
          className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500"
        >
          <RotateCcw />
        </button>
        <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full text-yellow-700 font-bold">
          <Star className="fill-yellow-500 text-yellow-500" />
          <span>{score}</span>
        </div>
      </div>

      {currentProblem && (
        <div className="flex-1 flex flex-col items-center space-y-6">
          
          {/* Visual Area */}
          <div className="w-full flex flex-col items-center gap-4 min-h-[160px]">
             <TenFrame 
                count={frame1Count} 
                highlightCount={highlightCount} // Shows distinct colors for added parts
                label={problemType === ProblemType.ADDITION ? "Eerste getal / Tiental" : "Totaal"}
             />
             {/* Only show second frame for addition contexts or if we have items there */}
             {(problemType === ProblemType.ADDITION || frame2Count > 0) && (
               <TenFrame 
                 count={frame2Count} 
                 color="bg-green-400"
                 label="Erbij"
               />
             )}
          </div>

          {/* Problem Display */}
          <div className="text-center space-y-2">
            <h2 className="text-5xl font-black text-slate-700 tracking-widest">
              {currentProblem.num1} {problemType === ProblemType.ADDITION ? '+' : '-'} {currentProblem.num2}
            </h2>
            
            {/* The Strategy Steps */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-2 text-xl text-slate-500 mb-4">
                  <span className={currentStep === Step.MAKE_TEN ? "font-bold text-blue-600 scale-110 transition-transform" : "opacity-50"}>
                    stap 1
                  </span>
                  <ChevronRight size={16} />
                  <span className={currentStep === Step.ADD_REMAINDER ? "font-bold text-blue-600 scale-110 transition-transform" : "opacity-50"}>
                    stap 2
                  </span>
                  <ChevronRight size={16} />
                  <span className={currentStep === Step.FINAL_ANSWER ? "font-bold text-blue-600 scale-110 transition-transform" : "opacity-50"}>
                    antwoord
                  </span>
                </div>

                <p className="text-lg font-medium text-slate-600 mb-4 h-8">
                  {currentStep === Step.MAKE_TEN && (
                     problemType === ProblemType.ADDITION 
                       ? `Eerst aanvullen tot 10. Hoeveel erbij?`
                       : `Eerst terug naar de 10. Hoeveel eraf?`
                  )}
                  {currentStep === Step.ADD_REMAINDER && (
                     problemType === ProblemType.ADDITION
                       ? `Goed! We hadden er ${currentProblem.num2}. Hoeveel moet je er nog bij doen?`
                       : `Goed! We moesten er ${currentProblem.num2} afhalen. Hoeveel moet er nog af?`
                  )}
                  {currentStep === Step.FINAL_ANSWER && "En hoeveel is het nu totaal?"}
                </p>

                {/* Input Area */}
                {isCorrect !== true && (
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center text-3xl font-bold text-slate-700 h-16 border-2 border-slate-200 focus-within:border-blue-400 transition-colors">
                      {inputValue}
                      <span className="animate-pulse text-slate-400">|</span>
                    </div>
                    <Button onClick={handleSubmit} variant="success" size="md">OK</Button>
                  </div>
                )}
            </div>
          </div>

          {/* Feedback Area */}
          <div className="h-16 flex items-center justify-center w-full px-4">
            {feedback && (
               <div className={`flex items-center gap-2 text-lg font-bold px-4 py-2 rounded-xl animate-bounce ${isCorrect === false ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {isCorrect === false ? <XCircle /> : <CheckCircle2 />}
                  {feedback}
               </div>
            )}
            {isCorrect === true && (
              <Button onClick={() => nextProblem(problemType)} className="animate-pulse">
                Volgende Som <ChevronRight />
              </Button>
            )}
          </div>

          {/* AI Helper */}
          <div className="w-full max-w-sm">
             {!explanation ? (
               <button 
                onClick={handleAiHelp}
                disabled={loadingAi}
                className="w-full text-indigo-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
               >
                 {loadingAi ? <span className="animate-spin"><BrainCircuit /></span> : <HelpCircle size={18} />}
                 {loadingAi ? "Ik ben aan het nadenken..." : "Ik snap het niet, leg het uit!"}
               </button>
             ) : (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-800 text-sm leading-relaxed relative">
                   <div className="absolute -top-3 left-4 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                     Meester Tijger zegt:
                   </div>
                   {explanation}
                </div>
             )}
          </div>

          {/* Numeric Keypad for Mobile/Touch */}
          {isCorrect !== true && (
            <div className="grid grid-cols-5 gap-2 w-full max-w-sm">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num)}
                  className="bg-white border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 rounded-xl py-3 text-xl font-bold text-slate-600 hover:bg-blue-50 transition-all"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={handleBackspace}
                className="col-span-2 bg-red-50 border-b-4 border-red-200 active:border-b-0 active:translate-y-1 rounded-xl py-3 font-bold text-red-500 hover:bg-red-100 transition-all"
              >
                Wissen
              </button>
              <button 
                onClick={handleSubmit}
                className="col-span-3 bg-green-500 border-b-4 border-green-700 active:border-b-0 active:translate-y-1 rounded-xl py-3 font-bold text-white hover:bg-green-600 transition-all"
              >
                OK
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default App;