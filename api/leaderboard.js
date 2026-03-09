const { createClient } = require("@supabase/supabase-js");

const clampDate = (value) => {
  if (!value) return null;
  const m = String(value).match(/^\d{4}-\d{2}-\d{2}$/);
  return m ? value : null;
};

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    });
  }

  const body = req.method === "POST"
    ? (typeof req.body === "string" ? JSON.parse(req.body) : req.body)
    : {};

  const start = clampDate(req.query?.start || body?.start);
  const end = clampDate(req.query?.end || body?.end);
  if (!start || !end) {
    return res.status(400).json({ error: "start and end are required (YYYY-MM-DD)" });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("daily_aggregates")
      .select("user_id, day, total_eca")
      .gte("day", start)
      .lte("day", end);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const byUser = new Map();
    (data || []).forEach((row) => {
      if (!row?.user_id) return;
      const entry = byUser.get(row.user_id) || { total: 0, days: new Set() };
      entry.total += Number(row.total_eca) || 0;
      if (row.day) entry.days.add(String(row.day));
      byUser.set(row.user_id, entry);
    });

    const rows = Array.from(byUser.entries()).map(([user_id, info]) => ({
      user_id,
      total: Math.round(Number(info.total || 0) * 100) / 100,
      days_count: info.days.size,
    }));

    res.setHeader("Cache-Control", "private, max-age=30");
    return res.status(200).json({ data: rows });
  } catch (err) {
    return res.status(500).json({ error: "leaderboard failed" });
  }
};
