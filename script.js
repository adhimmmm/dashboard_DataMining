// ==========================================
// INTEGRASI API PREDIKSI
// ==========================================
document.getElementById("btnPredict")?.addEventListener("click", async () => {
  const hasilEl = document.getElementById("hasilPrediksi");
  hasilEl.innerText = "Memproses Model...";
  hasilEl.style.color = "var(--text)";

  // Tarik angka dari input formulir
  const inputData = {
    crop_type: parseFloat(document.getElementById("inp_crop").value),
    avg_temperature_C: parseFloat(document.getElementById("inp_temp").value),
    humidity_percent: parseFloat(document.getElementById("inp_hum").value),
    co2_ppm: parseFloat(document.getElementById("inp_co2").value),
    light_intensity_lux: parseFloat(document.getElementById("inp_lux").value),
    irrigation_mm: parseFloat(document.getElementById("inp_irr").value),
    fertilizer_N_kg_ha: parseFloat(document.getElementById("inp_n").value),
    fertilizer_P_kg_ha: parseFloat(document.getElementById("inp_p").value),
    fertilizer_K_kg_ha: parseFloat(document.getElementById("inp_k").value),
    soil_pH: parseFloat(document.getElementById("inp_ph").value),
    pest_severity: parseFloat(document.getElementById("inp_pest").value),
  };

  try {
    // Tembak ke Backend Flask
    const response = await fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputData),
    });

    const result = await response.json();

    if (result.status === "success") {
      hasilEl.innerText = result.prediksi;
      hasilEl.style.color = result.prediksi.includes("Tinggi") ? "var(--accent)" : "var(--danger)";
    } else {
      hasilEl.innerText = "Error Model: " + result.message;
      hasilEl.style.color = "var(--danger)";
    }
  } catch (err) {
    hasilEl.innerText = "Koneksi Gagal. Pastikan server app.py menyala!";
    hasilEl.style.color = "var(--danger)";
  }
});

/* ============================================================
   GreenMine Dashboard — dashboard.js
   Functional Programming Edition
   ============================================================ */

// ═══════════════════════════════════════════════════════════
// DATA LAYER  (pure data, zero side-effects)
// ═══════════════════════════════════════════════════════════

const DATA = {
  kpis: [
    { icon: "🏆", value: 88.77, unit: "%", label: "Best Accuracy", sub: "Random Forest", counter: true },
    { icon: "📊", value: 10890, unit: "", label: "Total Data", sub: "Setelah SMOTE", counter: true },
    { icon: "🌱", value: 11, unit: "", label: "Fitur Prediktor", sub: "Setelah RFE", counter: false },
    { icon: "⚗️", value: 3, unit: "", label: "Algoritma Diuji", sub: "Hold-out 80/20", counter: false },
  ],

  models: {
    labels: ["Naïve Bayes", "Decision Tree", "Random Forest"],
    accuracy: [78.28, 88.24, 88.77],
    precision: [74.61, 84.35, 87.06],
    recall: [80.97, 91.8, 89.17],
    f1: [77.66, 87.92, 88.1],
  },

  metrics: [
    { key: "accuracy", label: "Accuracy", color: "rgba(108,240,112,", border: "rgba(108,240,112,1)" },
    { key: "precision", label: "Precision", color: "rgba(56,217,123,", border: "rgba(56,217,123,1)" },
    { key: "recall", label: "Recall", color: "rgba(96,200,240,", border: "rgba(96,200,240,1)" },
    { key: "f1", label: "F1-Score", color: "rgba(240,201,58,", border: "rgba(240,201,58,1)" },
  ],

  missing: {
    attrs: ["avg_temp_C", "min_temp_C", "max_temp_C", "humidity%", "co2_ppm", "light_lux", "fert_N", "fert_P", "fert_K", "pest_sev", "soil_pH"],
    counts: [542, 542, 542, 542, 573, 542, 1058, 1058, 1058, 124, 302],
    pct: [5.21, 5.21, 5.21, 5.21, 5.51, 5.21, 10.17, 10.17, 10.17, 1.19, 2.9],
  },

  features: [
    { name: "Yield_Status", cat: "Target", status: "target", desc: "Variabel utama yang diprediksi (Tinggi/Rendah)" },
    { name: "crop_type", cat: "Tanaman", status: "kept", desc: "Jenis komoditas → root node pada Decision Tree" },
    { name: "avg_temperature_C", cat: "Iklim Mikro", status: "kept", desc: "Suhu rata-rata harian di greenhouse (°C)" },
    { name: "humidity_percent", cat: "Iklim Mikro", status: "kept", desc: "Kelembaban udara harian (%)" },
    { name: "co2_ppm", cat: "Iklim Mikro", status: "kept", desc: "Konsentrasi CO₂ (ppm)" },
    { name: "light_intensity_lux", cat: "Iklim Mikro", status: "kept", desc: "Intensitas cahaya harian (lux)" },
    { name: "irrigation_mm", cat: "Pengairan", status: "kept", desc: "Volume irigasi yang diberikan (mm)" },
    { name: "fertilizer_N_kg_ha", cat: "Pemupukan", status: "kept", desc: "Dosis Nitrogen — importance tertinggi" },
    { name: "fertilizer_P_kg_ha", cat: "Pemupukan", status: "kept", desc: "Dosis Fosfor — fase generatif & akar" },
    { name: "fertilizer_K_kg_ha", cat: "Pemupukan", status: "kept", desc: "Dosis Kalium — ketahanan stres tanaman" },
    { name: "soil_pH", cat: "Tanah", status: "kept", desc: "Keasaman media tanam → efisiensi serapan NPK" },
    { name: "pest_severity", cat: "Kesehatan", status: "kept", desc: "Tingkat serangan hama (skala)" },
    { name: "greenhouse_id", cat: "Metadata", status: "drop", desc: "ID administratif → dihapus" },
    { name: "planting_date", cat: "Metadata", status: "drop", desc: "Tanggal tanam → dihapus" },
    { name: "days_to_maturity", cat: "Metadata", status: "drop", desc: "Durasi panen → dihapus (redundan)" },
    { name: "min_temperature_C", cat: "Redundan", status: "drop", desc: "Multikolinear dengan avg_temperature_C" },
    { name: "max_temperature_C", cat: "Redundan", status: "drop", desc: "Multikolinear dengan avg_temperature_C" },
  ],

  encodings: [
    { label: "Cucumber", code: 0 },
    { label: "Lettuce", code: 1 },
    { label: "Pepper", code: 2 },
    { label: "Tomato", code: 3 },
  ],

  sampleData: [
    { crop: 3, temp: 0.794, hum: 0.5, co2: 0.668, lux: 0.227, irr: 0.704, N: 0.512, P: 0.484, K: 0.435, ph: 0.367, pest: 0.217, y: 0 },
    { crop: 0, temp: 0.645, hum: 0.636, co2: 0.509, lux: 0.432, irr: 0.656, N: 0.553, P: 0.571, K: 0.271, ph: 0.433, pest: 0.493, y: 0 },
    { crop: 3, temp: 0.621, hum: 0.557, co2: 0.555, lux: 0.49, irr: 0.48, N: 0.906, P: 0.374, K: 0.959, ph: 0.333, pest: 0.203, y: 1 },
    { crop: 3, temp: 0.752, hum: 0.547, co2: 0.425, lux: 0.741, irr: 0.352, N: 0.512, P: 0.363, K: 0.906, ph: 0.333, pest: 0.145, y: 1 },
    { crop: 0, temp: 0.631, hum: 0.428, co2: 0.673, lux: 0.332, irr: 0.592, N: 0.129, P: 0.747, K: 0.547, ph: 0.8, pest: 0.188, y: 0 },
  ],

  cropMap: { 0: "Cucumber", 1: "Lettuce", 2: "Pepper", 3: "Tomato" },

  pipeline: [
    { num: "01", title: "Hapus Duplikat", desc: "200 baris identik dihapus untuk mencegah bias komputasi pada seluruh tahap pelatihan model." },
    { num: "02", title: "Imputasi Median", desc: "Nilai kosong (missing values) diisi menggunakan nilai median kolom agar distribusi stabil tanpa terpengaruh outlier." },
    { num: "03", title: "Hapus Metadata", desc: "Kolom greenhouse_id, planting_date, dan harvest_date dieliminasi karena tidak memiliki nilai prediktif biologis." },
    { num: "04", title: "Label Encoding", desc: "crop_type dikonversi ke integer: Cucumber=0, Lettuce=1, Pepper=2, Tomato=3 agar kompatibel dengan algoritma ML." },
    { num: "05", title: "Diskritisasi", desc: "yield_kg/m² diubah ke Yield_Status (Tinggi=1 / Rendah=0) dengan ambang batas nilai rata-rata populasi = 12.38." },
    { num: "06", title: "SMOTE Balancing", desc: "Kelas Tinggi (4.755) diseimbangkan ke 5.445 melalui Synthetic Minority Over-sampling Technique untuk menghilangkan bias kelas." },
    { num: "07", title: "Normalisasi", desc: "Min-Max Scaling diterapkan pada semua prediktor numerik ke range [0,1] agar tidak ada fitur yang mendominasi." },
    { num: "08", title: "RFE Selection", desc: "Recursive Feature Elimination dengan estimator Random Forest memilih 11 fitur terbaik secara iteratif." },
  ],

  featureImportance: [
    { name: "crop_type", cat: "Tanaman", w: 100 },
    { name: "irrigation_mm", cat: "Pengairan", w: 97 },
    { name: "light_intensity_lux", cat: "Iklim Mikro", w: 95 },
    { name: "fertilizer_N_kg_ha", cat: "Pemupukan", w: 92 },
    { name: "avg_temperature_C", cat: "Iklim Mikro", w: 89 },
    { name: "co2_ppm", cat: "Iklim Mikro", w: 86 },
    { name: "humidity_percent", cat: "Iklim Mikro", w: 83 },
    { name: "fertilizer_P_kg_ha", cat: "Pemupukan", w: 80 },
    { name: "fertilizer_K_kg_ha", cat: "Pemupukan", w: 78 },
    { name: "soil_pH", cat: "Tanah", w: 75 },
    { name: "pest_severity", cat: "Kesehatan", w: 72 },
  ],

  confusionMatrices: [
    { model: "Naïve Bayes", acc: "78.28%", prec: "74.61%", rec: "80.97%", f1: "77.66%", tp: 923, fp: 314, fn: 162, tn: 779 },
    { model: "Decision Tree", acc: "88.24%", prec: "84.35%", rec: "91.80%", f1: "87.92%", tp: 1047, fp: 195, fn: 62, tn: 874 },
    { model: "Random Forest", acc: "88.77%", prec: "87.06%", rec: "89.17%", f1: "88.10%", tp: 1018, fp: 151, fn: 93, tn: 916 },
  ],

  dtRules: [
    { title: "Root Split", text: "Akar utama: <code>crop_type ≤ 2.5</code>. Jenis komoditas adalah pemisah fundamental sebelum variabel lingkungan lain dinilai." },
    { title: "Jalur Kanan (crop > 2.5)", text: "Jika <code>irrigation_mm > 0.591</code> → prediksi <strong>Tinggi</strong> secara konsisten. Ketergantungan kritis pada suplai air." },
    { title: "Jalur Kiri (crop ≤ 2.5)", text: "Percabangan kompleks: <code>light_intensity_lux</code> menjadi penentu akhir. Cahaya dapat mengkompensasi kekurangan nutrisi." },
  ],

  errors: [
    {
      id: "FP-1 · Baris 3905",
      type: "fp",
      actual: "Rendah",
      pred: "Tinggi",
      feat: "Suhu: 0.70 · Irigasi: 0.63 · Hama: 0.60 ⚠️",
      analysis: "Model yakin panen tinggi karena suhu & irigasi ideal. Gagal menghukum hama (0.60) yang pada kenyataannya menghancurkan seluruh potensi hasil panen.",
    },
    {
      id: "FP-2 · Baris 1849",
      type: "fp",
      actual: "Rendah",
      pred: "Tinggi",
      feat: "Pupuk N: 0.82 · P: 0.78 · pH Tanah: 0.26 ⚠️",
      analysis: "Suplai pupuk sangat melimpah, namun pH sangat asam (0.26) menyebabkan nutrient lockout — akar tidak mampu menyerap pupuk sehingga hasil aktualnya rendah.",
    },
    {
      id: "FN-1 · Baris 1625",
      type: "fn",
      actual: "Tinggi",
      pred: "Rendah",
      feat: "Suhu: 0.20 · NPK: ~0.30 · Cahaya: 0.76 ✓",
      analysis: "Model pesimis akibat suhu dingin & nutrisi rendah. Faktanya intensitas cahaya (0.76) dan CO₂ tinggi berhasil mengkompensasi suhu, memaksimalkan laju fotosintesis.",
    },
    {
      id: "FN-2 · Baris 3501",
      type: "fn",
      actual: "Tinggi",
      pred: "Rendah",
      feat: "Suhu: 0.36 · CO₂: 0.34 · Hama: 0.02 ✓",
      analysis: "Iklim sub-optimal membuat model pesimis. Namun hama nol (0.02) — kondisi steril sempurna — memungkinkan tanaman berproduksi maksimal meski iklim biasa saja.",
    },
  ],

  bva: [
    { aspect: "Fokus Pemupukan", before: "Takaran N, P, K diberikan merata (1:1:1) tanpa prioritas khusus.", after: "<strong>Fokus Nitrogen (N):</strong> Prioritaskan N karena paling sensitif terhadap perubahan status panen." },
    { aspect: "Manajemen Air", before: "Irigasi dijadwalkan rutin berdasarkan waktu (pagi & sore).", after: "<strong>Irigasi Ambang Batas:</strong> Jaga volume di atas indeks <strong>0.591</strong> untuk komoditas tertentu." },
    {
      aspect: "Kontrol Hama",
      before: "Penanganan hama hanya dilakukan saat serangan terlihat secara visual atau sudah parah.",
      after: "<strong>Intervensi Dini:</strong> Peringatan otomatis jika indeks hama ≥ <strong>0.529</strong> sebelum kerusakan fatal.",
    },
    {
      aspect: "Efisiensi Biaya",
      before: "Semua variabel dimaksimalkan bersamaan → biaya energi dan operasional tinggi.",
      after: "<strong>Efisiensi Terukur:</strong> Optimalkan cahaya & irigasi sebagai variabel kunci; suhu tidak harus selalu dimaksimalkan.",
    },
  ],

  rules: [
    {
      type: "ATURAN PANEN MAKSIMAL",
      color: "green",
      title: "Irigasi di Atas Ambang Batas",
      body: "JIKA <code>crop_type > 2.5</code> (Tomato) DAN <code>irrigation_mm > 0.591</code>, MAKA status panen diprediksi <strong>Tinggi</strong> secara konsisten.",
    },
    {
      type: "ATURAN KOMPENSASI",
      color: "yellow",
      title: "Cahaya Mengkompensasi Nutrisi",
      body: "JIKA <code>crop_type ≤ 2.5</code>, model bergantung pada <code>light_intensity_lux</code>. Cahaya buatan dapat menggantikan kekurangan suplai nutrisi minimal.",
    },
    {
      type: "ATURAN TOLERANSI HAMA",
      color: "red",
      title: "Batas Kritis Pest Severity",
      body: "JIKA <code>pest_severity ≥ 0.529</code>, model memprediksi <strong>Rendah</strong> otomatis. Kondisi iklim ideal apapun tidak dapat menyelamatkan panen.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════
// PURE UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

const $ = (id) => document.getElementById(id);
const el = (tag, cls, html = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};
const appendAll = (parent, children) => children.forEach((c) => parent.appendChild(c));
const setHTML = (id, html) => {
  const e = $(id);
  if (e) e.innerHTML = html;
};

// functional counter animation
const animateCounter = (domEl, target, isFloat) => {
  const step = target / 60;
  let val = 0;
  const tick = () => {
    val = Math.min(val + step, target);
    domEl.textContent = isFloat ? val.toFixed(2) : Math.floor(val).toLocaleString("id-ID");
    if (val < target) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

// tooltip helpers
const showTooltip = (e, text) => {
  const t = $("tooltip");
  t.innerHTML = text;
  t.classList.add("show");
  moveTooltip(e);
};
const hideTooltip = () => $("tooltip").classList.remove("show");
const moveTooltip = (e) => {
  const t = $("tooltip");
  t.style.left = e.clientX + 14 + "px";
  t.style.top = e.clientY - 10 + "px";
};

// Chart.js shared options builder
const makeChartOpts = (extra = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 700, easing: "easeOutQuart" },
  ...extra,
});

// ═══════════════════════════════════════════════════════════
// RENDER FUNCTIONS — each is pure: takes data, writes DOM
// ═══════════════════════════════════════════════════════════

// ── KPI Grid ──
const renderKPIs = (kpis) => {
  const grid = $("kpiGrid");
  if (!grid) return;
  const cards = kpis.map((k) => {
    const card = el("div", "kpi-card");
    const valEl = el("span", "kpi-value");
    valEl.textContent = k.counter ? (Number.isInteger(k.value) ? "0" : "0.00") : k.value;
    card.innerHTML = `<div class="kpi-icon">${k.icon}</div>`;
    card.appendChild(valEl);
    card.insertAdjacentHTML("beforeend", `<span class="kpi-unit">${k.unit}</span><div class="kpi-label">${k.label}<br><span>${k.sub}</span></div>`);
    if (k.counter) setTimeout(() => animateCounter(valEl, k.value, !Number.isInteger(k.value)), 200);
    return card;
  });
  appendAll(grid, cards);
};

// ── Feature Table with filter ──
const statusHTML = { kept: '<span class="status-kept">✓ Terpilih</span>', target: '<span class="status-target">⭐ Target</span>', drop: '<span class="status-drop">✕ Dihapus</span>' };

const renderFeatureTable = (features, filter = "all") => {
  const shown = filter === "all" ? features : features.filter((f) => f.status === filter);
  setHTML(
    "featureTableBody",
    shown
      .map(
        (f, i) => `
    <tr>
      <td class="hl">${i + 1}</td>
      <td class="hl">${f.name}</td>
      <td><span class="cat-tag">${f.cat}</span></td>
      <td>${statusHTML[f.status]}</td>
      <td>${f.desc}</td>
    </tr>`,
      )
      .join(""),
  );
};

const renderFeatureFilter = (features) => {
  const wrap = $("featureFilter");
  if (!wrap) return;
  const filters = [
    { key: "all", label: "Semua" },
    { key: "kept", label: "✓ Terpilih" },
    { key: "target", label: "⭐ Target" },
    { key: "drop", label: "✕ Dihapus" },
  ];
  appendAll(
    wrap,
    filters.map((f) => {
      const btn = el("button", `filter-tab${f.key === "all" ? " active" : ""}`, f.label);
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".filter-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderFeatureTable(features, f.key);
      });
      return btn;
    }),
  );
  renderFeatureTable(features, "all");
};

// ── Sample Data Table ──
const renderSampleData = (data, cropMap) => {
  setHTML(
    "sampleDataBody",
    data
      .map((r) => {
        const cls = r.y === 1 ? "hl" : "dn";
        return `<tr>
      <td class="hl">${cropMap[r.crop]} (${r.crop})</td>
      <td>${r.temp}</td><td>${r.hum}</td><td>${r.co2}</td><td>${r.lux}</td>
      <td>${r.irr}</td><td>${r.N}</td><td>${r.P}</td><td>${r.K}</td>
      <td>${r.ph}</td><td>${r.pest}</td>
      <td class="${cls}">${r.y === 1 ? "1 — Tinggi" : "0 — Rendah"}</td>
    </tr>`;
      })
      .join(""),
  );
};

// ── Encoding Table ──
const badgeColor = (code) => ["badge-green", "badge-yellow", "badge-yellow", "badge-red"][code] || "badge-green";
const renderEncodings = (encodings) => {
  setHTML("encodingTable", encodings.map((e) => `<tr><td>${e.label}</td><td><span class="badge ${badgeColor(e.code)}">${e.code}</span></td></tr>`).join(""));
};

// ── Pipeline ──
const renderPipeline = (steps) => {
  const wrap = $("pipelineSteps");
  const detail = $("pipelineDetail");
  if (!wrap || !detail) return;
  let active = -1;
  appendAll(
    wrap,
    steps.map((s, i) => {
      const div = el("div", "pipe-step");
      div.innerHTML = `<span class="sn">STEP ${s.num}</span><span class="st">${s.title}</span>`;
      div.addEventListener("click", () => {
        if (active === i) {
          div.classList.remove("active");
          detail.classList.add("hidden");
          active = -1;
          return;
        }
        wrap.querySelectorAll(".pipe-step").forEach((p) => p.classList.remove("active"));
        div.classList.add("active");
        detail.innerHTML = `<strong>${s.title}:</strong> ${s.desc}`;
        detail.classList.remove("hidden");
        active = i;
      });
      return div;
    }),
  );
};

// ── Confusion Matrix with selector ──
const cmCellHTML = (n, lbl, cls) => `<div class="cm-cell ${cls}"><span class="cm-num">${n}</span><span class="cm-lbl">${lbl}</span></div>`;
const cmBoxHTML = (m) => `
  <div class="cm-box" data-model="${m.model}">
    <div class="cm-title"><strong>${m.model}</strong><br>Acc: ${m.acc} · P: ${m.prec} · R: ${m.rec} · F1: ${m.f1}</div>
    <div class="cm-matrix">
      ${cmCellHTML(m.tp, "TP", "cm-tp")}${cmCellHTML(m.fp, "FP", "cm-fp")}
      ${cmCellHTML(m.fn, "FN", "cm-fn")}${cmCellHTML(m.tn, "TN", "cm-tn")}
    </div>
    <div class="cm-acc">Accuracy: <strong>${m.acc}</strong></div>
  </div>`;

const renderConfusionMatrices = (matrices) => {
  setHTML("confusionMatrices", matrices.map(cmBoxHTML).join(""));
  const sel = $("cmSelector");
  if (!sel) return;
  const allBtn = el("button", "cm-btn active", "Semua");
  allBtn.addEventListener("click", () => {
    sel.querySelectorAll(".cm-btn").forEach((b) => b.classList.remove("active"));
    allBtn.classList.add("active");
    document.querySelectorAll(".cm-box").forEach((b) => b.classList.remove("hidden"));
  });
  sel.appendChild(allBtn);
  matrices.forEach((m) => {
    const btn = el("button", "cm-btn", m.model);
    btn.addEventListener("click", () => {
      sel.querySelectorAll(".cm-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".cm-box").forEach((b) => b.classList.toggle("hidden", b.dataset.model !== m.model));
    });
    sel.appendChild(btn);
  });
};

// ── Feature Importance ──
const renderFeatureImportance = (features) => {
  const grid = $("featureImportanceGrid");
  if (!grid) return;
  let activeCat = null;
  const rows = features.map((f) => {
    const row = el("div", "fi-row");
    row.innerHTML = `
      <div class="fi-label">${f.name}</div>
      <div class="fi-bar-bg"><div class="fi-bar" data-w="${f.w}" data-cat="${f.cat}" style="width:0"></div></div>
      <div class="fi-cat">${f.cat}</div>`;
    row.addEventListener("click", () => {
      const cat = f.cat;
      activeCat = activeCat === cat ? null : cat;
      grid.querySelectorAll(".fi-bar").forEach((b) => {
        b.classList.toggle("dimmed", activeCat && b.dataset.cat !== activeCat);
      });
      grid.querySelectorAll(".fi-row").forEach((r) => {
        const rc = r.querySelector(".fi-bar")?.dataset.cat;
        r.classList.toggle("highlighted", activeCat && rc === activeCat);
      });
    });
    row.addEventListener("mouseenter", (e) => showTooltip(e, `<strong>${f.name}</strong><br>Kategori: ${f.cat}<br>RFE Rank: 1 (Terpilih)`));
    row.addEventListener("mousemove", moveTooltip);
    row.addEventListener("mouseleave", hideTooltip);
    return row;
  });
  appendAll(grid, rows);
  setTimeout(
    () =>
      grid.querySelectorAll(".fi-bar").forEach((b) => {
        b.style.width = b.dataset.w + "%";
      }),
    300,
  );
};

// ── Decision Tree Rules ──
const renderDTRules = (rules) => {
  setHTML(
    "dtRules",
    rules
      .map(
        (r) => `
    <div class="dt-rule">
      <div class="dt-rule-title">${r.title}</div>
      <div class="dt-rule-text">${r.text}</div>
    </div>`,
      )
      .join(""),
  );
};

// ── Error Cards (expandable) ──
const renderErrorCards = (errors) => {
  const wrap = $("errorCards");
  if (!wrap) return;
  const cards = errors.map((e) => {
    const card = el("div", `err-card ${e.type}-card`);
    const typeLbl = e.type === "fp" ? `<span class="badge badge-yellow">False Positive</span>` : `<span class="badge badge-red">False Negative</span>`;
    card.innerHTML = `
      <div class="err-header">
        <span class="err-case">${e.id}</span>
        <div class="err-badges">
          ${typeLbl}
          <span class="badge badge-green">Aktual: ${e.actual}</span>
          <span class="badge badge-red">Prediksi: ${e.pred}</span>
        </div>
        <span class="err-feat">${e.feat}</span>
        <span class="err-chevron">▶</span>
      </div>
      <div class="err-body">${e.analysis}</div>`;
    card.addEventListener("click", () => card.classList.toggle("open"));
    return card;
  });
  appendAll(wrap, cards);
};

// ── BVA Grid with toggle ──
const bvaRowHTML = (row, mode) => {
  const cls = mode === "after" ? "bva-row after-only" : "bva-row";
  const beforeCol = mode === "after" ? "" : `<div class="bva-before">${row.before}</div>`;
  return `<div class="${cls}"><div class="bva-aspect">${row.aspect}</div>${beforeCol}<div class="bva-after">${row.after}</div></div>`;
};

const renderBVA = (bva, mode = "split") => {
  const grid = $("bvaGrid");
  if (!grid) return;
  const headerHTML =
    mode === "after"
      ? `<div class="bva-header-row after-only"><span>Aspek</span><span>✅ Data-Driven</span></div>`
      : `<div class="bva-header-row"><span>Aspek</span><span>⛔ Sebelum (Tradisional)</span><span>✅ Setelah (Data-Driven)</span></div>`;
  grid.innerHTML = headerHTML + bva.map((r) => bvaRowHTML(r, mode)).join("");
};

const initBVAToggle = (bva) => {
  renderBVA(bva, "split");
  document.querySelectorAll(".bva-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".bva-toggle").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderBVA(bva, btn.dataset.mode);
    });
  });
};

// ── Knowledge Rules ──
const renderRules = (rules) => {
  setHTML(
    "rulesGrid",
    rules
      .map(
        (r) => `
    <div class="rule-card ${r.color}">
      <div class="rule-type">${r.type}</div>
      <div class="rule-title">${r.title}</div>
      <div class="rule-body">${r.body}</div>
    </div>`,
      )
      .join(""),
  );
};

// ═══════════════════════════════════════════════════════════
// CHART BUILDERS — each returns a Chart instance
// ═══════════════════════════════════════════════════════════

// Cari bagian ini di script.js dan perbarui:
Chart.defaults.color = "#5c7260"; // Warna teks legend (text-dim)
Chart.defaults.borderColor = "#e2e8e4"; // Warna grid line (card-border)
Chart.defaults.font.family = "'Space Mono', monospace";
Chart.defaults.font.size = 11;

// FP dataset builder for model compare chart
const makeDataset = (metric, models) => ({
  label: metric.label + " (%)",
  data: models[metric.key],
  backgroundColor: metric.color + "0.65)",
  borderColor: metric.border,
  borderWidth: 1,
  borderRadius: 4,
});

const buildModelChart = (models, metrics) => {
  const ctx = $("modelCompareChart");
  if (!ctx) return null;
  const chart = new Chart(ctx, {
    type: "bar",
    data: { labels: models.labels, datasets: metrics.map((m) => makeDataset(m, models)) },
    options: makeChartOpts({
      plugins: { legend: { labels: { color: "#7a9176", font: { size: 10 } } } },
      scales: {
        y: { min: 60, max: 100, grid: { color: "rgba(255,255,255,.04)" }, ticks: { callback: (v) => v + "%" } },
        x: { grid: { display: false } },
      },
    }),
  });
  return chart;
};

const buildMetricTabs = (metrics, chart) => {
  const wrap = $("metricTabs");
  if (!wrap || !chart) return;
  const allBtn = el("button", "metric-tab active", "Semua");
  allBtn.addEventListener("click", () => {
    wrap.querySelectorAll(".metric-tab").forEach((b) => b.classList.remove("active"));
    allBtn.classList.add("active");
    chart.data.datasets.forEach((_, i) => chart.setDatasetVisibility(i, true));
    chart.update();
  });
  wrap.appendChild(allBtn);
  metrics.forEach((m, i) => {
    const btn = el("button", "metric-tab", m.label);
    btn.addEventListener("click", () => {
      wrap.querySelectorAll(".metric-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      chart.data.datasets.forEach((_, j) => chart.setDatasetVisibility(j, j === i));
      chart.update();
    });
    wrap.appendChild(btn);
  });
};

const buildYieldDonut = () => {
  const ctx = $("yieldDonutChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Tinggi (1)", "Rendah (0)"],
      datasets: [{ data: [5445, 5445], backgroundColor: ["rgba(108,240,112,.7)", "rgba(240,96,96,.6)"], borderColor: ["rgba(108,240,112,1)", "rgba(240,96,96,1)"], borderWidth: 2, hoverOffset: 8 }],
    },
    options: makeChartOpts({ cutout: "65%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw.toLocaleString("id-ID")}` } } } }),
  });
};

const missingColor = (p) => (p >= 10 ? "rgba(240,96,96,.7)" : p >= 5 ? "rgba(240,201,58,.7)" : "rgba(108,240,112,.7)");
const buildMissingChart = (missing) => {
  const ctx = $("missingValueChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: missing.attrs,
      datasets: [
        {
          label: "Missing (%)",
          data: missing.pct,
          borderWidth: 0,
          borderRadius: 4,
          backgroundColor: missing.pct.map(missingColor),
        },
      ],
    },
    options: makeChartOpts({
      indexAxis: "y",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.raw}% (${missing.counts[c.dataIndex].toLocaleString("id-ID")} rows)` } } },
      scales: { x: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { callback: (v) => v + "%" } }, y: { grid: { display: false } } },
    }),
  });
};

const buildSmoteChart = () => {
  const ctx = $("smoteChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Sebelum SMOTE", "Setelah SMOTE"],
      datasets: [
        { label: "Rendah (0)", data: [5445, 5445], backgroundColor: "rgba(240,96,96,.6)", borderRadius: 4 },
        { label: "Tinggi (1)", data: [4755, 5445], backgroundColor: "rgba(108,240,112,.7)", borderRadius: 4 },
      ],
    },
    options: makeChartOpts({
      plugins: { legend: { labels: { color: "#7a9176", font: { size: 10 } } } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(255,255,255,.04)" }, ticks: { callback: (v) => v.toLocaleString("id-ID") } } },
    }),
  });
};

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

const initNavigation = () => {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");
  const sidebar = document.getElementById("sidebar");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      const target = item.dataset.section;

      navItems.forEach((n) => n.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      item.classList.add("active");
      document.getElementById(target)?.classList.add("active");

      // ✅ MOBILE: tutup sidebar setelah klik menu
      sidebar?.classList.remove("open");
    });
  });
};

// ═══════════════════════════════════════════════════════════
// MAIN INIT — compose all renderers
// ═══════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  const { kpis, models, metrics, missing, features, encodings, sampleData, cropMap, pipeline, featureImportance, confusionMatrices, dtRules, errors, bva, rules } = DATA;

  initNavigation();

  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("mobileToggle");

  toggle?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Overview
  renderKPIs(kpis);
  const chart = buildModelChart(models, metrics);
  buildMetricTabs(metrics, chart);
  buildYieldDonut();

  // Dataset
  renderFeatureFilter(features);
  renderSampleData(sampleData, cropMap);

  // Preprocessing
  buildMissingChart(missing);
  buildSmoteChart();
  renderPipeline(pipeline);
  renderEncodings(encodings);

  // Model
  renderConfusionMatrices(confusionMatrices);
  renderFeatureImportance(featureImportance);
  renderDTRules(dtRules);

  // Knowledge
  renderErrorCards(errors);
  initBVAToggle(bva);
  renderRules(rules);
});
