"""
Step 0.3: KEDI + 대학알리미 Mapping → University Panel C Profiles
Input:
  - Status of foreign students _2026-03-2421366983.xlsx (226 universities)
  - Status of foreign students _2026-03-24222956231.xlsx (149 community colleges)
  - 교육부_대학알리미_대학주요정보_학생_교원_연구_재정_교육여건.xlsx (489 universities)
Output: src/data/xray/kedi-profiles.json
"""
import pandas as pd
import json
import re
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KEDI_UNI = os.path.join(BASE_DIR, "docs/research/Status of foreign students _2026-03-2421366983.xlsx")
KEDI_CC = os.path.join(BASE_DIR, "docs/research/Status of foreign students _2026-03-24222956231.xlsx")
ALIMI = os.path.join(BASE_DIR, "docs/research/교육부_대학알리미_대학주요정보_학생_교원_연구_재정_교육여건.xlsx")
OUTPUT_PATH = os.path.join(BASE_DIR, "localnomad-b2b/src/data/xray/kedi-profiles.json")


def parse_kedi_file(filepath: str) -> pd.DataFrame:
    """Parse KEDI XLSX with merged header rows (rows 3-5)."""
    df = pd.read_excel(filepath, engine='openpyxl', header=None)

    # Use fixed column names to avoid duplicates from merged headers
    col_names = [
        'baseyear', 'school_type', 'establishment', 'region', 'status',
        'school', 'total', 'degree_subtotal', 'humanities', 'natural_science',
        'engineering', 'arts_pe', 'medicine', 'coop_curriculum',
        'training_subtotal', 'language_course', 'exchange', 'visiting', 'other_trainees',
        'topik_total', 'topik_level4', 'toefl_ibt59', 'english_speaking',
        'topik_satisfaction_rate',
        'dorm_degree_total', 'dorm_degree_accepted', 'dorm_degree_unaccepted',
        'dorm_nondegree_total', 'dorm_nondegree_accepted', 'dorm_nondegree_unaccepted',
    ]

    # Data starts from row 7 (0-indexed), skip rows with NaN in School column
    data = df.iloc[7:].copy()
    data.columns = col_names[:data.shape[1]]
    data = data.dropna(subset=['school'])

    return data


def clean_kedi_school_name(name: str) -> str:
    """Strip KEDI English suffixes to get base university name."""
    if not isinstance(name, str):
        return ""
    # Remove suffixes like _Principal university, _Branch campus, _Campus 2/3/4
    name = re.sub(r'_Principal university$', '', name)
    name = re.sub(r'_Branch campus$', '', name)
    name = re.sub(r'_Campus \d+$', '', name)
    return name.strip()


def safe_float(val, default=0.0):
    """Safely convert to float."""
    try:
        if pd.isna(val):
            return default
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_int(val, default=0):
    """Safely convert to int."""
    try:
        if pd.isna(val):
            return default
        return int(float(val))
    except (ValueError, TypeError):
        return default


def main():
    # ── Load 대학알리미 (Korean university names = ground truth) ──
    print("Loading 대학알리미 data...")
    alimi = pd.read_excel(ALIMI, engine='openpyxl')
    print(f"  대학알리미 rows: {len(alimi)}")
    # Clean column names (remove newlines)
    alimi.columns = [str(c).replace('\n', ' ').strip() for c in alimi.columns]

    # Build lookup: school name → alimi data
    alimi_lookup = {}
    for _, row in alimi.iterrows():
        name = str(row['학교명']).strip()
        campus = str(row.get('본분교명', '')).strip()
        key = name
        alimi_lookup[key] = {
            "campus": campus,
            "region": str(row.get('지역명', '')).strip(),
            "totalStudents": safe_int(row.get('재학생 (2025,명)', 0)),
            "foreignStudents": safe_int(row.get('외국인 학생 수 (2025,명)', 0)),
            "tuition": safe_int(row.get('평균 등록금 (2025,천원)', 0)),  # in 천원
            "employmentRate": safe_float(row.get('취업률 (2025,%)', 0)),
            "dormitoryRate": safe_float(row.get('기숙사 수용율(학부+대학원) (2025,%)', 0)),
            "competitionRate": str(row.get('신입생 경쟁률 (2025,:1)', '')),
            "fillRate": safe_float(row.get('신입생 충원율 (2025,%)', 0)),
            "scholarshipPerStudent": str(row.get('학생 1인당 연간 장학금 (2025,원)', '')),
        }

    print(f"  대학알리미 unique schools: {len(alimi_lookup)}")

    # ── Load KEDI files ──
    print("\nLoading KEDI University data...")
    kedi_uni = parse_kedi_file(KEDI_UNI)
    print(f"  KEDI university rows: {len(kedi_uni)}")

    print("Loading KEDI Community College data...")
    kedi_cc = parse_kedi_file(KEDI_CC)
    print(f"  KEDI community college rows: {len(kedi_cc)}")

    # Combine
    kedi_all = pd.concat([kedi_uni, kedi_cc], ignore_index=True)
    print(f"  Combined KEDI rows: {len(kedi_all)}")

    # Fixed column references
    school_col = 'school'
    total_col = 'total'
    region_col = 'region'
    topik_rate_col = 'topik_satisfaction_rate'
    dorm_total_col = 'dorm_degree_total'
    dorm_accepted_col = 'dorm_degree_accepted'

    # ── Map KEDI English names → Korean names via 대학알리미 ──
    print("\nMapping KEDI → Korean names...")

    # Build English → Korean mapping using foreign student count as secondary signal
    # KEDI has English names, 대학알리미 has Korean names
    # Strategy: fuzzy match + count cross-validation

    # First, build a reverse mapping attempt using common patterns
    # Many KEDI names follow pattern: "Korean University Name" in English
    # We'll use 대학알리미 foreign student count to cross-validate

    alimi_by_count = {}
    for name, data in alimi_lookup.items():
        fc = data['foreignStudents']
        if fc > 0:
            if fc not in alimi_by_count:
                alimi_by_count[fc] = []
            alimi_by_count[fc].append(name)

    kedi_profiles = {}
    mapped_count = 0
    unmapped = []

    for _, row in kedi_all.iterrows():
        eng_name = str(row[school_col]).strip()
        base_name = clean_kedi_school_name(eng_name)
        region = str(row[region_col]).strip() if pd.notna(row[region_col]) else ''
        total_foreign = safe_int(row[total_col])
        topik_rate = safe_float(row.get(topik_rate_col))
        dorm_total = safe_int(row.get(dorm_total_col))
        dorm_accepted = safe_int(row.get(dorm_accepted_col))

        # Try to match via foreign student count
        matched_korean = None
        if total_foreign > 0 and total_foreign in alimi_by_count:
            candidates = alimi_by_count[total_foreign]
            if len(candidates) == 1:
                matched_korean = candidates[0]
            # If multiple candidates, try region matching
            elif len(candidates) > 1:
                # Region mapping (English → Korean region patterns)
                for c in candidates:
                    alimi_region = alimi_lookup[c]['region']
                    if alimi_region and region and (
                        region.lower().replace('-do', '').replace('-si', '')
                        in alimi_region.lower().replace('도', '').replace('시', '')
                        or alimi_region in region
                    ):
                        matched_korean = c
                        break

        profile = {
            "kediEnglishName": eng_name,
            "kediBaseName": base_name,
            "region": region,
            "totalForeignStudents": total_foreign,
            "topikSatisfactionRate": topik_rate,
            "dormitoryTotal": dorm_total,
            "dormitoryAccepted": dorm_accepted,
            "kediAvailable": True,
        }

        if matched_korean and matched_korean in alimi_lookup:
            # Merge 대학알리미 data
            alimi_data = alimi_lookup[matched_korean]
            profile.update({
                "koreanName": matched_korean,
                "totalStudents": alimi_data['totalStudents'],
                "tuition": alimi_data['tuition'],
                "employmentRate": alimi_data['employmentRate'],
                "dormitoryRate": alimi_data['dormitoryRate'],
                "competitionRate": alimi_data['competitionRate'],
                "fillRate": alimi_data['fillRate'],
            })
            kedi_profiles[matched_korean] = profile
            mapped_count += 1
        else:
            profile["koreanName"] = None
            profile["kediAvailable"] = True  # KEDI data exists, just no Korean match
            unmapped.append(base_name)
            # Store by English name for now
            kedi_profiles[f"_unmapped_{base_name}"] = profile

    print(f"  Mapped to Korean: {mapped_count}")
    print(f"  Unmapped: {len(unmapped)}")
    total_kedi = mapped_count + len(unmapped)
    mapping_rate = round(mapped_count / total_kedi * 100, 1) if total_kedi > 0 else 0
    print(f"  Mapping rate: {mapping_rate}%")

    if mapping_rate < 80:
        print(f"  ⚠️ WARNING: Mapping rate {mapping_rate}% < 80% gate. Panel C may be deferred.")

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump({
            "profiles": kedi_profiles,
            "meta": {
                "totalKedi": total_kedi,
                "mapped": mapped_count,
                "unmapped": len(unmapped),
                "mappingRate": mapping_rate,
            }
        }, f, ensure_ascii=False, indent=2)

    print(f"\n  Output: {OUTPUT_PATH}")
    print(f"  File size: {os.path.getsize(OUTPUT_PATH):,} bytes")

    if unmapped:
        print(f"\n  ── First 20 unmapped KEDI names ──")
        for name in unmapped[:20]:
            print(f"    {name}")


if __name__ == '__main__':
    main()
