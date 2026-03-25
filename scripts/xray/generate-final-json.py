"""
Step 0.4: Merge all preprocessed data + generate cold email variables
Input: nationality-profiles.json, monthly-trends.json, kedi-profiles.json
Output:
  - src/data/xray/universities.json (search index)
  - output/cold-email-vars.json (Stibee upload)
"""
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "localnomad-b2b/src/data/xray")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

NAT_PROFILES_PATH = os.path.join(DATA_DIR, "nationality-profiles.json")
MONTHLY_TRENDS_PATH = os.path.join(DATA_DIR, "monthly-trends.json")
KEDI_PROFILES_PATH = os.path.join(DATA_DIR, "kedi-profiles.json")
UNIVERSITIES_PATH = os.path.join(DATA_DIR, "universities.json")
COLD_EMAIL_PATH = os.path.join(OUTPUT_DIR, "cold-email-vars.json")


def get_hhi_level(hhi: float) -> str:
    if hhi > 0.5:
        return "위험"
    elif hhi > 0.3:
        return "주의"
    return "분산"


def get_opportunity_nationalities(
    uni_profile: dict, growth_rates: dict, threshold_growth: float = 100.0, threshold_count: int = 10
) -> list:
    """Find nationalities with high national growth but low enrollment at this university."""
    uni_nats = uni_profile.get("nationalities", {})
    opportunities = []
    for nat, info in growth_rates.items():
        if info['growthPct'] >= threshold_growth:
            uni_count = uni_nats.get(nat, 0)
            if uni_count < threshold_count:
                opportunities.append({
                    "nationality": nat,
                    "nationalGrowthPct": info['growthPct'],
                    "jan2022": info['jan2022'],
                    "jan2026": info['jan2026'],
                    "universityCount": uni_count,
                })
    # Sort by growth desc
    opportunities.sort(key=lambda x: -x['nationalGrowthPct'])
    return opportunities[:5]  # Top 5


def main():
    print("Loading preprocessed data...")
    with open(NAT_PROFILES_PATH, 'r', encoding='utf-8') as f:
        nat_profiles = json.load(f)
    with open(MONTHLY_TRENDS_PATH, 'r', encoding='utf-8') as f:
        monthly_data = json.load(f)
    with open(KEDI_PROFILES_PATH, 'r', encoding='utf-8') as f:
        kedi_data = json.load(f)

    growth_rates = monthly_data.get('growthRates', {})
    kedi_profiles = kedi_data.get('profiles', {})

    print(f"  Nationality profiles: {len(nat_profiles)} universities")
    print(f"  Monthly trends: {len(monthly_data.get('timeSeries', {}))} nationalities")
    print(f"  KEDI profiles: {len(kedi_profiles)} entries")

    # ── Build search index ──
    # Build KEDI Korean name lookup
    kedi_korean_lookup = {}
    for key, profile in kedi_profiles.items():
        korean_name = profile.get('koreanName')
        if korean_name:
            kedi_korean_lookup[korean_name] = profile

    universities = []
    for name, profile in nat_profiles.items():
        kedi_available = name in kedi_korean_lookup
        kedi_info = kedi_korean_lookup.get(name, {})

        # Add opportunity nationalities to profile
        profile['opportunities'] = get_opportunity_nationalities(profile, growth_rates)
        profile['kediAvailable'] = kedi_available

        # Merge KEDI data if available
        if kedi_available:
            profile['kedi'] = {
                "topikSatisfactionRate": kedi_info.get('topikSatisfactionRate', 0),
                "dormitoryRate": kedi_info.get('dormitoryRate', 0),
                "dormitoryTotal": kedi_info.get('dormitoryTotal', 0),
                "dormitoryAccepted": kedi_info.get('dormitoryAccepted', 0),
                "totalStudents": kedi_info.get('totalStudents', 0),
                "tuition": kedi_info.get('tuition', 0),
                "employmentRate": kedi_info.get('employmentRate', 0),
                "region": kedi_info.get('region', ''),
            }
            profile['totalEnrollment'] = kedi_info.get('totalStudents', 0)

        universities.append({
            "name": name,
            "total": profile['total'],
            "region": kedi_info.get('region', ''),
            "hasData": True,
            "kediAvailable": kedi_available,
        })

    # Sort by total descending
    universities.sort(key=lambda x: -x['total'])

    print(f"\n  Search index: {len(universities)} universities")
    with_kedi = sum(1 for u in universities if u['kediAvailable'])
    print(f"  With KEDI data: {with_kedi}")
    print(f"  Without KEDI data: {len(universities) - with_kedi}")

    # ── Save updated nationality profiles ──
    with open(NAT_PROFILES_PATH, 'w', encoding='utf-8') as f:
        json.dump(nat_profiles, f, ensure_ascii=False, indent=2)

    # ── Save search index ──
    with open(UNIVERSITIES_PATH, 'w', encoding='utf-8') as f:
        json.dump(universities, f, ensure_ascii=False, indent=2)

    # ── Generate cold email variables ──
    cold_email_vars = []
    for uni in universities:
        name = uni['name']
        profile = nat_profiles[name]
        top_nats = list(profile['nationalities'].keys())[:3]
        hhi_level = get_hhi_level(profile['hhi'])

        cold_email_vars.append({
            "university": name,
            "matched": True,
            "total_foreign": profile['total'],
            "top_nationality": top_nats[0] if top_nats else '',
            "top_nationality_pct": profile['topNationPct'],
            "hhi_level": hhi_level,
            "n_nationalities": profile['nNationalities'],
            "top_3_nationalities": ', '.join(top_nats),
            "opportunity_count": len(profile.get('opportunities', [])),
            "top_opportunity": profile['opportunities'][0]['nationality'] if profile.get('opportunities') else '',
            "xray_url": f"https://search.visacampus.org?univ={name}",
        })

    # Add unmatched universities (those not in MOJ data but might exist)
    # For now, the unmatched ones won't have X-Ray links
    matched_names = {v['university'] for v in cold_email_vars}
    print(f"\n  Cold email: {len(cold_email_vars)} matched universities")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(COLD_EMAIL_PATH, 'w', encoding='utf-8') as f:
        json.dump(cold_email_vars, f, ensure_ascii=False, indent=2)

    print(f"  Cold email output: {COLD_EMAIL_PATH}")
    print(f"  Cold email file size: {os.path.getsize(COLD_EMAIL_PATH):,} bytes")

    # ── Summary ──
    print("\n  ══════════════════════════════════════")
    print(f"  Total universities (MOJ): {len(nat_profiles)}")
    print(f"  With KEDI data: {with_kedi}")
    print(f"  Search index entries: {len(universities)}")
    print(f"  Cold email entries: {len(cold_email_vars)}")
    print(f"  Files written:")
    for path in [NAT_PROFILES_PATH, MONTHLY_TRENDS_PATH, KEDI_PROFILES_PATH, UNIVERSITIES_PATH, COLD_EMAIL_PATH]:
        if os.path.exists(path):
            print(f"    ✓ {path} ({os.path.getsize(path):,} bytes)")


if __name__ == '__main__':
    main()
