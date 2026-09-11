#!/bin/bash
# DuckDB 查询入口。**查询层，不是存储层** —— 数据仍然是 data/*.json，
# 因为审核机制是 git diff（见 docs/前端落地方案_V1.md 第七节）。
#
#   ./scripts/q.sh "SELECT ..."          # 跑一条 SQL
#   ./scripts/q.sh                        # 进交互式，已建好视图
#
# 已建视图：models / capabilities / support / versions / pricing / platforms /
#          availability / orgs / investments
set -euo pipefail
cd "$(dirname "$0")/.."
command -v duckdb >/dev/null || { echo "没装 duckdb：brew install duckdb"; exit 1; }

VIEWS=$(cat <<'SQL'
CREATE OR REPLACE VIEW atlas AS SELECT * FROM read_json_auto('data/atlas.json');
-- unnest 出来的 struct 要先落成一列再 .*，直接 unnest(x).* 是语法错
CREATE OR REPLACE VIEW models       AS SELECT r.* FROM (SELECT unnest(models)       AS r FROM atlas);
CREATE OR REPLACE VIEW capabilities AS SELECT r.* FROM (SELECT unnest(capabilities) AS r FROM atlas);
CREATE OR REPLACE VIEW support      AS SELECT r.* FROM (SELECT unnest(support)      AS r FROM atlas);
CREATE OR REPLACE VIEW versions     AS SELECT r.* FROM (SELECT unnest(versions)     AS r FROM atlas);
CREATE OR REPLACE VIEW pricing      AS SELECT r.* FROM (SELECT unnest(pricing)      AS r FROM atlas);
CREATE OR REPLACE VIEW platforms    AS SELECT r.* FROM (SELECT unnest(platforms)    AS r FROM atlas);
CREATE OR REPLACE VIEW availability AS SELECT r.* FROM (SELECT unnest(availability) AS r FROM atlas);
CREATE OR REPLACE VIEW orgs         AS SELECT r.* FROM (SELECT unnest(orgs)         AS r FROM atlas);
SQL
)

if [ $# -eq 0 ]; then
  exec duckdb -cmd "$VIEWS"
else
  duckdb -c "$VIEWS $1"
fi
