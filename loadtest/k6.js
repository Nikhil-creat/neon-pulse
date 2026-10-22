// k6 run -e API=http://localhost:8000 loadtest/k6.js   (set RATE_LIMIT=100000 in .env first, or the per-IP limiter will return 429)
import http from "k6/http";
import { check, sleep } from "k6";
export const options = { vus: 20, duration: "30s", thresholds: { http_req_failed: ["rate<0.02"], http_req_duration: ["p(95)<400"] } };
const BASE = __ENV.API || "http://localhost:8000";
export default function () {
  const r = http.get(`${BASE}/api/v1/leaderboard?period=all&limit=10`);
  check(r, { "leaderboard 200": (x) => x.status === 200 });
  check(http.get(`${BASE}/health`), { "health 200": (x) => x.status === 200 });
  sleep(0.5);
}
