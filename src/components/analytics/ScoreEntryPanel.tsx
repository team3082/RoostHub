'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Fuel } from 'lucide-react';
import { useDatabaseStore } from '@/stores/database';

export interface MatchFuelScore {
  match_number: number;
  red_fuel_score: number;
  blue_fuel_score: number;
}

interface ScoreEntryPanelProps {
  onScoresChange: (scores: MatchFuelScore[]) => void;
}

interface FuelDraft {
  red: string;
  blue: string;
}

const STORAGE_KEY = 'frc_fuel_scores';

function isValidScoreInput(value: string): boolean {
  if (value === '') return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0;
}

function toScoreMap(scores: MatchFuelScore[]): Record<number, MatchFuelScore> {
  return scores.reduce<Record<number, MatchFuelScore>>((acc, score) => {
    acc[score.match_number] = score;
    return acc;
  }, {});
}

export default function ScoreEntryPanel({ onScoresChange }: ScoreEntryPanelProps) {
  const matchData = useDatabaseStore((state) => state.matchData);
  const [isOpen, setIsOpen] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, FuelDraft>>({});
  const [savedScores, setSavedScores] = useState<Record<number, MatchFuelScore>>({});

  const matchNumbers = useMemo(() => {
    return Array.from(new Set(matchData.map((entry) => entry.match_number))).sort((a, b) => a - b);
  }, [matchData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as MatchFuelScore[];
      if (!Array.isArray(parsed)) return;

      const sanitized = parsed.filter((score) => {
        return (
          typeof score?.match_number === 'number' &&
          Number.isFinite(score.match_number) &&
          typeof score?.red_fuel_score === 'number' &&
          Number.isFinite(score.red_fuel_score) &&
          typeof score?.blue_fuel_score === 'number' &&
          Number.isFinite(score.blue_fuel_score)
        );
      });

      const restoredMap = toScoreMap(sanitized);
      setSavedScores(restoredMap);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const score of sanitized) {
          next[score.match_number] = {
            red: String(score.red_fuel_score),
            blue: String(score.blue_fuel_score),
          };
        }
        return next;
      });
    } catch {
      // Ignore malformed localStorage payloads.
    }
  }, []);

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };

      for (const matchNumber of matchNumbers) {
        if (!next[matchNumber]) {
          const restored = savedScores[matchNumber];
          next[matchNumber] = {
            red: restored ? String(restored.red_fuel_score) : '',
            blue: restored ? String(restored.blue_fuel_score) : '',
          };
        }
      }

      return next;
    });
  }, [matchNumbers, savedScores]);

  const visibleSavedScores = useMemo(() => {
    if (matchNumbers.length === 0) return [];

    const matchSet = new Set(matchNumbers);
    return Object.values(savedScores)
      .filter((score) => matchSet.has(score.match_number))
      .sort((a, b) => a.match_number - b.match_number);
  }, [savedScores, matchNumbers]);

  const enteredCount = visibleSavedScores.length;

  useEffect(() => {
    onScoresChange(visibleSavedScores);
  }, [visibleSavedScores, onScoresChange]);

  const handleDraftChange = (matchNumber: number, alliance: 'red' | 'blue', value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [matchNumber]: {
        red: alliance === 'red' ? value : prev[matchNumber]?.red ?? '',
        blue: alliance === 'blue' ? value : prev[matchNumber]?.blue ?? '',
      },
    }));
  };

  const handleSave = (matchNumber: number) => {
    const draft = drafts[matchNumber];
    if (!draft) return;
    if (!isValidScoreInput(draft.red) || !isValidScoreInput(draft.blue)) return;

    const nextScore: MatchFuelScore = {
      match_number: matchNumber,
      red_fuel_score: Number(draft.red),
      blue_fuel_score: Number(draft.blue),
    };

    const nextSavedMap = {
      ...savedScores,
      [matchNumber]: nextScore,
    };

    const matchSet = new Set(matchNumbers);
    const nextVisibleScores = Object.values(nextSavedMap)
      .filter((score) => matchSet.has(score.match_number))
      .sort((a, b) => a.match_number - b.match_number);

    setSavedScores(nextSavedMap);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVisibleScores));
    }

    onScoresChange(nextVisibleScores);
  };

  const isRowConfirmed = (matchNumber: number) => {
    const saved = savedScores[matchNumber];
    const draft = drafts[matchNumber];
    if (!saved || !draft) return false;
    return String(saved.red_fuel_score) === draft.red && String(saved.blue_fuel_score) === draft.blue;
  };

  return (
    <section className="rounded-xl border bg-white" style={{ borderColor: '#e4e6f0' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Fuel className="h-5 w-5" style={{ color: '#32327C' }} />
          <h2 className="text-base font-semibold" style={{ color: '#1a1a3e' }}>Fuel Scores</h2>
          <span className="text-sm" style={{ color: '#6b7280' }}>
            {enteredCount} / {matchNumbers.length} matches entered
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5" style={{ color: '#6b7280' }} />
        ) : (
          <ChevronDown className="h-5 w-5" style={{ color: '#6b7280' }} />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          {matchNumbers.length === 0 ? (
            <p className="text-sm" style={{ color: '#6b7280' }}>No matches found in uploaded scouting data.</p>
          ) : (
            <div className="space-y-2">
              {matchNumbers.map((matchNumber) => {
                const draft = drafts[matchNumber] ?? { red: '', blue: '' };
                const canSave = isValidScoreInput(draft.red) && isValidScoreInput(draft.blue);
                const confirmed = isRowConfirmed(matchNumber);

                return (
                  <div
                    key={matchNumber}
                    className="rounded-lg border p-3"
                    style={{ borderColor: '#e4e6f0', backgroundColor: '#ffffff' }}
                  >
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-[90px_1fr_1fr_auto] md:items-end">
                      <div>
                        <p className="text-xs uppercase tracking-wide" style={{ color: '#6b7280' }}>Match</p>
                        <p className="text-sm font-semibold" style={{ color: '#1a1a3e' }}>{matchNumber}</p>
                      </div>

                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium" style={{ color: '#991b1b' }}>Red Fuel</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draft.red}
                          onChange={(event) => handleDraftChange(matchNumber, 'red', event.target.value)}
                          className="h-10 rounded-md border px-3 text-sm outline-none focus:ring-2"
                          style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2', color: '#7f1d1d' }}
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium" style={{ color: '#1d4ed8' }}>Blue Fuel</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draft.blue}
                          onChange={(event) => handleDraftChange(matchNumber, 'blue', event.target.value)}
                          className="h-10 rounded-md border px-3 text-sm outline-none focus:ring-2"
                          style={{ borderColor: '#bfdbfe', backgroundColor: '#eff6ff', color: '#1e3a8a' }}
                        />
                      </label>

                      <div className="flex items-center gap-2 md:justify-end">
                        <button
                          type="button"
                          onClick={() => handleSave(matchNumber)}
                          disabled={!canSave}
                          className="h-10 rounded-md px-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ backgroundColor: '#32327C', color: '#ffffff' }}
                        >
                          Save
                        </button>
                        {confirmed && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#15803d' }}>
                            <CheckCircle2 className="h-4 w-4" />
                            Confirmed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
