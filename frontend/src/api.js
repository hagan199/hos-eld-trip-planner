const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Debugging logs to help identify environment issues
console.log("Environment check:", {
  MODE: import.meta.env.MODE,
  HAS_API_URL: !!API_BASE,
});

if (!API_BASE) {
  console.error(
    "CRITICAL ERROR: VITE_API_BASE_URL is not defined used on Vercel. Requests will fail.",
  );
}

// Ensure no trailing slash to prevent double slashes (e.g. .com//api)
const cleanBase = (API_BASE || "http://localhost:8000").replace(/\/$/, "");

export async function planTrip(payload) {
  console.log(`Sending request to: ${cleanBase}/api/trips/plan`);

  const res = await fetch(`${cleanBase}/api/trips/plan`, {
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
