'use client';

import { useState } from 'react';
import { LegalResponse } from '@/types';

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<LegalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error('Erreur lors de la recherche');
      setResponse(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const legifranceUrl = (nor: string) =>
    `https://www.legifrance.gouv.fr/search/all?query=${encodeURIComponent(nor)}`;

  const formatDate = (d: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
  };

  const etatBadge = (etat: string) => {
    if (!etat) return null;
    const colors: Record<string, string> = {
      VIGUEUR: 'border-[#00ff41]/50 text-[#00ff41]',
      ABROGE: 'border-red-500/50 text-red-400',
      MODIFIE: 'border-yellow-500/50 text-yellow-400',
    };
    const label: Record<string, string> = {
      VIGUEUR: 'ACTIVE', ABROGE: 'ABROGÉ', MODIFIE: 'MODIFIÉ',
    };
    const key = Object.keys(colors).find(k => etat.toUpperCase().includes(k)) || '';
    if (!key) return <span className="text-xs opacity-60">{etat}</span>;
    return (
      <span className={`text-xs border px-2 py-0.5 ${colors[key]}`}>
        {label[key]}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="terminal-panel p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ENTER QUERY // EX: DROIT À DES JOURS DE FRACTIONNEMENT ?"
              className="flex-1 px-4 py-3 text-lg terminal-input rounded"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="terminal-button px-8 py-3 text-sm font-bold tracking-wider"
            >
              {loading ? 'PROCESSING...' : 'EXECUTE'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-6 terminal-panel p-4 text-[#00ff41] phosphor-glow">
          <span className="text-xs opacity-60">ERROR: </span>
          {error}
        </div>
      )}

      {response && (
        <div className="terminal-panel p-6 space-y-6">
          {/* Résumé */}
          <section>
            <h2 className="text-sm font-bold text-[#00ff41] phosphor-glow mb-3 tracking-widest border-b border-[#00ff41]/30 pb-2">
              // RESPONSE
            </h2>
            <p className="text-[#00ff41] leading-relaxed opacity-90">
              {response.summary}
            </p>
          </section>

          {/* Textes trouvés */}
          {response.results && response.results.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#00ff41] phosphor-glow mb-3 tracking-widest border-b border-[#00ff41]/30 pb-2">
                // OFFICIAL TEXTS [{response.results.length}]
              </h2>
              <div className="space-y-2">
                {response.results.map((result, index) => (
                  <div
                    key={index}
                    className="terminal-border p-3 hover:bg-[#00ff41]/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.nature && (
                          <span className="text-xs border border-[#00ff41]/50 px-2 py-0.5">
                            {result.nature}
                          </span>
                        )}
                        {etatBadge((result as any).etat || '')}
                        {result.dateTexte && (
                          <span className="text-xs opacity-60">
                            {formatDate(result.dateTexte)}
                          </span>
                        )}
                      </div>
                      {result.nor && (
                        <a
                          href={legifranceUrl(result.nor)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs hover:underline whitespace-nowrap shrink-0 phosphor-glow"
                        >
                          [LÉGIFRANCE]
                        </a>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {result.title || result.nor || 'NO TITLE'}
                    </p>
                    {(result as any).resume && (
                      <p className="text-xs opacity-60 line-clamp-2">
                        {(result as any).resume}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Conditions */}
          {response.conditions && response.conditions.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#00ff41] phosphor-glow mb-3 tracking-widest border-b border-[#00ff41]/30 pb-2">
                // CONDITIONS
              </h2>
              <ul className="space-y-2">
                {response.conditions.map((condition, index) => (
                  <li key={index} className="flex items-start opacity-90">
                    <span className="mr-2 opacity-60">[</span>
                    {condition}
                    <span className="ml-2 opacity-60">]</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Démarches */}
          {response.procedures && response.procedures.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#00ff41] phosphor-glow mb-3 tracking-widest border-b border-[#00ff41]/30 pb-2">
                // PROCEDURES
              </h2>
              <ul className="space-y-2">
                {response.procedures.map((procedure, index) => (
                  <li key={index} className="flex items-start opacity-90">
                    <span className="mr-2 opacity-60">&gt;</span>
                    {procedure}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="pt-4 border-t border-[#00ff41]/30">
            <p className="text-xs opacity-40 text-center">
              DATA SOURCE: FONCTION PUBLIQUE TERRITORIALE OFFICIAL TEXTS
              // VERIFY WITH HR DEPARTMENT IF UNCERTAIN
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
