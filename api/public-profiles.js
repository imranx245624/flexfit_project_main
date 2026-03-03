const { createClient } = require("@supabase/supabase-js");

const parseIds = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
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

  let ids = [];
  if (req.method === "GET") {
    ids = parseIds(req.query?.ids);
  } else {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    ids = parseIds(body?.ids || body?.userIds);
  }

  if (!ids.length) {
    return res.status(400).json({ error: "ids required" });
  }

  if (ids.length > 100) {
    ids = ids.slice(0, 100);
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("id", ids);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).json({ data: data || [] });
  } catch (err) {
    return res.status(500).json({ error: "public-profiles failed" });
  }
};
