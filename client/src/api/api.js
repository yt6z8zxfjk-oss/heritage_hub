const getScoped = ["/attractions", "/stories", "/trips", "/guides", "/districts", "/messages"];
const postScoped = ["/attractions", "/stories", "/trips", "/guides", "/messages", "/assistant/plan", "/assistant/describe"];

function withOblast(path, options) {
  const oblast = localStorage.getItem("heritage-oblast") || "gomel";
  const method = String(options.method || "GET").toUpperCase();
  const bare = path.split("?")[0];
  let nextPath = path;
  let body = options.body;
  if (method === "GET" && getScoped.includes(bare) && !path.includes("oblast=")) {
    nextPath += `${path.includes("?") ? "&" : "?"}oblast=${oblast}`;
  }
  if (method === "POST" && postScoped.includes(bare) && typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && !parsed.oblast) {
        parsed.oblast = oblast;
        body = JSON.stringify(parsed);
      }
    } catch {
      body = options.body;
    }
  }
  return { path: nextPath, body };
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = localStorage.getItem("heritage-token");
  const scoped = withOblast(path, options);
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`/api${scoped.path}`, { ...options, body: scoped.body, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Ошибка запроса");
    error.status = response.status;
    throw error;
  }
  return data;
}
