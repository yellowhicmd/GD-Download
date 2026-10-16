(() => {
  "use strict";

  // Shared theme preference for the homepage and downloads page.
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
      // Show the option to switch to the opposite theme.
      icon.textContent = theme === "dark" ? "☀" : "☾";
    }

    if (button) {
      button.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );

      button.setAttribute(
        "title",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );

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
        // The theme still works for this page if storage is unavailable.
      }
    }
  }

  // Initialize using the saved choice, or the device preference.
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

  // Connect the theme button without interfering with script.js.
  const button = document.getElementById("themeToggle");

  if (button) {
    button.addEventListener("click", () => {
      const nextTheme =
        root.dataset.theme === "dark" ? "light" : "dark";

      applyTheme(nextTheme, true);
    });
  }
})();
