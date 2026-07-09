(function () {
  const KEY = "vecnode-theme";
  const stored = localStorage.getItem(KEY);
  const initial = stored || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.setAttribute("data-theme", initial);

  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.createElement("button");
    btn.id = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle theme");
    btn.textContent = document.documentElement.getAttribute("data-theme") === "light" ? "☀" : "☽";

    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(KEY, next);
      btn.textContent = next === "light" ? "☀" : "☽";
    });

    document.body.appendChild(btn);
  });
})();
