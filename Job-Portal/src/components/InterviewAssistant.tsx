import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { API } from '../lib/apiClient';
import { Mic, Loader2, PlayCircle, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, MicOff } from 'lucide-react';

export default function InterviewAssistant() {
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleLevel, setRoleLevel] = useState('Mid-Level');
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  
  const [evaluation, setEvaluation] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setUserAnswer(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch(e) {
          console.error(e);
        }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const generateQuestions = async () => {
    if (!jobDescription.trim() || !companyName.trim()) {
      setError('Company Name and Job Description are required.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setQuestions([]);
    setActiveQuestionIdx(null);
    setEvaluation(null);
    setUserAnswer('');
    
    try {
      const result = await API.generateInterviewQuestions({ jobDescription: jobDescription, companyName: companyName, roleLevel: roleLevel });
      if (result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
        setActiveQuestionIdx(0);
      } else {
        throw new Error("No questions generated.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate interview questions');
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!userAnswer.trim() || activeQuestionIdx === null) return;
    
    setIsEvaluating(true);
    setError('');
    setEvaluation(null);
    
    try {
      const activeQ = questions[activeQuestionIdx].question;
      const result = await API.evaluateInterviewAnswer({ question: activeQ, answer: userAnswer, jobDescription: jobDescription });
      setEvaluation(result);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (activeQuestionIdx !== null && activeQuestionIdx < questions.length - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
      setUserAnswer('');
      setEvaluation(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mic className="w-6 h-6 text-purple-500" />
              AI Interview Assistant
            </h2>
            <p className="text-sm text-slate-500 mt-1">Practice mock interviews and get instant AI feedback on your answers.</p>
          </div>
        </div>

        {!questions.length ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role Level</label>
                <select
                  value={roleLevel}
                  onChange={(e) => setRoleLevel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option>Entry-Level</option>
                  <option>Mid-Level</option>
                  <option>Senior</option>
                  <option>Lead / Manager</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={generateQuestions}
              disabled={isLoading || !companyName.trim() || !jobDescription.trim()}
              className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-purple-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {isLoading ? 'Analyzing role to generate questions...' : 'Start Mock Interview'}
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
            
            {/* Header showing progress */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Question {activeQuestionIdx! + 1} of {questions.length}
              </h3>
              <button onClick={() => setQuestions([])} className="text-xs text-slate-400 hover:text-rose-500 font-medium">End Interview</button>
            </div>

            {/* Active Question */}
            <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/30">
              <div className="inline-block px-2 py-1 bg-purple-200/50 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded mb-3 uppercase">
                {questions[activeQuestionIdx!].type}
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {questions[activeQuestionIdx!].question}
              </h2>
              <div className="mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-800/50">
                <p className="text-xs text-purple-700/70 dark:text-purple-300/70 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 
                  <span className="font-bold">Hint:</span> {questions[activeQuestionIdx!].hint}
                </p>
              </div>
            </div>

            {/* Answer Input Area */}
            {!evaluation ? (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your response here using the STAR method (Situation, Task, Action, Result), or click the microphone to speak..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm h-48 focus:ring-2 focus:ring-purple-500 outline-none resize-none pb-12"
                  />
                  <button
                    onClick={toggleRecording}
                    className={`absolute bottom-4 right-4 p-2 rounded-full shadow-md transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                    title={isRecording ? "Stop recording" : "Start recording"}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={evaluateAnswer}
                  disabled={isEvaluating || !userAnswer.trim()}
                  className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  {isEvaluating ? 'Evaluating your response...' : 'Submit Answer for Feedback'}
                </button>
              </div>
            ) : (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6">
                
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black ${evaluation.score >= 80 ? 'bg-emerald-100 text-emerald-600' : evaluation.score >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                    {evaluation.score}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Answer Score</h3>
                    <p className="text-xs text-slate-500">Based on industry standards for this role level.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-emerald-600 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Feedback</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{evaluation.feedback}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-amber-600 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Areas to Improve</h4>
                    <ul className="space-y-1">
                      {evaluation.improvementTips.map((tip: string, i: number) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="text-amber-500 font-bold">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-blue-600 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Ideal Answer Structure</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{evaluation.modelAnswer}</p>
                  </div>
                </div>

                {activeQuestionIdx !== null && activeQuestionIdx < questions.length - 1 ? (
                  <button onClick={nextQuestion} className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-purple-500 flex items-center justify-center gap-2">
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold">
                    Interview Complete! Review your feedback above.
                  </div>
                )}
              </motion.div>
            )}

          </motion.div>
        )}
      </div>
    </div>
  );
}
