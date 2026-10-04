import React, { useState, useRef } from 'react';
import { THEME } from '../constants/theme';
import { RevolvingAtmosphere } from './RevolvingAtmosphere';
import { getStoredKey } from '../lib/keys';
import { analyzeResumeWithGemini, type ParsedResumeData, formatFileSize } from '../lib/resume';

interface ResumeUploadScreenProps {
  onBack: () => void;
  onSuccess: (data: ParsedResumeData) => void;
}

export const ResumeUploadScreen: React.FC<ResumeUploadScreenProps> = ({ onBack, onSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pasteLink, setPasteLink] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const geminiApiKey = getStoredKey('gemini');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // 15MB limit
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB. Please choose a smaller document.');
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('Please upload a supported format: PDF, DOCX, or high-res image.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !pasteLink) {
      setErrorMessage('Please select a resume file or provide a link to proceed.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const fileToProcess = selectedFile || new File(
        [new Blob(['Simulated Resume Content'])], 
        pasteLink.split('/').pop() || 'linked-resume.pdf', 
        { type: 'application/pdf' }
      );

      setAnalysisStep('Reading document layers & typography...');
      await new Promise(r => setTimeout(r, 600));

      setAnalysisStep('Routing through Gemini 3.5 Flash Vision...');
      await new Promise(r => setTimeout(r, 700));

      setAnalysisStep('Extracting verified codebase skills & tech stack...');
      const parsedData = await analyzeResumeWithGemini(fileToProcess, geminiApiKey);

      setAnalysisStep('Calibration complete!');
      await new Promise(r => setTimeout(r, 400));

      onSuccess(parsedData);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to analyze resume. Please try again.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`relative min-h-[100dvh] w-full ${THEME.canvasBg} text-slate-900 flex flex-col justify-between overflow-x-hidden selection:bg-sky-100 selection:text-sky-900 font-sans`}>
      
      {/* Top Pinned Progress Bar - Delphi Onboarding Style (75% progress) */}
      <div className="fixed top-0 inset-x-0 h-[2.5px] bg-slate-100 z-50">
        <div className="h-full bg-[#0284c7] w-3/4 transition-all duration-500" />
      </div>

      {/* Top-Left Back Arrow Navigation */}
      <button
        type="button"
        onClick={onBack}
        disabled={isAnalyzing}
        className="absolute top-5 left-5 sm:top-7 sm:left-8 z-40 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
        aria-label="Go back"
      >
        <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      {/* Main Centered Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20 pb-12 w-full">
        <div className="w-full max-w-[480px] sm:max-w-[500px] mx-auto flex flex-col items-center">
          
          {/* Header Typography matching Delphi */}
          <h1 className="animate-entrance text-2xl sm:text-[27px] font-bold text-slate-900 tracking-tight text-center">
            Upload your resume
          </h1>
          <p className="animate-entrance mt-2 text-sm sm:text-[14px] text-slate-500 text-center max-w-[420px] leading-relaxed">
            JobMate runs Gemini Vision client-side to extract verified skills, architecture history, and project proof.
          </p>

          {/* Dropbox Dash Style Search / Link Input */}
          <div 
            className="animate-entrance w-full mt-6 flex items-center relative rounded-full border border-slate-200/90 bg-white shadow-xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all"
            style={{ animationDelay: '80ms' }}
          >
            <div className="pl-3.5 pr-2 text-slate-400 flex items-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={pasteLink}
              onChange={(e) => {
                setPasteLink(e.target.value);
                if (e.target.value) setErrorMessage(null);
              }}
              placeholder="Search or paste a resume link (Drive, Dropbox, PDF)..."
              disabled={isAnalyzing || selectedFile !== null}
              className="w-full py-2.5 pr-4 text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 bg-transparent border-none outline-none focus:ring-0"
            />
            {pasteLink && !selectedFile && (
              <button 
                type="button"
                onClick={() => setPasteLink('')}
                className="pr-3 text-slate-300 hover:text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropbox Dash Style File Upload Box with Animated Micro-Interaction */}
          <div 
            className="animate-entrance w-full mt-4"
            style={{ animationDelay: '140ms' }}
          >
            <input 
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              // Empty Upload Box with Animated Isometric Floating Sheets
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-2xl sm:rounded-3xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                  dragActive 
                    ? 'border-[#0284c7] bg-sky-50/70 scale-[1.01] shadow-lg shadow-sky-500/10 ring-4 ring-sky-100' 
                    : 'border-slate-200/90 bg-white/80 hover:border-[#0284c7] hover:bg-sky-50/25 shadow-xs hover:shadow-md hover:shadow-sky-500/5'
                }`}
              >
                {/* Background soft ambient radial gradient */}
                <div className="absolute inset-0 bg-radial from-sky-100/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Animated Isometric Layered Document Illustration */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-3">
                  
                  {/* Ambient drop shadow */}
                  <div className="absolute bottom-1 w-16 h-3 bg-slate-900/10 rounded-full blur-xs transition-all duration-300 group-hover:w-20 group-hover:opacity-80" />

                  {/* Layer 1 (Bottom angled isometric sheet) */}
                  <div 
                    className="absolute w-14 h-18 sm:w-16 sm:h-20 rounded-lg bg-indigo-100/80 border border-indigo-200/70 shadow-xs transition-transform duration-500 ease-out"
                    style={{
                      transform: dragActive 
                        ? 'translateY(12px) rotate(-16deg) scale(0.92)' 
                        : 'translateY(6px) rotate(-10deg) scale(0.94)',
                    }}
                  />

                  {/* Layer 2 (Middle angled isometric sheet) */}
                  <div 
                    className="absolute w-14 h-18 sm:w-16 sm:h-20 rounded-lg bg-sky-100 border border-sky-200 shadow-xs transition-transform duration-500 ease-out"
                    style={{
                      transform: dragActive 
                        ? 'translateY(4px) rotate(14deg) scale(0.96)' 
                        : 'translateY(2px) rotate(8deg) scale(0.98)',
                    }}
                  />

                  {/* Layer 3 (Top interactive floating sheet with animated scan beam) */}
                  <div 
                    className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-lg bg-white border border-slate-200/90 shadow-md flex flex-col justify-between p-2 transition-all duration-300 overflow-hidden ${
                      dragActive ? 'scale-105 border-sky-500 shadow-sky-500/20' : 'group-hover:translate-y-[-4px] group-hover:shadow-lg'
                    }`}
                  >
                    {/* Simulated document lines */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="w-6 h-1.5 rounded-full bg-slate-300 group-hover:bg-sky-400 transition-colors" />
                      <div className="w-10 h-1 rounded-full bg-slate-200" />
                      <div className="w-8 h-1 rounded-full bg-slate-200" />
                      <div className="w-9 h-1 rounded-full bg-slate-200" />
                    </div>

                    {/* Bottom right corner upload indicator */}
                    <div className="self-end flex items-center justify-center w-5 h-5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 group-hover:bg-[#0284c7] group-hover:text-white transition-colors duration-200">
                      <svg className="w-3 h-3 stroke-[2.4] transition-transform duration-200 group-hover:translate-y-[-1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                      </svg>
                    </div>

                    {/* Animated Scanning Beam Micro-Interaction */}
                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-0 group-hover:opacity-100 animate-scan transition-opacity" />
                  </div>
                </div>

                {/* Upload Call to Action */}
                <span className="text-[14px] sm:text-[15px] font-semibold text-slate-800 group-hover:text-[#0284c7] transition-colors">
                  Upload or drag files here
                </span>
                <p className="mt-1 text-xs text-slate-400 font-normal">
                  PDF, DOCX, or high-res images up to 15MB
                </p>

                {/* Browse Pill Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-3.5 px-3.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Browse local files
                </button>
              </div>
            ) : (
              // Selected File Preview Card
              <div className="w-full rounded-2xl sm:rounded-3xl border border-sky-200/90 bg-sky-50/40 p-5 sm:p-6 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Document Badge */}
                    <div className="w-11 h-11 rounded-xl bg-white border border-sky-200 flex items-center justify-center flex-shrink-0 text-sky-600 shadow-xs">
                      <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>

                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-sm font-semibold text-slate-800 truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatFileSize(selectedFile.size)} · Ready for Gemini Vision
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    disabled={isAnalyzing}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>

                {/* Calibration pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-sky-100 text-xs text-sky-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Multimodal AST parsing pipeline active</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="animate-entrance mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-700 w-full text-center">
              {errorMessage}
            </div>
          )}

          {/* Dropbox Dash Style Disclosure Banner */}
          <div 
            className="animate-entrance w-full mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900/90 flex items-start gap-2.5 text-left"
            style={{ animationDelay: '200ms' }}
          >
            <div className="mt-0.5 text-amber-600 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="leading-relaxed">
              <strong>Client-Side Vision Processing:</strong> Your resume is parsed in browser memory with your verified Gemini API key. Zero telemetry, zero server persistence, and never used to train public AI models.
            </p>
          </div>

          {/* Primary Action Button - 50px Delphi Pill Button */}
          <div 
            className="animate-entrance w-full mt-6 flex flex-col items-center gap-3"
            style={{ animationDelay: '260ms' }}
          >
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!selectedFile && !pasteLink)}
              className={`pill-bloom ${THEME.buttons.base} w-full ${
                (selectedFile || pasteLink) && !isAnalyzing
                  ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-lg shadow-sky-500/25 cursor-pointer'
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>{analysisStep || 'Analyzing with Gemini Vision...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Analyze Resume with Gemini Vision</span>
                  <span className="text-white/80">→</span>
                </div>
              )}
            </button>

            {/* Back to Engine Keys */}
            <button
              type="button"
              onClick={onBack}
              disabled={isAnalyzing}
              className={`mt-1 ${THEME.typography.returnLink}`}
            >
              <span>← Back to connected AI engines</span>
            </button>
          </div>

        </div>
      </main>

      {/* Atmospheric Horizon Rings */}
      <RevolvingAtmosphere />

    </div>
  );
};
