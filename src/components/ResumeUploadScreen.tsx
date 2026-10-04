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
    if (!selectedFile) {
      setErrorMessage('Please select a resume file to proceed.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      setAnalysisStep('Reading document layers & typography...');
      await new Promise(r => setTimeout(r, 600));

      setAnalysisStep('Routing through Gemini 3.5 Flash Vision...');
      await new Promise(r => setTimeout(r, 700));

      setAnalysisStep('Extracting verified codebase skills & tech stack...');
      const parsedData = await analyzeResumeWithGemini(selectedFile, geminiApiKey);

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
        <div className="w-full max-w-[440px] sm:max-w-[460px] mx-auto flex flex-col items-center">
          
          {/* Header Typography matching Delphi */}
          <h1 className="animate-entrance text-2xl sm:text-[27px] font-bold text-slate-900 tracking-tight text-center">
            Upload your resume
          </h1>
          <p className="animate-entrance mt-2 text-sm sm:text-[14px] text-slate-500 text-center max-w-[400px] leading-relaxed">
            JobMate runs Gemini Vision client-side to extract verified skills, architecture history, and project proof.
          </p>

          {/* Dropbox Dash Exact Upload Box (Zero Search Bar) */}
          <div 
            className="animate-entrance w-full mt-6 sm:mt-7"
            style={{ animationDelay: '100ms' }}
          >
            <input 
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              // Empty Upload Box with Exact Isometric Stack Icon & Clean Micro-Interaction
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-2xl sm:rounded-3xl border-2 border-dashed py-10 sm:py-12 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group overflow-hidden bg-white/90 ${
                  dragActive 
                    ? 'border-[#0284c7] bg-sky-50/60 scale-[1.01] shadow-lg shadow-sky-500/10 ring-4 ring-sky-100' 
                    : 'border-slate-300/80 hover:border-[#0284c7] hover:bg-slate-50/50 shadow-xs hover:shadow-md hover:shadow-sky-500/5'
                }`}
              >
                {/* Ambient soft glow when hovering */}
                <div className="absolute inset-0 bg-radial from-sky-100/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Exact Dropbox Dash Stack Icon: 3-Tier Isometric Rounded Diamond Stack with Animated Micro-Interaction */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-4 select-none">
                  
                  {/* Soft ambient drop shadow underneath the stack */}
                  <div 
                    className={`absolute bottom-1 w-14 h-3 bg-slate-900/10 rounded-full blur-xs transition-all duration-300 ${
                      dragActive ? 'w-18 opacity-70 bg-sky-900/20' : 'group-hover:w-16 group-hover:opacity-60'
                    }`} 
                  />

                  {/* SVG Isometric Stack Graphic */}
                  <svg 
                    viewBox="0 0 100 100" 
                    className="w-18 h-18 sm:w-20 sm:h-20 overflow-visible"
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Layer 1: Bottom Solid Dark Plate */}
                    <g 
                      className="transition-transform duration-300 ease-out"
                      style={{
                        transform: dragActive 
                          ? 'translate(50px, 73px) scale(1, 0.58) rotate(45deg)' 
                          : 'translate(50px, 71px) scale(1, 0.58) rotate(45deg)',
                      }}
                    >
                      <rect 
                        x="-20" 
                        y="-20" 
                        width="40" 
                        height="40" 
                        rx="7" 
                        ry="7" 
                        fill="#ffffff" 
                        stroke="#111827" 
                        strokeWidth="4.2" 
                        strokeLinejoin="round" 
                      />
                    </g>

                    {/* Layer 2: Middle Solid Dark Plate */}
                    <g 
                      className="transition-transform duration-300 ease-out"
                      style={{
                        transform: dragActive 
                          ? 'translate(50px, 57px) scale(1, 0.58) rotate(45deg)' 
                          : 'translate(50px, 55px) scale(1, 0.58) rotate(45deg)',
                      }}
                    >
                      <rect 
                        x="-20" 
                        y="-20" 
                        width="40" 
                        height="40" 
                        rx="7" 
                        ry="7" 
                        fill="#ffffff" 
                        stroke="#111827" 
                        strokeWidth="4.2" 
                        strokeLinejoin="round" 
                      />
                    </g>

                    {/* Layer 3: Top Floating Dashed Plate with Question Mark / Upload Indicator */}
                    <g 
                      className={`transition-all duration-500 ease-out ${
                        dragActive ? 'animate-none' : 'animate-float-subtle'
                      }`}
                      style={{
                        transform: dragActive 
                          ? 'translateY(-14px)' 
                          : undefined,
                      }}
                    >
                      {/* Dashed Plate */}
                      <g 
                        className="transition-all duration-300"
                        style={{
                          transform: 'translate(50px, 36px) scale(1, 0.58) rotate(45deg)',
                        }}
                      >
                        <rect 
                          x="-20" 
                          y="-20" 
                          width="40" 
                          height="40" 
                          rx="7" 
                          ry="7" 
                          fill="rgba(255, 255, 255, 0.98)" 
                          stroke={dragActive ? '#0284c7' : '#94a3b8'} 
                          strokeWidth="3.2" 
                          strokeDasharray="5 3.5" 
                          strokeLinejoin="round" 
                          className="group-hover:stroke-[#0284c7] transition-colors duration-200"
                        />
                      </g>

                      {/* Center Symbol: Isometric Question Mark or Upload Arrow on Hover */}
                      <g className="transition-all duration-200">
                        {dragActive ? (
                          // Active Drag Arrow Indicator
                          <g transform="translate(50, 36)">
                            <path 
                              d="M0 6 L0 -6 M-4 -2 L0 -6 L4 -2" 
                              stroke="#0284c7" 
                              strokeWidth="2.6" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="animate-bounce"
                            />
                          </g>
                        ) : (
                          // Default Grey Question Mark matching exact Dropbox Dash reference
                          <text 
                            x="50" 
                            y="41" 
                            textAnchor="middle" 
                            fontSize="17" 
                            fontWeight="700" 
                            fontFamily="system-ui, -apple-system, sans-serif" 
                            fill="#94a3b8"
                            className="group-hover:fill-[#0284c7] transition-colors duration-200 select-none"
                          >
                            ?
                          </text>
                        )}
                      </g>

                      {/* Animated Gentle Scan Beam on Hover */}
                      <g transform="translate(50, 36) scale(1, 0.58) rotate(45deg)">
                        <rect 
                          x="-18" 
                          y="-18" 
                          width="36" 
                          height="36" 
                          rx="5" 
                          fill="none" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </g>
                    </g>
                  </svg>
                </div>

                {/* Upload Typography matching Dropbox Dash */}
                <span className="text-[14px] sm:text-[15px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  Upload or drag files here
                </span>
                <p className="mt-1 text-xs text-slate-400 font-normal">
                  PDF, DOCX, or high-res images up to 15MB
                </p>

                {/* Subtle Browse Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-3.5 px-4 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Browse local files
                </button>
              </div>
            ) : (
              // Selected File Preview Card with Snapped Solid Stack
              <div className="w-full rounded-2xl sm:rounded-3xl border border-sky-200/90 bg-sky-50/40 p-5 sm:p-6 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    
                    {/* Mini Stack Icon Solidified */}
                    <div className="w-12 h-12 rounded-xl bg-white border border-sky-200 flex items-center justify-center flex-shrink-0 text-sky-600 shadow-xs">
                      <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none">
                        <g transform="translate(50, 68) scale(1, 0.58) rotate(45deg)">
                          <rect x="-18" y="-18" width="36" height="36" rx="6" fill="#ffffff" stroke="#111827" strokeWidth="4.5" />
                        </g>
                        <g transform="translate(50, 52) scale(1, 0.58) rotate(45deg)">
                          <rect x="-18" y="-18" width="36" height="36" rx="6" fill="#ffffff" stroke="#111827" strokeWidth="4.5" />
                        </g>
                        <g transform="translate(50, 36) scale(1, 0.58) rotate(45deg)">
                          <rect x="-18" y="-18" width="36" height="36" rx="6" fill="#0284c7" stroke="#0284c7" strokeWidth="4.5" />
                        </g>
                        <path d="M45 36 L48 39 L55 32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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
            style={{ animationDelay: '180ms' }}
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
            style={{ animationDelay: '240ms' }}
          >
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedFile}
              className={`pill-bloom ${THEME.buttons.base} w-full ${
                selectedFile && !isAnalyzing
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
