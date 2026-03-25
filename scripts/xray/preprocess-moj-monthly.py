"""
Step 0.2: MOJ Monthly Data → National Trend Time Series
Input: 법무부_47(외국인 유학생) 월별 외국인 유학생 국적(지역)별 현황_20260131.csv (CP949, 16,438 rows)
Output: src/data/xray/monthly-trends.json
"""
import pandas as pd
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INPUT_PATH = os.path.join(
    BASE_DIR,
    "docs/research/법무부_47(외국인 유학생) 월별 외국인 유학생 국적(지역)별 현황_20260131.csv"
)
OUTPUT_PATH = os.path.join(BASE_DIR, "localnomad-b2b/src/data/xray/monthly-trends.json")


def main():
    print("Loading MOJ monthly data...")
    df = pd.read_csv(INPUT_PATH, encoding='cp949')
    print(f"  Raw rows: {len(df):,}")
    print(f"  Columns: {list(df.columns)}")
    print(f"  구분 values: {df['구분'].unique()[:10]}")

    # Filter D2 + D4 visa types
    # 구분 column contains values like '유학D2', '한국어연수D41'
    d2_mask = df['구분'].str.contains('D2', na=False)
    d4_mask = df['구분'].str.contains('D4', na=False)
    df_filtered = df[d2_mask | d4_mask].copy()
    print(f"  After D2+D4 filter: {len(df_filtered):,}")

    # Aggregate by nationality and year-month (sum D2+D4)
    monthly = df_filtered.groupby(['국적지역', '년', '월'])['유학생수'].sum().reset_index()

    # Build per-nationality time series
    nationalities = {}
    for nat, group in monthly.groupby('국적지역'):
        # Sort by year, month
        group = group.sort_values(['년', '월'])
        series = []
        for _, row in group.iterrows():
            series.append({
                "year": int(row['년']),
                "month": int(row['월']),
                "count": int(row['유학생수']),
            })
        nationalities[nat] = series

    # Calculate growth rates (Jan 2022 vs Jan 2026)
    growth_rates = {}
    for nat, series in nationalities.items():
        jan_2022 = next((s['count'] for s in series if s['year'] == 2022 and s['month'] == 1), None)
        jan_2026 = next((s['count'] for s in series if s['year'] == 2026 and s['month'] == 1), None)
        if jan_2022 and jan_2022 > 0 and jan_2026:
            growth_pct = round((jan_2026 - jan_2022) / jan_2022 * 100, 1)
            growth_rates[nat] = {
                "jan2022": jan_2022,
                "jan2026": jan_2026,
                "growthPct": growth_pct,
            }

    # Sort by growth rate descending
    sorted_growth = dict(sorted(growth_rates.items(), key=lambda x: -x[1]['growthPct']))

    output = {
        "timeSeries": nationalities,
        "growthRates": sorted_growth,
        "meta": {
            "startYear": 2022,
            "startMonth": 1,
            "endYear": 2026,
            "endMonth": 1,
            "visaTypes": "D2+D4",
            "totalNationalities": len(nationalities),
        }
    }

    # Print top growth nationalities
    print("\n  ── Top 10 Growth Nationalities (Jan 2022 → Jan 2026) ──")
    for i, (nat, info) in enumerate(list(sorted_growth.items())[:10]):
        print(f"  {i+1}. {nat}: {info['jan2022']:,} → {info['jan2026']:,} ({info['growthPct']:+.1f}%)")

    # Growth nationalities (≥100%)
    high_growth = {k: v for k, v in sorted_growth.items() if v['growthPct'] >= 100}
    print(f"\n  Nationalities with ≥100% growth: {len(high_growth)}")

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n  Output: {OUTPUT_PATH}")
    print(f"  File size: {os.path.getsize(OUTPUT_PATH):,} bytes")


if __name__ == '__main__':
    main()
