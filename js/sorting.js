'use strict';
/* Visualisasi Sorting (Scene 3).
   Pola: algoritma dijalankan lebih dulu -> menghasilkan daftar "snapshot" langkah (steps),
   lalu pemutar (setTimeout) hanya menampilkan snapshot. Ini membuat Jeda/Langkah/Reset sederhana.
   Menambah algoritma baru: tambahkan satu fungsi di ALGO dan satu baris di INFO + satu kartu di HTML. */

const INFO = { // [nama, terbaik, rata-rata, terburuk]
  bubble: ['Bubble Sort', 'O(n)', 'O(n²)', 'O(n²)'],
  selection: ['Selection Sort', 'O(n²)', 'O(n²)', 'O(n²)'],
  insertion: ['Insertion Sort', 'O(n)', 'O(n²)', 'O(n²)'],
  quick: ['Quick Sort', 'O(n log n)', 'O(n log n)', 'O(n²)'],
  merge: ['Merge Sort', 'O(n log n)', 'O(n log n)', 'O(n log n)']
};

/* ---------- 1. Algoritma: tiap fungsi memanggil snap() pada setiap kejadian penting ---------- */
const ALGO = {
  bubble({ a, n, k, snap, swap, done }) {
    for (let i = 0; i < n - 1; i++) {
      let tukar = false;
      for (let j = 0; j < n - 1 - i; j++) {
        k.c++; snap(`Bandingkan ${a[j]} dan ${a[j + 1]}`, { cmp: [j, j + 1] });
        if (a[j] > a[j + 1]) {
          const x = a[j], y = a[j + 1];
          swap(j, j + 1); tukar = true;
          snap(`${x} > ${y}, tukar posisi`, { swp: [j, j + 1] });
        }
      }
      done.add(n - 1 - i);
      if (!tukar) break; // tidak ada pertukaran: data sudah terurut
    }
  },
  selection({ a, n, k, snap, swap, done }) {
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      snap(`Cari nilai terkecil mulai indeks ${i}`, { pivot: m });
      for (let j = i + 1; j < n; j++) {
        k.c++; snap(`Bandingkan ${a[j]} dengan minimum sementara ${a[m]}`, { cmp: [j], pivot: m });
        if (a[j] < a[m]) { m = j; snap(`${a[m]} menjadi minimum baru`, { pivot: m }); }
      }
      if (m !== i) {
        const x = a[i], y = a[m];
        swap(i, m); snap(`Tukar minimum ${y} dengan ${x}`, { swp: [i, m] });
      }
      done.add(i);
    }
  },
  insertion({ a, n, k, snap, swap, done }) {
    for (let i = 1; i < n; i++) {
      done.clear(); for (let x = 0; x < i; x++) done.add(x);
      snap(`Ambil ${a[i]} untuk disisipkan ke bagian kiri yang terurut`, { pivot: i });
      for (let p = i; p > 0; p--) {
        k.c++; snap(`Bandingkan ${a[p - 1]} dan ${a[p]}`, { cmp: [p - 1, p] });
        if (a[p - 1] <= a[p]) break;
        const x = a[p - 1], y = a[p];
        swap(p - 1, p); snap(`${x} > ${y}, geser ${y} ke kiri`, { swp: [p - 1, p] });
      }
    }
  },
  quick({ a, n, k, snap, swap, done }) { // partisi Lomuto, pivot = elemen terakhir
    const qs = (lo, hi) => {
      if (lo > hi) return;
      if (lo === hi) { done.add(lo); return; }
      const p = a[hi]; let i = lo;
      snap(`Pilih pivot ${p}, partisi indeks ${lo}–${hi}`, { pivot: hi });
      for (let j = lo; j < hi; j++) {
        k.c++; snap(`Bandingkan ${a[j]} dengan pivot ${p}`, { cmp: [j], pivot: hi });
        if (a[j] < p) {
          if (i !== j) {
            const x = a[i], y = a[j];
            swap(i, j); snap(`${y} < ${p}, tukar dengan ${x}`, { swp: [i, j], pivot: hi });
          }
          i++;
        }
      }
      if (i !== hi) { swap(i, hi); snap(`Tempatkan pivot ${p} di indeks ${i}`, { swp: [i, hi] }); }
      done.add(i);
      snap(`Pivot ${p} sudah berada di posisi akhir (indeks ${i})`, { pivot: i });
      qs(lo, i - 1); qs(i + 1, hi);
    };
    qs(0, n - 1);
  },
  merge({ a, n, k, snap }) { // "pertukaran" = pemindahan elemen ke hasil gabungan
    const ms = (lo, hi) => {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1, range = [lo, hi];
      snap(`Bagi indeks ${lo}–${hi} menjadi ${lo}–${mid} dan ${mid + 1}–${hi}`, { range });
      ms(lo, mid); ms(mid + 1, hi);
      const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1), M = [];
      let i = 0, j = 0;
      const view = () => [...a.slice(0, lo), ...M, ...L.slice(i), ...R.slice(j), ...a.slice(hi + 1)];
      while (i < L.length && j < R.length) {
        k.c++;
        snap(`Bandingkan ${L[i]} (kiri) dan ${R[j]} (kanan)`, { arr: view(), cmp: [lo + M.length, lo + M.length + L.length - i], range });
        M.push(L[i] <= R[j] ? L[i++] : R[j++]); k.s++;
        snap(`Pindahkan ${M[M.length - 1]} ke hasil gabungan`, { arr: view(), swp: [lo + M.length - 1], range });
      }
      k.s += L.length - i + R.length - j;
      M.push(...L.slice(i), ...R.slice(j));
      M.forEach((v, x) => { a[lo + x] = v; });
      snap(`Hasil gabungan indeks ${lo}–${hi}: ${M.join(', ')}`, { range });
    };
    ms(0, n - 1);
  }
};

/* ---------- 2. Pembuat langkah ---------- */
function buatLangkah(algo, data) {
  const a = data.slice(), n = a.length, steps = [], done = new Set(), k = { c: 0, s: 0 };
  const snap = (msg, o = {}) => steps.push({
    arr: o.arr || a.slice(), cmp: o.cmp || [], swp: o.swp || [], pivot: o.pivot ?? -1,
    range: o.range || null, done: [...done], msg, c: k.c, s: k.s
  });
  const swap = (i, j) => { [a[i], a[j]] = [a[j], a[i]]; k.s++; };
  const [nama, b, r, t] = INFO[algo];
  snap(`${nama}: kompleksitas waktu terbaik ${b}, rata-rata ${r}, terburuk ${t}. Tekan Mulai atau Langkah.`);
  ALGO[algo]({ a, n, k, snap, swap, done });
  for (let i = 0; i < n; i++) done.add(i);
  snap(`Selesai! Semua elemen terurut.${algo === 'merge' ? ' (Pada Merge Sort, pertukaran dihitung sebagai pemindahan elemen.)' : ''}`);
  return steps;
}

/* ---------- 3. Antarmuka & pemutar ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const state = initPemilihAlgoritma(Object.fromEntries(Object.entries(INFO).map(([id, v]) => [id, v[0]])));
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const P = { data: [], steps: [], idx: 0, timer: null, bars: [], max: 1 };
  const JEDA_MS = [1000, 600, 350, 180, 60]; // sesuai slider kecepatan 1–5
  const MIN_N = 5, MAX_N = 30;

  const terakhir = () => P.steps.length - 1;
  const berjalan = () => P.timer !== null;
  const jeda = () => { clearTimeout(P.timer); P.timer = null; if (P.steps.length) perbaruiTombol(); };
  const tampilGalat = (msg) => { $('pesan-galat').textContent = msg; $('pesan-galat').hidden = !msg; };

  function kelas(st, i) {
    const c = st.swp.includes(i) ? 'swap' : st.cmp.includes(i) ? 'compare' : st.pivot === i ? 'pivot' : st.done.includes(i) ? 'done' : '';
    const redup = st.range && (i < st.range[0] || i > st.range[1]) ? ' dim' : '';
    return `bar ${c}${redup}`.trim();
  }
  function render() {
    const st = P.steps[P.idx];
    P.bars.forEach((b, i) => {
      b.style.height = `${Math.max((st.arr[i] / P.max) * 100, 6)}%`;
      b.textContent = st.arr[i];
      b.className = kelas(st, i);
    });
    $('penjelasan').textContent = st.msg;
    $('n-banding').textContent = st.c;
    $('n-tukar').textContent = st.s;
    perbaruiTombol();
  }
  function perbaruiTombol() {
    const selesai = P.idx === terakhir();
    $('btn-mulai').disabled = berjalan();
    $('btn-mulai').textContent = selesai ? 'Ulangi' : 'Mulai';
    $('btn-jeda').disabled = !berjalan();
    $('btn-langkah').disabled = selesai;
  }

  function susun() { jeda(); P.steps = buatLangkah(state.algo, P.data); P.idx = 0; render(); }
  function muatData(data) {
    P.data = data; P.max = Math.max(...data);
    stage.innerHTML = '';
    P.bars = data.map(() => stage.appendChild(document.createElement('div')));
    stage.classList.toggle('padat', data.length > 18);
    susun();
  }

  /* kontrol animasi */
  function mulai() {
    if (berjalan()) return;
    if (P.idx === terakhir()) P.idx = 0;
    const tick = () => {
      P.idx++;
      P.timer = P.idx < terakhir() ? setTimeout(tick, JEDA_MS[$('input-kecepatan').value - 1]) : null;
      render();
    };
    tick();
  }
  function langkah() { jeda(); if (P.idx < terakhir()) { P.idx++; render(); } }
  function reset() { jeda(); P.idx = 0; render(); }

  /* pengaturan data + validasi */
  function acak() {
    const n = Number($('input-jumlah').value);
    if (!Number.isInteger(n) || n < MIN_N || n > MAX_N) return tampilGalat(`Jumlah data harus bilangan bulat ${MIN_N}–${MAX_N}.`);
    tampilGalat('');
    muatData(Array.from({ length: n }, () => 5 + Math.floor(Math.random() * 95)));
  }
  function terapkanManual() {
    const token = $('input-manual').value.split(/[\s,;]+/).filter(Boolean);
    if (!token.length) return tampilGalat('Masukkan angka dipisahkan koma, contoh: 80, 30, 55.');
    const salah = token.find((t) => !/^\d+$/.test(t) || +t < 1 || +t > 99);
    if (salah) return tampilGalat(`"${salah}" tidak valid. Gunakan bilangan bulat 1–99.`);
    if (token.length < 2 || token.length > MAX_N) return tampilGalat(`Jumlah data harus 2–${MAX_N} angka (sekarang ${token.length}).`);
    tampilGalat('');
    muatData(token.map(Number));
  }

  $('btn-buka').addEventListener('click', () => (P.data.length ? susun() : muatData(Array.from({ length: 8 }, () => 5 + Math.floor(Math.random() * 95)))));
  $('btn-ganti').addEventListener('click', jeda);
  $('btn-mulai').addEventListener('click', mulai);
  $('btn-jeda').addEventListener('click', jeda);
  $('btn-langkah').addEventListener('click', langkah);
  $('btn-reset').addEventListener('click', reset);
  $('btn-acak').addEventListener('click', acak);
  $('input-jumlah').addEventListener('change', acak);
  $('btn-terapkan').addEventListener('click', terapkanManual);
  $('input-manual').addEventListener('keydown', (e) => { if (e.key === 'Enter') terapkanManual(); });
});
