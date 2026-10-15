(() => {
  "use strict";

  // Fade content in as it enters the viewport, while respecting reduced-motion settings.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".reveal");

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          activeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  }

  // Animate the abstract hero artwork gently with pointer movement.
  const stage = document.querySelector(".visual-stage");
  if (stage && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    stage.addEventListener("pointermove", (event) => {
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      stage.style.setProperty("--tilt-x", `${(y * -4).toFixed(2)}deg`);
      stage.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
    });
    stage.addEventListener("pointerleave", () => {
      stage.style.setProperty("--tilt-x", "0deg");
      stage.style.setProperty("--tilt-y", "0deg");
    });
  }

  // Download links are configured separately so they are easy to change without editing this script.
  const links = window.DOWNLOAD_LINKS || {};
  const toast = document.querySelector("#toast");
  let toastTimeout;

  function showToast(message) {
    if (!toast) {
      window.alert(message);
      return;
    }
    toast.textContent = message;
    toast.classList.add("is-shown");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("is-shown"), 3600);
  }

  document.querySelectorAll("[data-download]").forEach((button) => {
    const key = button.getAttribute("data-download");
    const url = typeof links[key] === "string" ? links[key].trim() : "";

    if (url && /^https?:\/\//i.test(url)) {
      button.href = url;
      button.setAttribute("rel", "noopener noreferrer");
    }

    button.addEventListener("click", (event) => {
      const configuredUrl = typeof links[key] === "string" ? links[key].trim() : "";
      if (!/^https?:\/\//i.test(configuredUrl)) {
        event.preventDefault();
        const platform = key === "pc" ? "PC" : "mobile";
        showToast(`Add your ${platform} download URL on line ${key === "pc" ? "3" : "4"} of download-config.js first.`);
      }
    });
  });
})();
