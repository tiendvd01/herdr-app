# projects.sh — cấu hình nguồn đặc tả theo dự án của team Sora (nạp bằng `.`, không chạy riêng).
# profile_project <mã dự án> đặt PM_REPO DEV_REPO PINNED_DIR NOTICE_DIR SPEC_DIRS CANON_RE MOCKUP_DIR
# BOARD_PROJECT (giá trị field Project trên board) TAG_REPOS (repo mà tag @ trong đó thuộc dự án này).
# Cần GH_OWNER đã có (từ profile.env). Trả 1 nếu chưa cấu hình dự án đó.
# Bảng giải thích từng dự án: ../references/du-an-va-nguon.md

PROFILE_PROJECTS="168 | 147 | 167 | lunchbox"

profile_project() {
  case "$1" in
    168)
      BOARD_PROJECT="Yahagi 168"
      TAG_REPOS="168-yahagi-panwall 168-yahagi-pan-wall-dx panwall-dx-phase1"
      PM_REPO="$GH_OWNER/168-yahagi-pan-wall-dx"
      DEV_REPO="$GH_OWNER/168-yahagi-panwall"
      PINNED_DIR="docs/requirements/source"
      NOTICE_DIR="90-PJ管理/オフショア/2026-08-10-01 画面仕様変更 通知"
      SPEC_DIRS='(02-要件定義|05-仕様書|07-UI設計|06-スケジュール|90-PJ管理/オフショア|mockup/|docs/CHANGELOG\.md)'
      CANON_RE='^(02-要件定義|05-仕様書)/.*(要件一覧|機能仕様書)\.md$'
      MOCKUP_DIR="mockup"
      ;;
    147|167)
      BOARD_PROJECT="Yahagi $1"
      TAG_REPOS="147-yahagi-ryokka-system 147-yahagisystem-pj 167-yahagi-sekisan-dx 167-yahagi-sekisan"
      PM_REPO="$GH_OWNER/147-yahagisystem-pj"
      DEV_REPO="$GH_OWNER/147-yahagi-ryokka-system"
      PINNED_DIR="docs/requirements/source"
      NOTICE_DIR=""
      SPEC_DIRS='.'
      CANON_RE='(要件|仕様|spec|requirement).*\.md$'
      MOCKUP_DIR="mockup"
      ;;
    lunchbox)
      BOARD_PROJECT="Lunchbox"
      TAG_REPOS="genba-bento 128_lunchboxEC_pm"
      PM_REPO="$GH_OWNER/128_lunchboxEC_pm"
      DEV_REPO="$GH_OWNER/genba-bento"
      PINNED_DIR="docs/requirements/source"
      NOTICE_DIR=""
      SPEC_DIRS='.'
      CANON_RE='(要件|仕様|spec|requirement).*\.md$'
      MOCKUP_DIR=""
      ;;
    *) return 1 ;;
  esac
}
