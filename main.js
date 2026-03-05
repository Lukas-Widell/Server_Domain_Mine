(function () {
  function enforceTopLevelPage() {
    if (window.top === window.self) return;
    document.documentElement.setAttribute("data-framed", "true");
    try {
      window.top.location = window.self.location.href;
    } catch {
      // Best-effort fallback when top navigation is blocked.
    }
  }

  enforceTopLevelPage();

  const toast = document.getElementById("toast");
  const lastUpdated = document.getElementById("lastUpdated");
  const utcPlusOneTime = document.getElementById("utcPlusOneTime");
  const emailLink = document.getElementById("emailLink");
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  let toastTimer = null;
  let resolvedEmail = "";
  const obfuscatedEmail = [
    103, 119, 128, 120, 113, 136, 123, 120, 106, 124, 116,
    113, 118, 132, 111, 106, 127, 61, 117, 142, 123, 114,
    114, 122, 118, 67, 73, 75, 70, 121, 109, 130, 133,
    130, 121, 111, 117, 58, 114, 129, 130
  ];

  function decodeEmail() {
    return obfuscatedEmail
      .map((value, i) => String.fromCharCode(value - ((i % 7) + 2) * 3))
      .join("");
  }

  function ensureEmailResolved() {
    if (resolvedEmail) return resolvedEmail;

    resolvedEmail = decodeEmail();

    return resolvedEmail;
  }

  function getEmailPrefix(full) {
    const at = full.indexOf("@");
    const local = at >= 0 ? full.slice(0, at) : full;
    return local.split(".")[0] || local;
  }

  function setEmailRevealPrompt() {
    if (!emailLink) return;
    const full = ensureEmailResolved();
    const prefix = getEmailPrefix(full);
    emailLink.textContent = prefix + ".[click to reveal email]";
    emailLink.setAttribute("data-email-state", "hidden");
    emailLink.setAttribute("aria-label", "Reveal email address");
  }

  function revealEmailRest() {
    if (!emailLink) return;
    const full = ensureEmailResolved();
    const prefix = getEmailPrefix(full);
    emailLink.textContent = prefix + full.slice(prefix.length);
    emailLink.setAttribute("data-email-state", "revealed");
    emailLink.setAttribute("aria-label", "Email address revealed");
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.className = "clipboard-helper";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);

    if (!ok) throw new Error("Copy failed");
  }

  async function copyEmailToClipboard() {
    const value = ensureEmailResolved();
    revealEmailRest();
    try {
      await copyText(value);
      showToast("Full email copied");
    } catch {
      showToast("Couldn't copy (try selecting manually)");
    }
  }

  function updateUtcPlusOneTime() {
    if (!utcPlusOneTime) return;
    const now = new Date();
    const utcPlusOne = new Date(now.getTime() + 60 * 60000);
    const hh = String(utcPlusOne.getUTCHours()).padStart(2, "0");
    const mm = String(utcPlusOne.getUTCMinutes()).padStart(2, "0");
    const ss = String(utcPlusOne.getUTCSeconds()).padStart(2, "0");
    utcPlusOneTime.textContent = hh + ":" + mm + ":" + ss;
  }

  function setLastUpdatedDate() {
    if (!lastUpdated) return;
    const declared = document.documentElement.getAttribute("data-last-updated") || "";
    const match = declared.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      lastUpdated.textContent = "--";
      return;
    }

    const yyyy = match[1];
    const mm = match[2];
    const dd = match[3];
    lastUpdated.textContent = yyyy + "/" + mm + "/" + dd;
    if (lastUpdated.tagName === "TIME") {
      lastUpdated.setAttribute("datetime", declared);
    }
  }

  if (emailLink) {
    emailLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (emailLink.getAttribute("data-email-state") === "hidden") {
        revealEmailRest();
        return;
      }
      showToast("Use Copy for full email");
    });
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", copyEmailToClipboard);
  }

  setLastUpdatedDate();
  setEmailRevealPrompt();
  if (utcPlusOneTime) {
    updateUtcPlusOneTime();
    setInterval(updateUtcPlusOneTime, 1000);
  }
})();
