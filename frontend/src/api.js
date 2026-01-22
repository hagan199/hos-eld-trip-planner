const rawApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const devDefaultBase = "http://localhost:8000";
const configuredBase = rawApiBase ? rawApiBase.replace(/\/$/, "") : undefined;

function resolveApiBase() {
  if (configuredBase) {
    return configuredBase;
  }

  if (import.meta.env.DEV) {
    return devDefaultBase;
  }

  const message =
    "Trip Planner API is not configured. Please redeploy with VITE_API_BASE_URL set.";
  console.error(message);
  throw new Error(message);
}

export async function planTrip(payload) {
  const apiBase = resolveApiBase();

  if (import.meta.env.DEV) {
    console.info(`Dispatching trip plan request to ${apiBase}/api/trips/plan`);
  }

  const res = await fetch(`${apiBase}/api/trips/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMessage = "Request failed";
    try {
      const errorData = await res.json();
      // If validation error (400), usually object with field keys
      if (typeof errorData === "object") {
        // Create a summary message from the validation errors
        errorMessage = Object.entries(errorData)
          .map(
            ([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
          )
          .join(" | ");
      } else {
        errorMessage =
          errorData.detail || errorData.message || JSON.stringify(errorData);
      }
    } catch (e) {
      errorMessage = res.statusText;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}
