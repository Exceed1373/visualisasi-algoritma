'use strict';
/* TAHAP 2: mesin animasi Sorting.
   Pola: algoritma menghasilkan daftar langkah (steps) lebih dulu; pemutar hanya menampilkan steps[idx].
   Satu step = { a: salinan data, cmp: [indeks dibandingkan], swp: [indeks ditukar], piv, rng, done, c, s, txt } */
const NAMA_SORTING = {
  bubble: 'Bubble Sort', selection: 'Selection Sort', insertion: 'Insertion Sort',
  quick: 'Quick Sort', merge: 'Merge Sort'
};

/* ---------- Generator langkah (murni, tanpa DOM) ---------- */
function buatSteps(algo, data) {
  const a = data.slice(), n = a.length, steps = [], done = new Set();
  let c = 0, s = 0; // c = perbandingan, s = pertukaran
  const snap = (txt, o = {}) => steps.push({
    a: a.slice(), cmp: o.cmp || [], swp: o.swp || [], piv: o.piv === undefined ? -1 : o.piv,
    rng: o.rng || null, done: [...done], c, s, txt
  });
  const tukar = (i, j) => { [a[i], a[j]] = [a[j], a[i]]; s++; };
  const rentang = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);

  const algos = {
    bubble() {
      for (let i = 0; i < n - 1; i++) {
        let ada = false;
        for (let j = 0; j < n - 1 - i; j++) {
          c++; snap(`Bandingkan ${a[j]} dan ${a[j + 1]}`, { cmp: [j, j + 1] });
          if (a[j] > a[j + 1]) {
            const x = a[j], y = a[j + 1];
            tukar(j, j + 1); ada = true;
            snap(`${x} > ${y}, tukar posisi`, { swp: [j, j + 1] });
          }
        }
        done.add(n - 1 - i);
        snap(`${a[n - 1 - i]} sudah di posisi akhir (indeks ${n - 1 - i})`);
        if (!ada) break; // tidak ada pertukaran: data sudah terurut
      }
    },
    selection() {
      for (let i = 0; i < n - 1; i++) {
        let m = i;
        for (let j = i + 1; j < n; j++) {
          c++; snap(`Bandingkan ${a[j]} dengan nilai terkecil sementara ${a[m]}`, { cmp: [j], piv: m });
          if (a[j] < a[m]) m = j;
        }
        if (m !== i) {
          const x = a[i], y = a[m];
          tukar(i, m); snap(`Tukar ${x} dengan nilai terkecil ${y}`, { swp: [i, m] });
        }
        done.add(i);
        snap(`${a[i]} sudah di posisi akhir (indeks ${i})`);
      }
    },
    insertion() {
      for (let i = 1; i < n; i++) {
        for (let j = i; j > 0; j--) {
          c++; snap(`Bandingkan ${a[j - 1]} dan ${a[j]}`, { cmp: [j - 1, j] });
          if (a[j - 1] <= a[j]) break;
          const x = a[j - 1], y = a[j];
          tukar(j - 1, j); snap(`${x} > ${y}, geser ${y} ke kiri`, { swp: [j - 1, j] });
        }
      }
    },
    quick() {
      const qs = (lo, hi) => {
        if (lo > hi) return;
        if (lo === hi) { done.add(lo); return; }
        const p = a[hi]; let i = lo;
        snap(`Pilih pivot ${p} (indeks ${hi}) untuk bagian ${lo}..${hi}`, { piv: hi });
        for (let j = lo; j < hi; j++) {
          c++; snap(`Bandingkan ${a[j]} dengan pivot ${p}`, { cmp: [j], piv: hi });
          if (a[j] < p) {
            if (i !== j) {
              const x = a[i], y = a[j];
              tukar(i, j); snap(`${y} < ${p}: tukar dengan ${x} (indeks ${i})`, { swp: [i, j], piv: hi });
            }
            i++;
          }
        }
        if (i !== hi) { tukar(i, hi); snap(`Tempatkan pivot ${p} di indeks ${i}`, { swp: [i, hi] }); }
        done.add(i);
        snap(`Pivot ${p} sudah di posisi akhir (indeks ${i})`, { piv: i });
        qs(lo, i - 1); qs(i + 1, hi);
      };
      qs(0, n - 1);
    },
    merge() {
      const ms = (lo, hi) => {
        if (lo >= hi) return;
        const mid = (lo + hi) >> 1;
        snap(`Bagi indeks ${lo}..${hi} menjadi ${lo}..${mid} dan ${mid + 1}..${hi}`, { rng: [lo, hi] });
        ms(lo, mid); ms(mid + 1, hi);
        const out = []; let i = lo, j = mid + 1;
        while (i <= mid && j <= hi) {
          c++;
          const kiri = a[i] <= a[j];
          out.push(kiri ? a[i] : a[j]);
          snap(`Bandingkan ${a[i]} (kiri) dan ${a[j]} (kanan), ambil ${out[out.length - 1]}. Hasil sementara: ${out.join(', ')}`,
            { cmp: [i, j], rng: [lo, hi] });
          kiri ? i++ : j++;
        }
        while (i <= mid) out.push(a[i++]);
        while (j <= hi) out.push(a[j++]);
        out.forEach((v, k) => { if (a[lo + k] !== v) s++; a[lo + k] = v; }); // s = elemen yang berpindah posisi
        snap(`Gabungkan indeks ${lo}..${hi}: ${out.join(', ')}`, { swp: rentang(lo, hi), rng: [lo, hi] });
      };
      ms(0, n - 1);
    }
  };

  snap('Data awal: ' + a.join(', '));
  algos[algo]();
  for (let k = 0; k < n; k++) done.add(k);
  snap(`Selesai! Semua elemen terurut. Perbandingan: ${c}, pertukaran: ${s}`);
  return steps;
}

/* ---------- Antarmuka & pemutar ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const state = initPemilihAlgoritma(NAMA_SORTING);
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const KECEPATAN = [1000, 700, 450, 220, 80]; // ms per langkah (slider 1-5)
  const S = { data: [], steps: [], idx: 0, max: 1, timer: null };
  const akhir = () => S.idx >= S.steps.length - 1;

  function galat(msg) { $('pesan-galat').textContent = msg || ''; $('pesan-galat').hidden = !msg; }

  function tombol() {
    const jalan = S.timer !== null;
    $('btn-mulai').disabled = jalan;
    $('btn-jeda').disabled = !jalan;
    $('btn-langkah').disabled = jalan || akhir();
  }
  function stop() { clearTimeout(S.timer); S.timer = null; tombol(); }

  function bangun() {
    stage.innerHTML = '';
    stage.classList.toggle('many', S.data.length > 18);
    S.data.forEach(() => { const b = document.createElement('div'); b.className = 'bar'; stage.appendChild(b); });
  }
  function tampil() {
    const st = S.steps[S.idx];
    st.a.forEach((v, i) => {
      const b = stage.children[i];
      b.style.height = Math.max(6, (v / S.max) * 100) + '%';
      b.textContent = v; b.title = v;
      const warna = (st.swp.includes(i) || st.piv === i) ? ' swap' : st.cmp.includes(i) ? ' compare' : st.done.includes(i) ? ' done' : '';
      const redup = st.rng && (i < st.rng[0] || i > st.rng[1]) ? ' dim' : '';
      b.className = 'bar' + warna + redup;
    });
    $('penjelasan').textContent = st.txt;
    $('n-banding').textContent = st.c;
    $('n-tukar').textContent = st.s;
  }
  function siapkan() {
    stop();
    S.steps = buatSteps(state.algo, S.data);
    S.idx = 0; S.max = Math.max(...S.data);
    bangun(); tampil(); tombol();
  }
  function dataBaru(arr) { S.data = arr; siapkan(); }

  function acak() {
    const n = Number($('input-jumlah').value);
    if (!Number.isInteger(n) || n < 5 || n > 30) { galat('Jumlah data harus bilangan bulat 5–30.'); return; }
    galat();
    dataBaru(Array.from({ length: n }, () => 10 + Math.floor(Math.random() * 90)));
  }
  function manual() {
    const p = $('input-manual').value.trim().split(/[\s,;]+/).filter(Boolean);
    if (p.length < 2 || p.length > 30 || !p.every((x) => /^\d{1,3}$/.test(x) && Number(x) > 0)) {
      galat('Input tidak valid: masukkan 2–30 angka bulat (1–999) dipisah koma.'); return;
    }
    galat();
    dataBaru(p.map(Number));
  }

  function tick() {
    if (!akhir()) { S.idx++; tampil(); }
    S.timer = akhir() ? null : setTimeout(tick, KECEPATAN[$('input-kecepatan').value - 1]);
    tombol();
  }
  function mulai() {
    if (akhir()) { S.idx = 0; tampil(); }
    S.timer = setTimeout(tick, 200);
    tombol();
  }
  function langkah() { if (!akhir()) { S.idx++; tampil(); } tombol(); }

  $('btn-acak').addEventListener('click', acak);
  $('btn-terapkan').addEventListener('click', manual);
  $('input-manual').addEventListener('keydown', (e) => { if (e.key === 'Enter') manual(); });
  $('btn-mulai').addEventListener('click', mulai);
  $('btn-jeda').addEventListener('click', stop);
  $('btn-langkah').addEventListener('click', langkah);
  $('btn-reset').addEventListener('click', siapkan); // ulang dari awal dengan data yang sama
  document.addEventListener('algo:buka', () => { S.data.length ? siapkan() : acak(); });
  document.addEventListener('algo:ganti', stop);
  $('btn-jeda').disabled = true;
});
