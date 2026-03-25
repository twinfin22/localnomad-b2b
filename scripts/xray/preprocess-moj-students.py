"""
Step 0.1: MOJ Student Data → University Nationality Profiles
Input: 법무부_유학생관리정보 데이터_20251231.csv (CP949, 304,360 rows)
Output: src/data/xray/nationality-profiles.json
"""
import pandas as pd
import json
import re
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INPUT_PATH = os.path.join(BASE_DIR, "docs/research/법무부_유학생관리정보 데이터_20251231.csv")
OUTPUT_PATH = os.path.join(BASE_DIR, "localnomad-b2b/src/data/xray/nationality-profiles.json")

# ── School name normalization ──
STRIP_PATTERNS = [
    r'\(학\)', r'\(산학협력단\)', r'국립대학법인\s*', r'사립\s*',
    r'학교법인\s*\S+\s*', r'\(사\)', r'\(재\)',
]
# Campus variant collapse: normalize campus suffixes
CAMPUS_SUFFIXES = [
    r'국제캠퍼스$', r'제2캠퍼스$', r'제3캠퍼스$', r'분교$',
    r'서울캠퍼스$', r'천안캠퍼스$', r'세종캠퍼스$', r'글로벌캠퍼스$',
    r'ERICA캠퍼스$', r'에리카캠퍼스$',
]
# School filter: must contain university-related keywords
SCHOOL_PATTERN = re.compile(r'대학|학교|대학원|과학기술원|연구원|폴리텍')


def normalize_school_name(name: str) -> str:
    """Normalize school name by stripping prefixes/suffixes and collapsing campus variants."""
    if not isinstance(name, str):
        return ""
    name = name.strip()
    for pat in STRIP_PATTERNS:
        name = re.sub(pat, '', name)
    for pat in CAMPUS_SUFFIXES:
        name = re.sub(pat, '', name)
    return name.strip()


def is_valid_school(name: str) -> bool:
    """Filter to actual educational institutions."""
    return bool(SCHOOL_PATTERN.search(name))


def calculate_hhi(nationality_counts: dict) -> float:
    """Calculate Herfindahl-Hirschman Index for nationality concentration."""
    total = sum(nationality_counts.values())
    if total == 0:
        return 0.0
    shares = [(count / total) for count in nationality_counts.values()]
    return round(sum(s ** 2 for s in shares), 4)


def main():
    print("Loading MOJ student data...")
    df = pd.read_csv(INPUT_PATH, encoding='cp949')
    print(f"  Raw rows: {len(df):,}")

    # Normalize school names
    df['학교명_norm'] = df['학교명'].apply(normalize_school_name)

    # Filter to valid schools
    df = df[df['학교명_norm'].apply(is_valid_school)].copy()
    print(f"  After school filter: {len(df):,}")

    # Map 체류자격 to program categories
    program_map = {
        '학사과정': '학사과정',
        '석사과정': '석사과정',
        '박사과정': '박사과정',
        '어학연수': '어학연수',
        '교환학생': '교환학생',
        '기타연수': '기타연수',
    }
    df['program'] = df['체류자격'].map(program_map).fillna('기타')

    universities = {}
    for school, group in df.groupby('학교명_norm'):
        nat_counts = group['국적명'].value_counts().to_dict()
        gender_counts = group['성별'].value_counts().to_dict()
        program_counts = group['program'].value_counts().to_dict()
        total = len(group)

        # Top nationality percentage
        top_nat = max(nat_counts.values()) if nat_counts else 0
        top_nat_pct = round(top_nat / total * 100, 1) if total > 0 else 0

        # Sort nationalities by count descending
        sorted_nats = dict(sorted(nat_counts.items(), key=lambda x: -x[1]))

        universities[school] = {
            "total": total,
            "nationalities": sorted_nats,
            "genders": {
                "남": gender_counts.get("남", 0),
                "여": gender_counts.get("여", 0),
            },
            "programs": program_counts,
            "hhi": calculate_hhi(nat_counts),
            "topNationPct": top_nat_pct,
            "nNationalities": len(nat_counts),
        }

    print(f"  Universities with ≥1 foreign student: {len(universities)}")

    # ── Spot checks ──
    spot_checks = ['연세대학교', '선문대학교', '서울대학교', '경희대학교', '호서대학교']
    print("\n  ── HHI Spot Checks ──")
    for name in spot_checks:
        if name in universities:
            u = universities[name]
            top_nat_name = list(u['nationalities'].keys())[0] if u['nationalities'] else 'N/A'
            print(f"  {name}: HHI={u['hhi']}, total={u['total']}, "
                  f"top={top_nat_name} ({u['topNationPct']}%), "
                  f"nationalities={u['nNationalities']}")
        else:
            print(f"  {name}: NOT FOUND")

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(universities, f, ensure_ascii=False, indent=2)

    print(f"\n  Output: {OUTPUT_PATH}")
    print(f"  File size: {os.path.getsize(OUTPUT_PATH):,} bytes")


if __name__ == '__main__':
    main()
