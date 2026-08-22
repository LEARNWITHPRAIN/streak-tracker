import React, { useState, useEffect, useCallback } from 'react';
import { Music2, Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'yodhamode_spotify_embeds';

interface SpotifyEntry {
  id: string;
  spotifyType: 'track' | 'album' | 'playlist';
  spotifyId: string;
  url: string;
  addedAt: number;
}

function parseSpotifyUrl(raw: string): { type: 'track' | 'album' | 'playlist'; id: string } | null {
  try {
    const url = new URL(raw.trim());
    if (url.hostname !== 'open.spotify.com') return null;
    const match = url.pathname.match(/^\/(track|album|playlist)\/([A-Za-z0-9]+)/);
    if (!match) return null;
    return { type: match[1] as 'track' | 'album' | 'playlist', id: match[2] };
  } catch {
    return null;
  }
}

function loadEntries(): SpotifyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SpotifyEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: SpotifyEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const SpotifySection: React.FC = () => {
  const [entries, setEntries] = useState<SpotifyEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const handleAdd = useCallback(() => {
    setError(null);
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError('Please paste a Spotify link first.');
      return;
    }
    const parsed = parseSpotifyUrl(trimmed);
    if (!parsed) {
      setError('Invalid link. Please paste a valid open.spotify.com track, album, or playlist URL.');
      return;
    }
    const isDuplicate = entries.some(
      (e) => e.spotifyType === parsed.type && e.spotifyId === parsed.id
    );
    if (isDuplicate) {
      setError('This item is already in your list.');
      return;
    }
    const newEntry: SpotifyEntry = {
      id: `${parsed.type}-${parsed.id}-${Date.now()}`,
      spotifyType: parsed.type,
      spotifyId: parsed.id,
      url: trimmed,
      addedAt: Date.now(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setInputValue('');
    setJustAdded(newEntry.id);
    setTimeout(() => setJustAdded(null), 1200);
  }, [inputValue, entries]);

  const handleRemove = useCallback((id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  }, [entries]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const getEmbedHeight = (type: SpotifyEntry['spotifyType']) =>
    type === 'track' ? 152 : 380;

  const getTypeLabel = (type: SpotifyEntry['spotifyType']) => {
    if (type === 'track') return 'Track';
    if (type === 'album') return 'Album';
    return 'Playlist';
  };

  const getTypeGradient = (type: SpotifyEntry['spotifyType']) => {
    if (type === 'track') return 'from-green-500/20 to-emerald-500/10 border-green-500/30';
    if (type === 'album') return 'from-purple-500/20 to-violet-500/10 border-purple-500/30';
    return 'from-blue-500/20 to-sky-500/10 border-blue-500/30';
  };

  const getTypeBadge = (type: SpotifyEntry['spotifyType']) => {
    if (type === 'track') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (type === 'album') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, hsl(142 69% 58% / 0.25), hsl(142 69% 58% / 0.10))' }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="hsl(142, 69%, 58%)">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: 'hsl(142, 69%, 58%)', textShadow: '0 0 18px hsl(142 69% 58% / 0.4)' }}>
            Spotify
          </h3>
          <p className="text-xs text-muted-foreground">
            Embed tracks, albums and playlists directly in your workout space
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-border/50 space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Add Spotify Link
        </p>
        <div className="flex gap-2.5">
          <input
            id="spotify-url-input"
            type="url"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="https://open.spotify.com/track/... or album/... or playlist/..."
            className="flex-1 bg-muted/60 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ '--tw-ring-color': 'hsl(142 69% 58% / 0.5)' } as React.CSSProperties}
          />
          <button
            id="spotify-add-btn"
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(142, 69%, 48%), hsl(142, 69%, 40%))',
              color: '#000',
              boxShadow: '0 0 18px hsl(142 69% 48% / 0.35)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
          Copy a share link from Spotify (Share → Copy Link). Supports tracks, albums and playlists.
          Saved locally in your browser.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-border/50">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'hsl(142 69% 58% / 0.12)' }}
          >
            <Music2 className="w-8 h-8" style={{ color: 'hsl(142, 69%, 58%)' }} />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">No Spotify embeds yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Paste a Spotify link above to add your first track, album or playlist
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {entries.length} {entries.length === 1 ? 'Item' : 'Items'} · Most Recent First
          </p>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-2xl border bg-gradient-to-br p-4 space-y-3 transition-all duration-500 ${getTypeGradient(entry.spotifyType)} ${
                justAdded === entry.id ? 'scale-[1.01]' : ''
              }`}
              style={
                justAdded === entry.id
                  ? { boxShadow: '0 0 28px hsl(142 69% 58% / 0.25)' }
                  : {}
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadge(entry.spotifyType)}`}
                  >
                    {getTypeLabel(entry.spotifyType)}
                  </span>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    title="Open in Spotify"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden sm:inline">Open in Spotify</span>
                  </a>
                </div>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-all shrink-0"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <iframe
                src={`https://open.spotify.com/embed/${entry.spotifyType}/${entry.spotifyId}?utm_source=generator&theme=0`}
                width="100%"
                height={getEmbedHeight(entry.spotifyType)}
                frameBorder={0}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl"
                title={`Spotify ${entry.spotifyType} embed`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpotifySection;
