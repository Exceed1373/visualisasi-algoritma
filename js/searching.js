'use strict';
/* Visualisasi Searching (Scene 4). Pola sama dengan sorting.js:
   algoritma -> daftar snapshot langkah -> pemutar (setTimeout) yang menampilkan snapshot.
   Algoritma baru: tambahkan fungsi di ALGO dan baris di INFO + kartu di HTML. */

const INFO = { // [nama, terbaik, rata-rata, terburuk]
  linear: ['Linear Search', 'O(1)', 'O(n)', 'O(n)'],
  binary: ['Binary Search', 'O(1)', 'O(log n)', 'O(log n)']
};
const idx = (dari, sampai) => Array.from({ length: Math.max(sampai - dari, 0) }, (_, x) => dari + x);

/* ---------- 1. Algoritma ---------- */
const ALGO = {
  linear({ a, t, k, snap }) {
    for (let i = 0; i < a.length; i++) {
      k.n++;
      if (a[i] === t) {
        return snap(`Periksa indeks ${i}: ${a[i]} sama dengan target ${t}. Ditemukan di indeks ${i}!`, { found: i, lewat: idx(0, i), hasil: `ditemukan di indeks ${i}` });
      }
      snap(`Periksa indeks ${i}: ${a[i]} tidak sama dengan target ${t}${i < a.length - 1 ? ', lanjut ke elemen berikutnya' : ''}`, { cmp: i, lewat: idx(0, i) });
    }
    snap(`Semua elemen sudah diperiksa: ${t} tidak ditemukan`, { lewat: idx(0, a.length), hasil: 'tidak ditemukan' });
  },
  binary({ a, t, k, snap }) { // data harus terurut
    let low = 0, high = a.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1, v = a[mid], dim = [...idx(0, low), ...idx(high + 1, a.length)];
      k.n++;
      if (v === t) {
        return snap(`mid = ${mid}: ${v} sama dengan target ${t}. Ditemukan di indeks ${mid}!`, { low, mid, high, dim, found: mid, hasil: `ditemukan di indeks ${mid}` });
      }
      const kanan = v < t;
      snap(`${t} lebih ${kanan ? 'besar' : 'kecil'} dari mid (${v}), cari di bagian ${kanan ? 'kanan' : 'kiri'}`, { low, mid, high, dim });
      if (kanan) low = mid + 1; else high = mid - 1;
    }
    snap(`Rentang pencarian habis: ${t} tidak ditemukan`, { dim: idx(0, a.length), hasil: 'tidak ditemukan' });
  }
};

/* ---------- 2. Pembuat langkah ---------- */
function buatLangkah(algo, a, t) {
  const steps = [], k = { n: 0 };
  const snap = (msg, o = {}) => steps.push({
    cmp: -1, lewat: [], mid: -1, low: -1, high: -1, dim: [], found: -1, hasil: 'belum ditemukan', ...o, msg, n: k.n
  });
  const [nama, b, r, w] = INFO[algo];
  snap(`${nama} (terbaik ${b}, rata-rata ${r}, terburuk ${w}). Target: ${t}. Tekan Mulai atau Langkah.`);
  ALGO[algo]({ a, t, k, snap });
  return steps;
}

/* ---------- 3. Antarmuka & pemutar ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const state = initPemilihAlgoritma(Object.fromEntries(Object.entries(INFO).map(([id, v]) => [id, v[0]])));
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const P = { data: [], tampil: [], target: 0, steps: [], idx: 0, timer: null, cells: [], valid: true };
  const JEDA_MS = [1000, 600, 350, 180, 60];
  const MAX_N = 20;

  const terakhir = () => P.steps.length - 1;
  const berjalan = () => P.timer !== null;
  const jeda = () => { clearTimeout(P.timer); P.timer = null; if (P.steps.length) perbaruiTombol(); };
  const tampilGalat = (msg) => { $('pesan-galat').textContent = msg; $('pesan-galat').hidden = !msg; };

  const kelas = (st, i) => {
    const c = i === st.found ? 'done' : i === st.mid ? 'swap' : i === st.cmp ? 'compare' : st.lewat.includes(i) ? 'compare dim' : '';
    return `cell ${c}${st.dim.includes(i) ? ' dim' : ''}`.trim();
  };
  const tanda = (st, i) => (i === st.found ? 'ditemukan'
    : [i === st.low && 'low', i === st.mid && 'mid', i === st.high && 'high'].filter(Boolean).join('/'));

  function render() {
    const st = P.steps[P.idx];
    P.cells.forEach((c, i) => { c.el.className = kelas(st, i); c.mark.textContent = tanda(st, i); });
    $('penjelasan').textContent = st.msg;
    $('n-langkah').textContent = st.n;
    $('hasil').textContent = st.hasil;
    perbaruiTombol();
  }
  function perbaruiTombol() {
    const selesai = P.idx === terakhir();
    $('btn-mulai').disabled = berjalan() || !P.valid;
    $('btn-mulai').textContent = selesai ? 'Ulangi' : 'Mulai';
    $('btn-jeda').disabled = !berjalan();
    $('btn-langkah').disabled = selesai || !P.valid;
  }
  function buatSel(v, i) {
    const el = document.createElement('div'), mark = document.createElement('small');
    const val = document.createElement('span'), nomor = document.createElement('small');
    el.className = 'cell'; mark.className = 'mark'; val.className = 'val';
    val.textContent = v; nomor.textContent = i;
    el.append(mark, val, nomor);
    stage.appendChild(el);
    return { el, mark };
  }

  /* membangun ulang sel + langkah; Binary Search mengurutkan data otomatis bila perlu */
  function susun() {
    jeda();
    const binary = state.algo === 'binary';
    const urut = P.data.every((v, i) => i === 0 || P.data[i - 1] <= v);
    P.tampil = binary && !urut ? [...P.data].sort((x, y) => x - y) : P.data.slice();
    $('peringatan').hidden = !(binary && !urut);
    $('peringatan').textContent = `Peringatan: Binary Search membutuhkan data terurut. Data diurutkan otomatis menjadi ${P.tampil.join(', ')}.`;
    stage.innerHTML = '';
    P.cells = P.tampil.map(buatSel);
    P.steps = buatLangkah(state.algo, P.tampil, P.target);
    P.idx = 0;
    render();
  }
  function bacaTarget() {
    const v = $('input-target').value.trim();
    if (v === '' || !Number.isInteger(Number(v))) { tampilGalat('Target harus berupa bilangan bulat, contoh: 25.'); return null; }
    return Number(v);
  }
  function terapkan(data) {
    if (data) P.data = data;
    const t = bacaTarget();
    P.valid = t !== null;
    if (P.valid) { tampilGalat(''); P.target = t; susun(); } else { jeda(); perbaruiTombol(); }
  }

  /* kontrol animasi */
  function mulai() {
    if (berjalan() || !P.valid) return;
    if (P.idx === terakhir()) P.idx = 0;
    const tick = () => {
      P.idx++;
      P.timer = P.idx < terakhir() ? setTimeout(tick, JEDA_MS[$('input-kecepatan').value - 1]) : null;
      render();
    };
    tick();
  }
  function langkah() { jeda(); if (P.valid && P.idx < terakhir()) { P.idx++; render(); } }
  function reset() { jeda(); P.idx = 0; render(); }

  /* pengaturan data + validasi */
  function acak() {
    const s = new Set();
    while (s.size < 10) s.add(1 + Math.floor(Math.random() * 99));
    const data = [...s];
    $('input-target').value = data[Math.floor(Math.random() * data.length)]; // target contoh yang ada di data
    tampilGalat('');
    terapkan(data);
  }
  function terapkanManual() {
    const token = $('input-manual').value.split(/[\s,;]+/).filter(Boolean);
    if (!token.length) return tampilGalat('Masukkan angka dipisahkan koma, contoh: 3, 8, 12, 19.');
    const salah = token.find((t) => !/^\d+$/.test(t) || +t < 1 || +t > 99);
    if (salah) return tampilGalat(`"${salah}" tidak valid. Gunakan bilangan bulat 1–99.`);
    if (token.length < 2 || token.length > MAX_N) return tampilGalat(`Jumlah data harus 2–${MAX_N} angka (sekarang ${token.length}).`);
    tampilGalat('');
    terapkan(token.map(Number));
  }

  $('btn-buka').addEventListener('click', () => (P.data.length ? terapkan() : acak()));
  $('btn-ganti').addEventListener('click', jeda);
  $('btn-mulai').addEventListener('click', mulai);
  $('btn-jeda').addEventListener('click', jeda);
  $('btn-langkah').addEventListener('click', langkah);
  $('btn-reset').addEventListener('click', reset);
  $('btn-acak').addEventListener('click', acak);
  $('btn-terapkan').addEventListener('click', terapkanManual);
  $('input-manual').addEventListener('keydown', (e) => { if (e.key === 'Enter') terapkanManual(); });
  $('input-target').addEventListener('change', () => terapkan());
});
