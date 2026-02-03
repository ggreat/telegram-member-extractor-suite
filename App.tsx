
import React, { useState, useCallback, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AppConfig, ViewMode, TerminalLine } from './types';
import { generatePythonScript } from './services/pythonTemplate';
import Terminal from './components/Terminal';

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>({
    apiId: '',
    apiHash: '',
    phoneNumber: '',
    targetGroup: ''
  });
  const [view, setView] = useState<ViewMode>(ViewMode.CONFIG);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { text: 'Telegram Extractor v2.0.0 (Production Build) initialized.', type: 'info' },
    { text: 'Waiting for secure configuration...', type: 'warning' }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const isConfigComplete = useMemo(() => {
    return config.apiId.trim() !== '' && 
           config.apiHash.trim() !== '' && 
           config.phoneNumber.trim() !== '' && 
           config.targetGroup.trim() !== '';
  }, [config]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (newView: ViewMode) => {
    if (!isConfigComplete && newView !== ViewMode.CONFIG) {
      setShowErrors(true);
      return;
    }
    setView(newView);
  };

  const simulateExtraction = useCallback(() => {
    if (!isConfigComplete) {
      setShowErrors(true);
      return;
    }
    if (isSimulating) return;
    
    setIsSimulating(true);
    setView(ViewMode.SIMULATOR);
    setTerminalLines([{ text: 'Connecting to Telegram API via secure bridge...', type: 'info' }]);
    
    const steps: TerminalLine[] = [
      { text: `[*] python3 extractor.py --id ${config.apiId} --hash ***`, type: 'input' },
      { text: '==================================================', type: 'info' },
      { text: '      TELEGRAM MEMBER EXTRACTOR PRO             ', type: 'info' },
      { text: '==================================================', type: 'info' },
      { text: `[+] Attempting login for ${config.phoneNumber}...`, type: 'info' },
      { text: '[SUCCESS] Session authenticated via cloud token.', type: 'success' },
      { text: `[*] Target found: ${config.targetGroup}`, type: 'info' },
      { text: '[*] Scanning group metadata...', type: 'info' },
      { text: '    -> Extracted 150 members...', type: 'info' },
      { text: '    -> Extracted 300 members...', type: 'info' },
      { text: '    -> Extracted 524 members...', type: 'info' },
      { text: '[+] 524 members cached successfully.', type: 'success' },
      { text: '[*] Generating export packages...', type: 'info' },
      { text: `[+] Created: exports/${config.targetGroup.replace('@', '')}_members.csv`, type: 'success' },
      { text: `[+] Created: exports/${config.targetGroup.replace('@', '')}_contacts.vcf`, type: 'success' },
      { text: '[*] Task completed successfully.', type: 'success' }
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setTerminalLines(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 450);
  }, [config, isSimulating, isConfigComplete]);

  const askAi = async () => {
    if (!isConfigComplete) {
      setShowErrors(true);
      return;
    }
    setIsAiLoading(true);
    setAiResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a high-level Python security expert. 
        Targeting Group: ${config.targetGroup}
        User is using Telethon to extract members.
        
        Provide:
        1. A brief risk assessment for scraping this specific group type.
        2. Exactly 3 technical strategies to prevent account bans (e.g., proxies, delays).
        3. How to handle the case where members have private settings.`,
        config: {
          systemInstruction: "Be extremely technical, professional, and concise. Format using Markdown headers."
        }
      });
      setAiResponse(response.text || 'No response available.');
    } catch (err) {
      setAiResponse('AI processing failed. Please verify API availability.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const downloadScript = () => {
    if (!isConfigComplete) {
      setShowErrors(true);
      return;
    }
    const script = generatePythonScript(config);
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extractor_${config.targetGroup.replace('@', '')}.py`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Script copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto selection:bg-sky-500/30">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(2,132,199,0.4)]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent uppercase">
              Telegram Extractor <span className="text-sky-500">Pro</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-semibold ml-1 tracking-wide">Enterprise Automation Suite</p>
        </div>
        
        <nav className="flex bg-slate-900 border-2 border-slate-800 rounded-2xl p-1 shadow-2xl">
          {[
            { id: ViewMode.CONFIG, label: 'Configuration', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
            { id: ViewMode.SCRIPT, label: 'Export Code', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: ViewMode.SIMULATOR, label: 'Live Console', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: ViewMode.AI_HELPER, label: 'AI Safety', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as ViewMode)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all duration-300 ${
                view === tab.id 
                  ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)] scale-105 z-10' 
                  : `text-slate-400 hover:text-slate-100 ${!isConfigComplete && tab.id !== ViewMode.CONFIG ? 'cursor-not-allowed opacity-30 grayscale' : 'hover:bg-slate-800'}`
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon}></path></svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar - High Contrast Form */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 rounded-[2.5rem] p-10 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 blur-3xl rounded-full -mr-24 -mt-24"></div>
            
            <h2 className="text-2xl font-black mb-10 flex items-center gap-4 text-white uppercase tracking-tight">
              Parameters
              {isConfigComplete && <span className="text-[10px] bg-emerald-500 text-white px-3 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]">READY</span>}
            </h2>
            
            <div className="space-y-8">
              {[
                { label: 'API ID', name: 'apiId', type: 'text', placeholder: '1234567' },
                { label: 'API Hash', name: 'apiHash', type: 'password', placeholder: '••••••••••••••••' },
                { label: 'Login Phone', name: 'phoneNumber', type: 'text', placeholder: '+1 000 000 0000' },
                { label: 'Target Handle', name: 'targetGroup', type: 'text', placeholder: '@username' }
              ].map(field => (
                <div key={field.name} className="group">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2 group-focus-within:text-sky-400 transition-colors">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={(config as any)[field.name]}
                    onChange={handleConfigChange}
                    placeholder={field.placeholder}
                    className={`w-full bg-slate-950 border-2 ${showErrors && !(config as any)[field.name] ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-800 font-mono font-bold`}
                  />
                </div>
              ))}
              
              <div className="pt-8">
                <button
                  onClick={isConfigComplete ? simulateExtraction : () => setShowErrors(true)}
                  className={`w-full py-5 rounded-2xl font-black transition-all shadow-2xl active:scale-[0.95] flex items-center justify-center gap-4 uppercase tracking-widest text-base ${
                    isConfigComplete 
                      ? 'bg-gradient-to-br from-sky-400 via-sky-600 to-blue-700 text-white shadow-sky-500/40 border-b-4 border-blue-900 active:border-b-0' 
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed border-b-4 border-slate-900'
                  }`}
                >
                  {isSimulating ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Executing...
                    </div>
                  ) : (
                    <>
                      Run Task
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-[2rem] p-6">
             <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h4 className="text-sm font-black uppercase text-amber-500 tracking-tighter">Usage Protocol</h4>
             </div>
             <p className="text-xs text-amber-200/50 leading-relaxed font-bold">
               Professional use only. Ensure all extraction tasks comply with Telegram's automated harvesting policies.
             </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 h-full min-h-[750px]">
          {!isConfigComplete && view === ViewMode.CONFIG ? (
            <div className="bg-slate-900/50 rounded-[3rem] border-4 border-dashed border-slate-800 h-full flex flex-col items-center justify-center text-center p-16 group transition-all duration-1000">
              <div className="relative mb-12 transform group-hover:scale-110 transition-transform duration-500">
                <div className="absolute inset-0 bg-sky-500 blur-[80px] opacity-20 animate-pulse"></div>
                <div className="relative w-36 h-36 bg-slate-950 rounded-[3rem] flex items-center justify-center border-4 border-slate-800 shadow-2xl">
                   <svg className="w-16 h-16 text-slate-700 group-hover:text-sky-400 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2h8z"></path></svg>
                </div>
              </div>
              <h3 className="text-4xl font-black text-white mb-6 tracking-tight uppercase">System Locked</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-12 font-bold text-lg leading-tight">
                Fill the configuration form to authorize extraction tools and script generation.
              </p>
              
              <div className="flex gap-12 w-full max-w-md border-t-2 border-slate-800/50 pt-12">
                 {[
                   { label: 'Security', val: 'E2EE' },
                   { label: 'Status', val: 'WAIT' },
                   { label: 'Engine', val: 'P-20' }
                 ].map(stat => (
                   <div key={stat.label} className="flex-1">
                      <div className="text-[10px] font-black text-slate-600 mb-2 tracking-[0.2em] uppercase">{stat.label}</div>
                      <div className="text-sm font-black text-slate-400">{stat.val}</div>
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
              
              {view === ViewMode.SCRIPT && (
                <div className="flex flex-col h-full bg-slate-950 border-2 border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-10 py-8 bg-slate-900/90 border-b-2 border-slate-800 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black text-white bg-sky-600 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(2,132,199,0.5)] uppercase tracking-[0.2em]">Build Final</span>
                       <span className="text-sm font-mono text-slate-400 font-black">extractor.py</span>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => copyToClipboard(generatePythonScript(config))}
                        className="flex items-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-black transition-all border-2 border-slate-700 text-slate-200 active:scale-95"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        Copy to Clipboard
                      </button>
                      <button 
                        onClick={downloadScript}
                        className="flex items-center gap-3 px-8 py-4 bg-sky-500 hover:bg-sky-400 rounded-2xl text-xs font-black transition-all shadow-[0_10px_25px_rgba(14,165,233,0.3)] text-white uppercase tracking-widest active:scale-95 active:shadow-none"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download Script
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-black p-12 font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <pre className="text-sky-100/70">
                      <code>{generatePythonScript(config)}</code>
                    </pre>
                  </div>
                </div>
              )}

              {view === ViewMode.SIMULATOR && (
                <div className="h-full flex flex-col gap-8">
                  <Terminal lines={terminalLines} />
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-800 flex justify-between items-center shadow-2xl">
                     <div className="flex items-center gap-6">
                        <div className={`w-4 h-4 rounded-full ${isSimulating ? 'bg-sky-500 animate-ping' : 'bg-slate-800 shadow-inner'}`}></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-1">Execution Status</span>
                          <span className={`text-lg font-black tracking-tight ${isSimulating ? 'text-sky-400' : 'text-slate-400'}`}>
                            {isSimulating ? 'SYSTEM RUNNING' : 'SYSTEM READY'}
                          </span>
                        </div>
                     </div>
                     <button 
                      onClick={() => setTerminalLines([{ text: 'Session history purged.', type: 'info' }])}
                      className="text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-[0.2em] border-2 border-slate-800 px-6 py-3 rounded-xl hover:bg-slate-800 active:scale-95"
                     >
                       Purge Console
                     </button>
                  </div>
                </div>
              )}

              {view === ViewMode.AI_HELPER && (
                <div className="h-full flex flex-col gap-10">
                  <section className="bg-indigo-950/20 border-2 border-indigo-500/30 rounded-[3rem] p-16 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative w-24 h-24 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center mb-10 border-2 border-indigo-500/30 shadow-inner group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <h3 className="text-4xl font-black mb-4 text-white uppercase tracking-tight">Security Audit</h3>
                    <p className="text-slate-400 mb-12 max-w-sm font-bold text-lg leading-snug">Get AI-driven insights on safety protocols and rate limit evasion.</p>
                    <button
                      onClick={askAi}
                      disabled={isAiLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 px-16 py-5 rounded-[2rem] font-black transition-all shadow-[0_15px_35px_rgba(79,70,229,0.4)] active:scale-95 flex items-center gap-4 text-white uppercase tracking-[0.1em] text-sm active:shadow-none"
                    >
                      {isAiLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing Audit...
                        </div>
                      ) : 'Consult AI Advisor'}
                    </button>
                  </section>

                  {aiResponse && (
                    <div className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-[3rem] p-12 text-slate-300 leading-relaxed overflow-auto scrollbar-thin scrollbar-thumb-slate-800 animate-in slide-in-from-right-10 duration-700 shadow-inner">
                      <div className="flex items-center justify-between mb-10 border-b-2 border-slate-900 pb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse"></div>
                          <h4 className="text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px]">Strategic Report v1.0</h4>
                        </div>
                        <span className="text-xs font-mono text-slate-700 font-black">REF: AI-AUDIT-PRIME</span>
                      </div>
                      <div className="prose prose-invert max-w-none whitespace-pre-wrap font-sans text-lg text-slate-400 font-medium">
                        {aiResponse}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer - High Visibility Links */}
      <footer className="mt-20 py-12 border-t-2 border-slate-900 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border-2 border-slate-800 shadow-xl">
              <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
           </div>
           <div>
             <span className="text-sm font-black tracking-[0.2em] text-white uppercase block mb-1">Extractor Pro</span>
             <span className="text-xs text-slate-600 font-black uppercase tracking-widest">Version 2.0.0 Alpha</span>
           </div>
        </div>
        <div className="flex gap-16 text-[10px] uppercase font-black tracking-[0.3em] text-slate-500">
          <a href="#" className="hover:text-sky-400 transition-all hover:scale-110">API Docs</a>
          <a href="#" className="hover:text-sky-400 transition-all hover:scale-110">Safety</a>
          <a href="#" className="hover:text-sky-400 transition-all hover:scale-110">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
