'use client';

import { useState, useEffect } from 'react';

interface ApiCredentials {
  clientId: string;
  clientSecret: string;
  apiKey: string;
}

export default function Settings() {
  const [credentials, setCredentials] = useState<ApiCredentials>({
    clientId: '',
    clientSecret: '',
    apiKey: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedCreds = localStorage.getItem('pisteCredentials');
    if (savedCreds) {
      setCredentials(JSON.parse(savedCreds));
    }
  }, []);

  const handleSave = () => {
    if (!credentials.clientId || !credentials.clientSecret || !credentials.apiKey) {
      setError('Tous les champs sont requis');
      return;
    }

    localStorage.setItem('pisteCredentials', JSON.stringify(credentials));
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    setCredentials({ clientId: '', clientSecret: '', apiKey: '' });
    localStorage.removeItem('pisteCredentials');
    setSaved(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="terminal-panel p-6">
        <h2 className="text-xl font-bold text-[#00ff41] phosphor-glow mb-6 tracking-widest border-b border-[#00ff41]/30 pb-2">
          // API CREDENTIALS
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#00ff41] opacity-70 mb-2 tracking-wider">
              CLIENT ID
            </label>
            <input
              type="text"
              value={credentials.clientId}
              onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
              placeholder="Enter your PISTE Client ID"
              className="w-full px-4 py-3 terminal-input rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-[#00ff41] opacity-70 mb-2 tracking-wider">
              CLIENT SECRET
            </label>
            <input
              type="password"
              value={credentials.clientSecret}
              onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
              placeholder="Enter your PISTE Client Secret"
              className="w-full px-4 py-3 terminal-input rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-[#00ff41] opacity-70 mb-2 tracking-wider">
              API KEY
            </label>
            <input
              type="password"
              value={credentials.apiKey}
              onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              placeholder="Enter your PISTE API Key"
              className="w-full px-4 py-3 terminal-input rounded"
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs phosphor-glow">
              ERROR: {error}
            </div>
          )}

          {saved && (
            <div className="text-[#00ff41] text-xs phosphor-glow">
              CREDENTIALS SAVED SUCCESSFULLY
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              className="terminal-button px-6 py-2 text-sm font-bold tracking-wider flex-1"
            >
              SAVE CREDENTIALS
            </button>
            <button
              onClick={handleClear}
              className="terminal-button px-6 py-2 text-sm font-bold tracking-wider flex-1"
            >
              CLEAR
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#00ff41]/30">
          <p className="text-xs opacity-40 leading-relaxed">
            OBTAIN YOUR CREDENTIALS FROM THE PISTE API PORTAL:
            <br />
            <span className="opacity-60">https://api.piste.gouv.fr/</span>
            <br />
            YOUR CREDENTIALS ARE STORED LOCALLY ON YOUR DEVICE.
          </p>
        </div>
      </div>
    </div>
  );
}
