"""
FRC Firing Rate Estimator
Usage:
    firing_rate_estimator.exe input.csv
    firing_rate_estimator.exe input.csv output.csv

Input CSV must have columns: r1, r2, r3, t1, t2, t3, score
Output CSV will contain:    team, firing_rate, ci_low, ci_high, ci_width, n_matches, model
"""

import sys
import os
import pandas as pd
import numpy as np
import statsmodels.api as sm
import warnings
warnings.filterwarnings('ignore')


# ── Model ─────────────────────────────────────────────────────────────────────

def estimate_firing_rates(df: pd.DataFrame) -> pd.DataFrame:
    required = {'r1', 'r2', 'r3', 't1', 't2', 't3', 'score'}
    missing  = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}\n"
                         f"Required: r1, r2, r3, t1, t2, t3, score")

    df = df.copy()
    for col in ['r1', 'r2', 'r3']:
        df[col] = df[col].apply(lambda x: str(int(float(x))))

    teams = sorted(set(df['r1']) | set(df['r2']) | set(df['r3']))
    if len(teams) < 2:
        raise ValueError("Need at least 2 distinct teams.")

    X = pd.DataFrame(0.0, index=df.index, columns=teams)
    for idx, row in df.iterrows():
        X.loc[idx, row['r1']] = row['t1']
        X.loc[idx, row['r2']] = row['t2']
        X.loc[idx, row['r3']] = row['t3']

    y          = df['score'].astype(float)
    total_time = X.sum(axis=1)
    offset     = np.log(total_time)
    X_norm     = X.div(total_time, axis=0).fillna(0)
    n_matches  = (X > 0).sum()

    # Fit Poisson
    poisson_model  = sm.GLM(y, X_norm, family=sm.families.Poisson(), offset=offset)
    poisson_result = poisson_model.fit(disp=False)
    od             = poisson_result.pearson_chi2 / poisson_result.df_resid

    if od > 2.0:
        mu         = poisson_result.fittedvalues
        alpha_init = max((np.mean(((y - mu) / np.sqrt(mu))**2) - 1) / np.mean(mu), 0.01)
        nb_model   = sm.GLM(y, X_norm,
                            family=sm.families.NegativeBinomial(alpha=alpha_init),
                            offset=offset)
        result     = nb_model.fit(disp=False)
        model_used = 'NegativeBinomial'
    else:
        result     = poisson_result
        model_used = 'Poisson'

    ci          = result.conf_int()
    firing_rate = np.exp(result.params)
    ci_low      = np.exp(ci[0])
    ci_high     = np.exp(ci[1])

    out = pd.DataFrame({
        'team':        teams,
        'firing_rate': firing_rate.values.round(4),
        'ci_low':      ci_low.values.round(4),
        'ci_high':     ci_high.values.round(4),
        'ci_width':    (ci_high - ci_low).values.round(4),
        'n_matches':   n_matches.values.astype(int),
        'model':       model_used,
        'overdispersion': round(od, 3),
    })
    return out.sort_values('firing_rate', ascending=False).reset_index(drop=True)


# ── CLI ───────────────────────────────────────────────────────────────────────

def banner():
    print("=" * 52)
    print("  FRC Firing Rate Estimator")
    print("=" * 52)

def usage():
    print("\nUsage:")
    print("  firing_rate_estimator.exe input.csv")
    print("  firing_rate_estimator.exe input.csv output.csv")
    print("\nInput CSV columns required:")
    print("  r1, r2, r3   — team numbers")
    print("  t1, t2, t3   — shoot time (seconds) per robot")
    print("  score        — alliance shooting score")

def main():
    banner()

    # ── Argument parsing ──────────────────────────────────────────────────────
    args = sys.argv[1:]

    if len(args) == 0:
        # No args — prompt interactively so double-clicking the exe still works
        print("\nNo input file provided.")
        input_path = input("Enter path to input CSV: ").strip().strip('"')
    else:
        input_path = args[0]

    if len(args) >= 2:
        output_path = args[1]
    else:
        base        = os.path.splitext(input_path)[0]
        output_path = base + "_firing_rates.csv"

    # ── Load ──────────────────────────────────────────────────────────────────
    print(f"\nReading:  {input_path}")
    if not os.path.exists(input_path):
        print(f"\nERROR: File not found: {input_path}")
        input("\nPress Enter to exit...")
        sys.exit(1)

    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        print(f"\nERROR reading CSV: {e}")
        input("\nPress Enter to exit...")
        sys.exit(1)

    print(f"Loaded {len(df)} matches, {len(df.columns)} columns.")
    print(f"Columns found: {list(df.columns)}")

    # ── Run model ─────────────────────────────────────────────────────────────
    print("\nFitting model...")
    try:
        result_df = estimate_firing_rates(df)
    except ValueError as e:
        print(f"\nERROR: {e}")
        usage()
        input("\nPress Enter to exit...")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        input("\nPress Enter to exit...")
        sys.exit(1)

    # ── Print results to console ───────────────────────────────────────────────
    model_name = result_df['model'].iloc[0]
    od_val     = result_df['overdispersion'].iloc[0]
    print(f"\nModel used:      {model_name}")
    print(f"Overdispersion:  {od_val}  {'(high variance detected)' if od_val > 2 else '(OK)'}")
    print(f"Teams estimated: {len(result_df)}")
    print()
    print(result_df[['team','firing_rate','ci_low','ci_high','ci_width','n_matches']].to_string(index=False))

    # ── Save ──────────────────────────────────────────────────────────────────
    result_df.to_csv(output_path, index=False)
    print(f"\nSaved to: {output_path}")
    input("\nPress Enter to exit...")


if __name__ == '__main__':
    main()
