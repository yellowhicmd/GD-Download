(() => {
  "use strict";

  const STORAGE_KEY = "dash-lab-theme";
  const root = document.documentElement;

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme, savePreference = false) {
    root.dataset.theme = theme;

    const icon = document.getElementById("themeIcon");
    const button = document.getElementById("themeToggle");

    if (icon) {
      // Show the icon for switching to the opposite theme.
      icon.textContent = theme === "dark" ? "\u2600" : "\u263E";
    }

    if (button) {
      const label =
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(theme === "dark"));
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');

    if (themeColor) {
      themeColor.setAttribute(
        "content",
        theme === "dark" ? "#171923" : "#f5f7fc"
      );
    }

    if (savePreference) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (error) {
        // Theme switching still works if browser storage is unavailable.
      }
    }
  }

  let initialTheme;

  try {
    initialTheme = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    initialTheme = null;
  }

  if (initialTheme !== "light" && initialTheme !== "dark") {
    initialTheme = getSystemTheme();
  }

  applyTheme(initialTheme);

  const button = document.getElementById("themeToggle");

  if (button) {
    button.addEventListener("click", () => {
      const nextTheme =
        root.dataset.theme === "dark" ? "light" : "dark";

      applyTheme(nextTheme, true);
    });
  }
})();
