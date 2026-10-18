(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const isProjectPage = /\/projects\/?$/.test(
    window.location.pathname.replace(/\/+$/, "")
  ) || window.location.pathname.includes("/projects/");

  const baseURL = new URL(isProjectPage ? "../" : "./", location.href);

  const state = {
    sites: [],
    settings: {},
    query: ""
  };

  const resolveURL = (path) => new URL(path, baseURL).href;
  async function loadJSON(file) {
    const response = await fetch(resolveURL(file), {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`Could not load ${file} (${response.status})`);
    }

    return response.json();
  }

  function validWebURL(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function safeURL(value, fallback = "") {
    return validWebURL(value) ? value : fallback;
  }

  function setLink(element, url) {
    if (!element) return;

    const safe = safeURL(url);

    if (safe) {
      element.href = safe;
      element.hidden = false;
    } else {
      element.hidden = true;
      element.removeAttribute("href");
    }
  }

  function setupTheme() {
    const themeSettings = state.settings.theme || {};
    const toggle = $("#theme-toggle");
    const storageKey = "digital-space-theme";

    let saved = null;

    try {
      saved = localStorage.getItem(storageKey);
    } catch {
      // Storage may be unavailable in private browsing.
    }

    const defaultTheme = themeSettings.default || "system";
    function systemTheme() {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    function applyTheme(theme, persist = true) {
      const resolved = theme === "system" ? systemTheme() : theme;

      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      if (toggle) {
        const nextLabel = resolved === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode";

        toggle.setAttribute("aria-label", nextLabel);
        toggle.title = nextLabel;

        const icon = toggle.querySelector("svg");
        if (icon) {
          icon.innerHTML = resolved === "dark"
            ? '<path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"/>'
            : '<path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/>';
        }
      }

      const themeColor = document.querySelector(
        'meta[name="theme-color"]'
      );
      if (themeColor) {
        themeColor.content = resolved === "dark" ? "#14121a" : "#f7f5fc";
      }

      if (persist) {
        try {
          localStorage.setItem(storageKey, resolved);
        } catch {
          // The current page still works without saved storage.
        }
      }
    }

    const initialTheme = saved || defaultTheme;
    applyTheme(initialTheme, false);

    if (toggle && themeSettings.allowToggle !== false) {
      toggle.hidden = false;
      toggle.addEventListener("click", () => {
        const current = document.documentElement.dataset.theme;
        applyTheme(current === "dark" ? "light" : "dark");
      });
    } else if (toggle) {
      toggle.hidden = true;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    media.addEventListener?.("change", () => {
      let stored = null;

      try {
        stored = localStorage.getItem(storageKey);
      } catch {
        // Ignore storage errors.
      }
      if (!stored && defaultTheme === "system") {
        applyTheme("system", false);
      }
    });
  }

  function setupGlobalSettings() {
    const settings = state.settings;
    const title = settings.title || "My Digital Space";
    const owner = settings.owner || "Made with curiosity";

    document.title = isProjectPage
      ? `Project | ${title}`
      : title;

    const brand = $("#brand-name");
    if (brand) brand.textContent = title;
    const footerOwner = $("#footer-owner");
    if (footerOwner) footerOwner.textContent = owner;

    const year = $("#current-year");
    if (year) year.textContent = new Date().getFullYear();

    document.querySelectorAll(".github-link").forEach((link) => {
      setLink(link, settings.github);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
    const subtitle = $("#hero-subtitle");
    if (subtitle && settings.subtitle) {
      subtitle.textContent = settings.subtitle;
    }

    const heroTitle = $("#hero-title");
    if (heroTitle && settings.title) {
      heroTitle.replaceChildren(
        document.createTextNode("Welcome to "),
        Object.assign(document.createElement("span"), {
          className: "gradient-text",
          textContent: title + "."
        })
      );
    }
    const ownerElement = $("#project-owner");
    if (ownerElement) ownerElement.textContent = title;

    setupTheme();
  }

  function getFavicon(site) {
    const customIcon = safeURL(site.icon || "");

    if (customIcon) return customIcon;

    const siteURL = safeURL(site.url);

    if (!siteURL) return "";

    const faviconURL = new URL("https://www.google.com/s2/favicons/");
    faviconURL.searchParams.set("domain_url", siteURL);
    faviconURL.searchParams.set("sz", "128");
    return faviconURL.href;
  }

  function createIcon(site, className = "site-icon") {
    const container = document.createElement("span");
    container.className = className;

    const fallback = document.createElement("span");
    fallback.textContent = "✳";
    fallback.setAttribute("aria-hidden", "true");
    container.appendChild(fallback);

    const iconURL = getFavicon(site);

    if (!iconURL) return container;
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.src = iconURL;

    img.addEventListener("load", () => {
      fallback.remove();
    }, { once: true });

    img.addEventListener("error", () => {
      img.remove();
    }, { once: true });

    container.appendChild(img);

    return container;
  }

  function createCard(site, index) {
    const card = document.createElement("a");
    card.className = "site-card";

    // Keep the original flow: open this project's internal detail page first.
    card.href = resolveURL(
      `projects/?site=${encodeURIComponent(site.id)}`
    );

    card.style.animationDelay = `${Math.min(index * 65, 400)}ms`;
    card.setAttribute("aria-label", `View ${site.name}`);

    const top = document.createElement("div");
    top.className = "card-top";

    top.appendChild(createIcon(site));
    if (site.featured) {
      const badge = document.createElement("span");
      badge.className = "featured-badge";
      badge.textContent = "✦ Featured";
      top.appendChild(badge);
    }

    const copy = document.createElement("div");
    copy.className = "card-copy";

    const heading = document.createElement("h3");
    heading.textContent = site.name;

    const description = document.createElement("p");
    description.textContent = site.description || "Explore this project.";
    copy.append(heading, description);

    const bottom = document.createElement("div");
    bottom.className = "card-bottom";

    const category = document.createElement("span");
    category.className = "category-label";
    category.textContent = site.category || "PROJECT";

    const arrow = document.createElement("span");
    arrow.className = "card-arrow";
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");
    bottom.append(category, arrow);
    card.append(top, copy, bottom);

    return card;
  }

  function renderSites() {
    const grid = $("#site-grid");
    if (!grid) return;

    const query = state.query.trim().toLowerCase();

    const filtered = state.sites.filter((site) => {
      const searchable = [
        site.name,
        site.description,
        site.category,
        site.id
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    });

    grid.replaceChildren();
    filtered.forEach((site, index) => {
      grid.appendChild(createCard(site, index));
    });

    const empty = $("#empty-state");
    if (empty) empty.hidden = filtered.length !== 0;

    const count = $("#project-count");
    if (count) {
      count.textContent =
        `${state.sites.length} project${state.sites.length === 1 ? "" : "s"}`;
    }
    const collection = $("#collection-label");
    if (collection) {
      collection.textContent = query
        ? `${filtered.length} RESULTS`
        : "ALL PROJECTS";
    }
  }

  function setupSearch() {
    const search = $("#site-search");
    if (!search) return;

    search.addEventListener("input", () => {
      state.query = search.value;
      renderSites();
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        search.focus();
      }

      if (event.key === "Escape" && document.activeElement === search) {
        search.value = "";
        state.query = "";
        renderSites();
        search.blur();
      }
    });
  }

  function renderProject() {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get("site");

    const site = state.sites.find((item) => item.id === siteId);

    if (!site) {
      const heading = $("#project-title");
      const description = $("#project-description");
      if (heading) heading.textContent = "Project not found";
      if (description) {
        description.textContent =
          "This project could not be found. It may have been removed or renamed.";
      }

      const visit = $("#visit-project");
      if (visit) visit.hidden = true;

      const starCard = $("#star-card");
      if (starCard) starCard.hidden = true;

      document.title = "Project not found";
      return;
    }
    document.title = `${site.name} | ${state.settings.title || "My Digital Space"}`;

    const heading = $("#project-title");
    if (heading) heading.textContent = site.name;

    const description = $("#project-description");
    if (description) {
      description.textContent = site.description || "Explore this project.";
    }

    const category = $("#project-category");
    if (category) category.textContent = site.category || "WEB PROJECT";

    const frame = $("#project-icon-frame");
    if (frame) {
      const icon = createIcon(site, "project-icon-image");
      frame.replaceChildren();

      const image = icon.querySelector("img");

      if (image) {
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.padding = "17px";
        image.style.objectFit = "contain";
        frame.appendChild(image);
      } else {
        frame.textContent = "✳";
      }

      frame.setAttribute("aria-label", `${site.name} icon`);
    }

    const visit = $("#visit-project");
    const destination = safeURL(site.url);

    if (visit && destination) {
      setLink(visit, destination);
      visit.target = "_blank";
      visit.rel = "noopener noreferrer";
    } else if (visit) {
      visit.hidden = true;
    }

    const starSettings = state.settings.starButton || {};
    const starCard = $("#star-card");

    if (starCard) {
      // Each project's star button must point to that project's own repository.
      // The settings-level repoUrl remains a fallback for older site entries.
      const repoURL = safeURL(site.githubRepo || site.repoUrl || starSettings.repoUrl || "");
      starCard.hidden = starSettings.enabled === false || !repoURL;

      const starLink = $("#star-link");
      setLink(starLink, repoURL);

      if (starLink) {
        starLink.target = "_blank";
        starLink.rel = "noopener noreferrer";
        starLink.setAttribute("aria-label", `Star ${site.name} on GitHub`);
        const textNode = Array.from(starLink.childNodes).find(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        if (textNode) textNode.textContent = ` Star ${site.name} on GitHub`;
      }

      const message = $("#star-message");
      if (message && starSettings.text) {
        message.textContent = starSettings.text;
      }
    }
  }

  async function init() {
    try {
      const [settings, directory] = await Promise.all([
        loadJSON("settings.json"),
        loadJSON("sites.json")
      ]);

      state.settings = settings;
      state.sites = Array.isArray(directory.sites)
        ? directory.sites.filter((site) =>
            site &&
            typeof site.id === "string" &&
            typeof site.name === "string" &&
            validWebURL(site.url)
          )
        : [];

      setupGlobalSettings();
      if (isProjectPage) {
        renderProject();
      } else {
        const heroTitle = $("#hero-title");

        if (heroTitle) {
          heroTitle.replaceChildren(
            document.createTextNode("My little corner"),
            document.createElement("br")
          );

          const line = document.createElement("span");
          line.className = "gradient-text";
          line.textContent = "of the internet.";

          heroTitle.appendChild(line);
        }
        setupSearch();
        renderSites();
      }
    } catch (error) {
      console.error("Website hub initialization failed:", error);

      const grid = $("#site-grid");

      if (grid) {
        grid.textContent =
          "Could not load your projects. Please check sites.json, settings.json, and the browser console.";
      }

      const heading = $("#project-title");

      if (heading) heading.textContent = "Unable to load project";

      const description = $("#project-description");
      if (description) {
        description.textContent =
          "Please check that your JSON files are valid and available.";
      }
    }
  }

  init();
})();
