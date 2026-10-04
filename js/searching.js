'use strict';
/* Visualisasi Searching (Scene 4). Pola sama dengan sorting.js:
   algoritma -> daftar snapshot langkah -> pemutar setTimeout (Mulai/Jeda/Langkah/Reset).
   Snapshot: { lo, hi, mid, cmp, found, msg, c, hasil }. Sel di luar [lo..hi] diredupkan. */

const INFO = { // [nama, terbaik, rata-rata, terburuk]
  linear: ['Linear Search', 'O(1)', 'O(n)', 'O(n)'],
  binary: ['Binary Search', 'O(1)', 'O(log n)', 'O(log n)']
};

/* ---------- 1. Algoritma ---------- */
const ALGO = {
  linear({ a, t, k, snap }) {
    for (let i = 0; i < a.length; i++) {
      k.c++;
      if (a[i] === t) return snap(`Indeks ${i}: ${a[i]} = ${t}. Data ditemukan di indeks ${i}.`, { lo: i, cmp: i, found: i });
      snap(`Indeks ${i}: ${a[i]} ≠ ${t}, lanjut ke elemen berikutnya.`, { lo: i, cmp: i });
    }
    snap(`Semua elemen sudah diperiksa. ${t} tidak ditemukan.`, { lo: a.length, hasil: 'tidak ditemukan' });
  },
  binary({ a, t, k, snap }) { // data harus terurut naik
    let lo = 0, hi = a.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1; k.c++;
      const ket = `low=${lo}, high=${hi}, mid=${mid} (${a[mid]}). `;
      if (a[mid] === t) return snap(`${ket}${t} = ${a[mid]}, data ditemukan di indeks ${mid}.`, { lo, hi, mid, found: mid });
      if (a[mid] < t) { snap(`${ket}${t} lebih besar dari mid (${a[mid]}), cari di bagian kanan.`, { lo, hi, mid }); lo = mid + 1; }
      else { snap(`${ket}${t} lebih kecil dari mid (${a[mid]}), cari di bagian kiri.`, { lo, hi, mid }); hi = mid - 1; }
    }
    snap(`Ruang pencarian habis (low > high). ${t} tidak ditemukan.`, { lo, hi, hasil: 'tidak ditemukan' });
  }
};

/* ---------- 2. Pembuat langkah ---------- */
const terurut = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);

function buatLangkah(algo, a, t) {
  const n = a.length, steps = [], k = { c: 0 };
  const snap = (msg, o = {}) => steps.push({
    lo: 0, hi: n - 1, mid: -1, cmp: -1, found: -1, ...o, msg, c: k.c,
    hasil: o.hasil || (o.found >= 0 ? `ditemukan di indeks ${o.found}` : 'belum ditemukan')
  });
  const [nama, b, r, w] = INFO[algo];
  snap(`${nama}: kompleksitas waktu terbaik ${b}, rata-rata ${r}, terburuk ${w}. Target: ${t}. Tekan Mulai atau Langkah.`, { hasil: 'belum dimulai' });
  ALGO[algo]({ a, t, k, snap });
  return steps;
}

/* ---------- 3. Antarmuka & pemutar ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const state = initPemilihAlgoritma(Object.fromEntries(Object.entries(INFO).map(([id, v]) => [id, v[0]])));
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const P = { data: [], steps: [], idx: 0, timer: null, cells: [], diurutkan: false };
  const JEDA_MS = [1000, 600, 350, 180, 60];
  const MAX_N = 20;

  const terakhir = () => P.steps.length - 1;
  const berjalan = () => P.timer !== null;
  const jeda = () => { clearTimeout(P.timer); P.timer = null; if (P.steps.length) perbaruiTombol(); };
  const tampilGalat = (msg) => { $('pesan-galat').textContent = msg; $('pesan-galat').hidden = !msg; };
  const cekTarget = () => {
    const ok = /^-?\d+$/.test($('input-target').value.trim());
    tampilGalat(ok ? '' : 'Target harus berupa bilangan bulat.');
    return ok;
  };

  function penanda(st, i) {
    if (st.found === i) return 'ditemukan';
    if (st.found >= 0) return '';
    if (state.algo === 'linear') return st.cmp === i ? 'diperiksa' : '';
    const ada = st.lo <= st.hi, r = [];
    if (ada && i === st.lo) r.push('low');
    if (i === st.mid) r.push('mid');
    if (ada && i === st.hi) r.push('high');
    return r.join('/');
  }
  function kelas(st, i) {
    const c = st.found === i ? 'done' : st.mid === i ? 'swap' : st.cmp === i ? 'compare' : '';
    return `cell ${c || (i < st.lo || i > st.hi ? 'dim' : '')}`.trim();
  }
  function render() {
    const st = P.steps[P.idx];
    P.cells.forEach((el, i) => {
      const [nilai, indeks, tanda] = el.children;
      nilai.textContent = P.data[i];
      indeks.textContent = `[${i}]`;
      tanda.textContent = penanda(st, i);
      el.className = kelas(st, i);
    });
    $('penjelasan').textContent = st.msg;
    $('n-langkah').textContent = st.c;
    $('hasil').textContent = st.hasil;
    perbaruiTombol();
  }
  function perbaruiTombol() {
    const selesai = P.idx === terakhir();
    $('btn-mulai').disabled = berjalan();
    $('btn-mulai').textContent = selesai ? 'Ulangi' : 'Mulai';
    $('btn-jeda').disabled = !berjalan();
    $('btn-langkah').disabled = selesai;
  }

  /* susun ulang langkah; Binary Search + data belum terurut -> peringatan + urutkan otomatis */
  function susun() {
    jeda(); cekTarget();
    if (state.algo === 'binary' && !terurut(P.data)) { P.data.sort((x, y) => x - y); P.diurutkan = true; }
    else if (state.algo !== 'binary') P.diurutkan = false;
    $('peringatan').hidden = !P.diurutkan;
    P.steps = buatLangkah(state.algo, P.data, Number($('input-target').value));
    P.idx = 0; render();
  }
  function muatData(data) {
    P.data = data; P.diurutkan = false; stage.innerHTML = '';
    P.cells = data.map(() => {
      const el = document.createElement('div');
      el.innerHTML = '<span></span><small></small><small class="penanda"></small>';
      return stage.appendChild(el);
    });
    susun();
  }
  function dataAcak() { // 10 nilai unik; target disertakan (peluang 70%) agar demo sering "ditemukan"
    const s = new Set(), t = Number($('input-target').value);
    while (s.size < 10) s.add(1 + Math.floor(Math.random() * 99));
    const d = [...s];
    if (Number.isInteger(t) && t >= 1 && t <= 99 && !s.has(t) && Math.random() < 0.7) d[Math.floor(Math.random() * 10)] = t;
    return d;
  }
  function terapkanManual() {
    const token = $('input-manual').value.split(/[\s,;]+/).filter(Boolean);
    if (!token.length) return tampilGalat('Masukkan angka dipisahkan koma, contoh: 3, 8, 12, 19.');
    const salah = token.find((t) => !/^\d+$/.test(t) || +t < 1 || +t > 99);
    if (salah) return tampilGalat(`"${salah}" tidak valid. Gunakan bilangan bulat 1–99.`);
    if (token.length < 2 || token.length > MAX_N) return tampilGalat(`Jumlah data harus 2–${MAX_N} angka (sekarang ${token.length}).`);
    muatData(token.map(Number));
  }

  /* kontrol animasi */
  function mulai() {
    if (berjalan() || !cekTarget()) return;
    if (P.idx === 0 || P.idx === terakhir()) susun(); // ambil target terbaru, idx kembali 0
    const tick = () => {
      P.idx++;
      P.timer = P.idx < terakhir() ? setTimeout(tick, JEDA_MS[$('input-kecepatan').value - 1]) : null;
      render();
    };
    tick();
  }
  function langkah() {
    if (!cekTarget()) return;
    jeda();
    if (P.idx === 0) susun();
    if (P.idx < terakhir()) { P.idx++; render(); }
  }
  const reset = () => { jeda(); P.idx = 0; render(); };

  $('btn-buka').addEventListener('click', () => (P.data.length ? susun() : muatData(dataAcak())));
  $('btn-ganti').addEventListener('click', jeda);
  $('btn-mulai').addEventListener('click', mulai);
  $('btn-jeda').addEventListener('click', jeda);
  $('btn-langkah').addEventListener('click', langkah);
  $('btn-reset').addEventListener('click', reset);
  $('btn-acak').addEventListener('click', () => muatData(dataAcak()));
  $('btn-terapkan').addEventListener('click', terapkanManual);
  $('input-manual').addEventListener('keydown', (e) => { if (e.key === 'Enter') terapkanManual(); });
  $('input-target').addEventListener('change', susun);
});
