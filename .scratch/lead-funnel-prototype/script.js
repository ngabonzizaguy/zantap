(() => {
  "use strict";

  const variants = [
    { key: "A", name: "Cinematic service" },
    { key: "B", name: "Editorial product" },
    { key: "C", name: "Founder offer" },
  ];

  const screenSteps = {
    store: {
      src: "../../public/brand/UI-screens/Screenshot%202026-07-10%20042351.png",
      alt: "ZanTap customer storefront",
      label: "Your storefront",
    },
    pay: {
      src: "../../public/brand/UI-screens/Screenshot%202026-07-10%20041629.png",
      alt: "ZanTap MoMo payment setup",
      label: "MoMo setup",
    },
    kitchen: {
      src: "../../public/brand/UI-screens/Screenshot%202026-07-10%20042559.png",
      alt: "ZanTap kitchen orders",
      label: "Kitchen orders",
    },
    live: {
      src: "../../public/brand/UI-screens/Screenshot%202026-07-10%20041901.png",
      alt: "ZanTap store live screen",
      label: "Store live",
    },
  };

  const leads = [
    ["Aline M.", "Imizi Kitchen", "Instagram", "NEW", "12 min ago"],
    ["Jean P.", "Kivu Table", "TikTok", "QUALIFIED", "42 min ago"],
    ["Claudine U.", "The Garden Room", "WhatsApp", "CONTACTED", "2 hrs ago"],
    ["Patrick N.", "Umusozi Grill", "Instagram", "CONVERTED", "Yesterday"],
    ["Diane I.", "Mwezi Café", "Facebook", "NEW", "Yesterday"],
    ["Eric K.", "Nyota Bistro", "X", "CONTACTED", "2 days ago"],
    ["Sandrine A.", "Ikawa House", "Instagram", "NEW", "3 days ago"],
    ["Olivier R.", "Kigali Social", "TikTok", "QUALIFIED", "3 days ago"],
  ].map(([name, business, source, status, received], index) => ({
    name,
    business,
    source,
    status,
    received,
    phone: `+250 788 000 ${String(index + 11).padStart(3, "0")}`,
    email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
    campaign: "Early partner",
  }));

  const body = document.body;
  const landingView = document.querySelector("#landing-view");
  const dashboardView = document.querySelector("#dashboard-view");
  const leadDialog = document.querySelector("#lead-dialog");
  const conceptName = document.querySelector("#concept-name");
  const menuToggle = document.querySelector(".menu-toggle");
  const masthead = document.querySelector(".masthead");
  const searchInput = document.querySelector("#lead-search");
  const leadTableBody = document.querySelector("#lead-table-body");

  const normalizeVariant = (value) => {
    const key = String(value || "A").toUpperCase();
    return variants.some((variant) => variant.key === key) ? key : "A";
  };

  const getVariant = () =>
    normalizeVariant(new URLSearchParams(window.location.search).get("variant"));

  function renderVariant(key, shouldScroll = true) {
    const variant = variants.find((item) => item.key === normalizeVariant(key)) || variants[0];
    body.dataset.variant = variant.key;
    conceptName.textContent = `${variant.key} — ${variant.name}`;
    document.title = `ZanTap — ${variant.name}`;
    if (shouldScroll && body.dataset.view !== "dashboard") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }

  function setVariant(key) {
    const normalized = normalizeVariant(key);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", normalized);
    window.history.pushState({}, "", url);
    renderVariant(normalized);
  }

  function cycleVariant(direction) {
    const currentIndex = variants.findIndex(({ key }) => key === getVariant());
    setVariant(variants[(currentIndex + direction + variants.length) % variants.length].key);
  }

  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => cycleVariant(Number(button.dataset.direction)));
  });

  window.addEventListener("popstate", () => renderVariant(getVariant(), false));
  document.addEventListener("keydown", (event) => {
    const typing = document.activeElement?.matches("input, textarea, select, [contenteditable=true]");
    if (typing || body.dataset.view === "dashboard" || leadDialog.open) return;
    if (event.key === "ArrowLeft") cycleVariant(-1);
    if (event.key === "ArrowRight") cycleVariant(1);
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = masthead.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  const sectionIds = {
    A: { how: "how", offer: "offer" },
    B: { how: "how-b", offer: "offer-b" },
    C: { how: "how-c", offer: "offer-c" },
  };

  document.querySelectorAll('.masthead a[href^="#"], .concept a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const requested = link.getAttribute("href").slice(1);
      const mapped = sectionIds[getVariant()]?.[requested] || requested;
      const target = document.getElementById(mapped);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      masthead.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-open-lead]").forEach((button) => {
    button.addEventListener("click", () => {
      leadDialog.querySelector("form")?.classList.remove("is-success");
      leadDialog.showModal();
    });
  });

  document.querySelector(".dialog-close").addEventListener("click", () => leadDialog.close());
  leadDialog.addEventListener("click", (event) => {
    if (event.target === leadDialog) leadDialog.close();
  });

  function setView(view) {
    const isDashboard = view === "dashboard";
    body.dataset.view = isDashboard ? "dashboard" : "landing";
    landingView.hidden = isDashboard;
    dashboardView.hidden = !isDashboard;
    if (isDashboard) renderDashboard();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.querySelectorAll("[data-open-dashboard]").forEach((button) => {
    button.addEventListener("click", () => setView("dashboard"));
  });
  document.querySelectorAll("[data-close-dashboard]").forEach((button) => {
    button.addEventListener("click", () => setView("landing"));
  });

  document.querySelectorAll("[data-screen-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const screen = screenSteps[button.dataset.screenStep];
      if (!screen || button.classList.contains("is-active")) return;
      document.querySelectorAll("[data-screen-step]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-selected", String(item === button));
      });
      const device = document.querySelector(".device--flow");
      const image = document.querySelector("#flow-screen");
      device.classList.add("is-changing");
      window.setTimeout(() => {
        image.src = screen.src;
        image.alt = screen.alt;
        document.querySelector("#flow-screen-label").textContent = screen.label;
        device.classList.remove("is-changing");
      }, 170);
    });
  });

  document.querySelectorAll("[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      leads.unshift({
        name: String(data.get("name") || "New lead"),
        business: String(data.get("business") || "Restaurant"),
        phone: String(data.get("phone") || ""),
        email: "WhatsApp preferred",
        source: new URLSearchParams(window.location.search).get("utm_source") || `Concept ${getVariant()}`,
        campaign: "Free setup",
        status: "NEW",
        received: "Just now",
      });
      form.classList.add("is-success");
      renderDashboard();
    });
  });

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function renderDashboard() {
    const query = searchInput.value.trim().toLowerCase();
    const visible = leads.filter((lead) =>
      `${lead.name} ${lead.business} ${lead.source} ${lead.status}`.toLowerCase().includes(query),
    );
    leadTableBody.innerHTML = visible
      .map(
        (lead) => `<tr>
          <td><div class="person-cell"><i>${escapeHtml(lead.name.slice(0, 1))}</i><div><strong>${escapeHtml(lead.name)}</strong><small>${escapeHtml(lead.email)}</small></div></div></td>
          <td>${escapeHtml(lead.business)}</td>
          <td><span class="source-pill">${escapeHtml(lead.source)}</span></td>
          <td><span class="lead-status lead-status--${lead.status.toLowerCase()}">${escapeHtml(lead.status.charAt(0) + lead.status.slice(1).toLowerCase())}</span></td>
          <td>${escapeHtml(lead.received)}</td>
        </tr>`,
      )
      .join("");
    if (!visible.length) {
      leadTableBody.innerHTML = '<tr><td colspan="5" class="empty-row">No leads match your search.</td></tr>';
    }
    const count = (status) => leads.filter((lead) => lead.status === status).length;
    document.querySelector("#metric-total").textContent = String(leads.length);
    document.querySelector("#metric-new").textContent = String(count("NEW"));
    document.querySelector("#metric-qualified").textContent = String(count("QUALIFIED"));
    document.querySelector("#metric-converted").textContent = String(count("CONVERTED"));
  }

  searchInput.addEventListener("input", renderDashboard);
  document.querySelector("#export-leads").addEventListener("click", () => {
    const rows = [
      ["Name", "Restaurant", "Phone", "Email", "Source", "Campaign", "Status"],
      ...leads.map((lead) => [lead.name, lead.business, lead.phone, lead.email, lead.source, lead.campaign, lead.status]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "zantap-leads-prototype.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  function startThreeStage() {
    const canvas = document.querySelector(".b-stage__canvas");
    if (!canvas || !window.THREE || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.z = 7;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const group = new THREE.Group();
    scene.add(group);
    [
      [2.4, 0.018, 0xf2a64a, 0.42],
      [1.85, 0.012, 0xffffff, 0.52],
      [1.2, 0.009, 0x222222, 0.18],
    ].forEach(([radius, tube, color, opacity], index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 8, 160),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity }),
      );
      ring.rotation.x = 1.05 + index * 0.14;
      ring.rotation.z = -0.34 + index * 0.27;
      group.add(ring);
    });

    const points = new Float32Array(90 * 3);
    for (let index = 0; index < points.length; index += 3) {
      const radius = 1.4 + Math.random() * 2.3;
      const angle = Math.random() * Math.PI * 2;
      points[index] = Math.cos(angle) * radius;
      points[index + 1] = Math.sin(angle) * radius * 0.55;
      points[index + 2] = (Math.random() - 0.5) * 1.4;
    }
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
    group.add(
      new THREE.Points(
        pointGeometry,
        new THREE.PointsMaterial({ color: 0x1f1d1a, size: 0.025, transparent: true, opacity: 0.38 }),
      ),
    );

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / Math.max(bounds.height, 1);
      camera.updateProjectionMatrix();
    }
    function animate(time) {
      group.rotation.z = Math.sin(time * 0.00025) * 0.08;
      group.rotation.y = time * 0.000035;
      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.requestAnimationFrame(animate);
  }

  body.dataset.view = "landing";
  renderVariant(getVariant(), false);
  renderDashboard();
  startThreeStage();
})();
