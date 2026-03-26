import { Matrix, inverse, solve } from 'ml-matrix';
import { MatchData } from '@/types/match-data';
import { MatchFuelScore } from '@/components/analytics/ScoreEntryPanel';
import { FiringRateEstimate } from '../../components/analytics/types';

interface AlliancePoissonRow {
  r1: number;
  r2: number;
  r3: number;
  t1: number;
  t2: number;
  t3: number;
  score: number;
}

function solveWeightedNormalEquation(X: number[][], weights: number[], z: number[]): number[] {
  const Xm = new Matrix(X);
  const Wm = Matrix.diagonal(weights);
  const XtW = Xm.transpose().mmul(Wm);
  const XtWX = XtW.mmul(Xm);
  const XtWz = XtW.mmul(Matrix.columnVector(z));

  try {
    return solve(XtWX, XtWz).to1DArray();
  } catch {
    const p = XtWX.rows;
    const regularized = XtWX.add(Matrix.eye(p, p).mul(1e-8));
    return solve(regularized, XtWz).to1DArray();
  }
}

function buildRows(matchData: MatchData[], fuelScores: MatchFuelScore[]): AlliancePoissonRow[] {
  const groups = new Map<string, MatchData[]>();
  const scoresByMatch = new Map<number, MatchFuelScore>();
  const rows: AlliancePoissonRow[] = [];

  for (const score of fuelScores) {
    scoresByMatch.set(score.match_number, score);
  }

  for (const row of matchData) {
    const position = row.position.toLowerCase();
    const color = position.includes('red') ? 'red' : position.includes('blue') ? 'blue' : null;
    if (!color) continue;

    const key = `${row.match_number}_${color}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const sumShootTime = (row: MatchData) => {
    const auto = (row.auto_shooting_times || []).reduce((sum, value) => sum + value, 0);
    const teleop = (row.teleop_shooting_times || []).reduce((sum, value) => sum + value, 0);
    return auto + teleop;
  };

  for (const [key, allianceRows] of groups) {
    if (allianceRows.length !== 3) continue;

    const [matchNumberStr, color] = key.split('_');
    const matchNumber = Number(matchNumberStr);
    const fuelScore = scoresByMatch.get(matchNumber);
    if (!fuelScore) continue;

    const score = color === 'red' ? fuelScore.red_fuel_score : fuelScore.blue_fuel_score;
    if (!Number.isFinite(score)) continue;

    const [a, b, c] = allianceRows;
    const t1 = sumShootTime(a);
    const t2 = sumShootTime(b);
    const t3 = sumShootTime(c);
    const total = t1 + t2 + t3;
    if (total <= 0) continue;

    rows.push({
      r1: a.team_number,
      r2: b.team_number,
      r3: c.team_number,
      t1,
      t2,
      t3,
      score,
    });
  }

  return rows;
}

export function estimateFiringRates(
  matchData: MatchData[],
  fuelScores: MatchFuelScore[],
): Map<number, FiringRateEstimate> {
  const rows = buildRows(matchData, fuelScores);
  const results = new Map<number, FiringRateEstimate>();
  if (rows.length === 0) return results;

  const teamSet = new Set<number>();
  for (const row of rows) {
    teamSet.add(row.r1);
    teamSet.add(row.r2);
    teamSet.add(row.r3);
  }

  const teams = Array.from(teamSet).sort((a, b) => a - b);
  const teamToIndex = new Map<number, number>(teams.map((team, index) => [team, index]));
  const p = teams.length;

  const X: number[][] = [];
  const offsets: number[] = [];
  const y: number[] = [];

  for (const row of rows) {
    const total = row.t1 + row.t2 + row.t3;
    if (total <= 0) continue;

    const designRow = new Array<number>(p).fill(0);
    designRow[teamToIndex.get(row.r1)!] = row.t1 / total;
    designRow[teamToIndex.get(row.r2)!] = row.t2 / total;
    designRow[teamToIndex.get(row.r3)!] = row.t3 / total;
    X.push(designRow);
    offsets.push(Math.log(total));
    y.push(row.score);
  }

  const n = X.length;
  if (n <= p) return results;

  const etaFromBeta = (beta: number[]) => {
    return X.map((row, i) => row.reduce((sum, value, j) => sum + value * beta[j], 0) + offsets[i]);
  };

  let beta = new Array<number>(p).fill(0);
  let mu = new Array<number>(n).fill(1);
  let model = 'Poisson';
  let finalWeights = new Array<number>(n).fill(1);

  for (let iter = 0; iter < 100; iter++) {
    const eta = etaFromBeta(beta);
    mu = eta.map((value) => Math.max(Math.exp(value), 1e-12));
    const z = eta.map((value, i) => value - offsets[i] + (y[i] - mu[i]) / mu[i]);
    const nextBeta = solveWeightedNormalEquation(X, mu, z);
    const delta = nextBeta.reduce((sum, value, index) => sum + Math.abs(value - beta[index]), 0);
    beta = nextBeta;
    finalWeights = mu;
    if (delta < 1e-8) break;
  }

  const pearsonChi2 = y.reduce((sum, value, i) => {
    const variance = Math.max(mu[i], 1e-12);
    return sum + ((value - mu[i]) ** 2) / variance;
  }, 0);
  const overdispersion = pearsonChi2 / (n - p);

  if (overdispersion > 2.0) {
    const alphaEstimate =
      y.reduce((sum, value, i) => {
        const denom = Math.max(mu[i] ** 2, 1e-12);
        return sum + (((value - mu[i]) ** 2) - mu[i]) / denom;
      }, 0) / n;
    const alpha = Math.max(alphaEstimate, 1e-8);

    let nbBeta = beta.slice();
    let nbMu = mu.slice();
    let nbWeights = finalWeights.slice();

    for (let iter = 0; iter < 100; iter++) {
      const eta = etaFromBeta(nbBeta);
      nbMu = eta.map((value) => Math.max(Math.exp(value), 1e-12));
      const variance = nbMu.map((value) => value + alpha * value * value);
      nbWeights = nbMu.map((value, i) => (value * value) / Math.max(variance[i], 1e-12));
      const z = eta.map((value, i) => value - offsets[i] + (y[i] - nbMu[i]) / nbMu[i]);
      const nextBeta = solveWeightedNormalEquation(X, nbWeights, z);
      const delta = nextBeta.reduce((sum, value, index) => sum + Math.abs(value - nbBeta[index]), 0);
      nbBeta = nextBeta;
      if (delta < 1e-8) break;
    }

    beta = nbBeta;
    mu = nbMu;
    finalWeights = nbWeights;
    model = 'NegativeBinomial';
  }

  const Xm = new Matrix(X);
  const Wm = Matrix.diagonal(finalWeights);
  const XtWX = Xm.transpose().mmul(Wm).mmul(Xm);
  const cov = inverse(XtWX.add(Matrix.eye(p, p).mul(1e-8)));
  const se = cov.diagonal().map((value) => Math.sqrt(Math.max(value, 0)));

  for (const team of teams) {
    const index = teamToIndex.get(team)!;
    const bps = Math.exp(beta[index]);
    const ciLow = Math.exp(beta[index] - 1.96 * se[index]);
    const ciHigh = Math.exp(beta[index] + 1.96 * se[index]);
    results.set(team, {
      bps,
      ciLow,
      ciHigh,
      ciWidth: ciHigh - ciLow,
      model,
    });
  }

  return results;
}
