'use strict';
/* Visualisasi Searching:
   Linear Search langsung mencari pada data.
   Binary Search: data acak -> visualisasi pengurutan otomatis -> data terurut -> Binary Search.
   Snapshot: {data, lo, hi, mid, cmp, found, msg, c, hasil, phase}. */

const INFO = {
  linear: ['Linear Search', 'O(1)', 'O(n)', 'O(n)'],
  binary: ['Binary Search', 'O(1)', 'O(log n)', 'O(log n)']
};

/* ---------- 1. Algoritma pencarian ---------- */
const ALGO = {
  linear({ a, t, k, snap }) {
    for (let i = 0; i < a.length; i++) {
      k.c++;
      if (a[i] === t) {
        return snap(`Indeks ${i}: ${a[i]} = ${t}. Data ditemukan di indeks ${i}.`,
          { lo: i, cmp: i, found: i, phase: 'search' });
      }
      snap(`Indeks ${i}: ${a[i]} ≠ ${t}, lanjut ke elemen berikutnya.`,
        { lo: i, cmp: i, phase: 'search' });
    }
    snap(`Semua elemen sudah diperiksa. ${t} tidak ditemukan.`,
      { lo: a.length, hasil: 'tidak ditemukan', phase: 'search' });
  },

  binary({ a, t, k, snap }) { // data sudah terurut naik
    let lo = 0, hi = a.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      k.c++;
      const ket = `low=${lo}, high=${hi}, mid=${mid} (${a[mid]}). `;

      if (a[mid] === t) {
        return snap(`${ket}${t} = ${a[mid]}, data ditemukan di indeks ${mid}.`,
          { lo, hi, mid, found: mid, phase: 'search' });
      }

      if (a[mid] < t) {
        snap(`${ket}${t} lebih besar dari mid (${a[mid]}), cari di bagian kanan.`,
          { lo, hi, mid, phase: 'search' });
        lo = mid + 1;
      } else {
        snap(`${ket}${t} lebih kecil dari mid (${a[mid]}), cari di bagian kiri.`,
          { lo, hi, mid, phase: 'search' });
        hi = mid - 1;
      }
    }
    snap(`Ruang pencarian habis (low > high). ${t} tidak ditemukan.`,
      { lo, hi, hasil: 'tidak ditemukan', phase: 'search' });
  }
};

/* ---------- 2. Pembuat langkah ---------- */
const terurut = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);

function buatLangkah(algo, a, t) {
  const n = a.length;
  const steps = [];
  const k = { c: 0 };

  const snap = (msg, o = {}) => steps.push({
    data: o.data ? [...o.data] : [...a],
    lo: 0, hi: n - 1, mid: -1, cmp: -1, found: -1,
    phase: 'search',
    ...o,
    msg,
    c: k.c,
    hasil: o.hasil || (o.found >= 0 ? `ditemukan di indeks ${o.found}` : 'belum ditemukan')
  });

  const [nama, b, r, w] = INFO[algo];
  snap(`${nama}: kompleksitas waktu terbaik ${b}, rata-rata ${r}, terburuk ${w}. Target: ${t}. Tekan Mulai atau Langkah.`,
    { hasil: 'belum dimulai', phase: 'search' });

  ALGO[algo]({ a, t, k, snap });
  return steps;
}

/* Membuat langkah pengurutan yang terlihat sebelum Binary Search dimulai.
   Dipakai insertion sort agar prosesnya mudah dibaca: elemen aktif
   dibandingkan lalu digeser sampai posisi yang benar. */
function buatLangkahUrutBinary(data, t) {
  const a = [...data];
  const n = a.length;
  const steps = [];
  let c = 0;

  const snap = (msg, o = {}) => steps.push({
    data: [...a],
    lo: 0, hi: n - 1, mid: -1, cmp: -1, found: -1,
    phase: 'sort',
    ...o,
    msg,
    c,
    hasil: 'mengurutkan data'
  });

  snap(`Binary Search membutuhkan data terurut. Data masih acak: [${a.join(', ')}]. Data akan diurutkan otomatis terlebih dahulu.`,
    { phase: 'sort', hasil: 'menyiapkan pengurutan' });

  // Insertion sort visual.
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;

    snap(`Pengurutan: ambil nilai ${key} pada indeks ${i}, lalu cari posisi yang tepat.`,
      { cmp: i, mid: i, phase: 'sort' });

    while (j >= 0 && a[j] > key) {
      c++;
      snap(`Bandingkan ${a[j]} dengan ${key}. Karena ${a[j]} > ${key}, ${a[j]} digeser ke kanan.`,
        { cmp: j, mid: i, phase: 'sort' });
      a[j + 1] = a[j];
      j--;
      snap(`Setelah pergeseran, ${key} sementara ditempatkan pada indeks ${j + 1}.`,
        { cmp: j + 1, mid: i, phase: 'sort' });
    }

    c++;
    a[j + 1] = key;
    snap(`Nilai ${key} ditempatkan pada indeks ${j + 1}. Bagian kiri sekarang terurut.`,
      { cmp: j + 1, phase: 'sort' });
  }

  snap(`Pengurutan selesai. Data sekarang terurut: [${a.join(', ')}]. Selanjutnya Binary Search mencari target ${t}.`,
    { phase: 'transition', hasil: 'data terurut' });

  return { data: a, steps, count: c };
}

/* ---------- 3. Antarmuka & pemutar ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const state = initPemilihAlgoritma(
    Object.fromEntries(Object.entries(INFO).map(([id, v]) => [id, v[0]]))
  );
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const P = {
    data: [],
    steps: [],
    idx: 0,
    timer: null,
    cells: [],
    diurutkan: false
  };
  const JEDA_MS = [1000, 600, 350, 180, 60];
  const MAX_N = 20;

  const terakhir = () => P.steps.length - 1;
  const berjalan = () => P.timer !== null;
  const jeda = () => {
    clearTimeout(P.timer);
    P.timer = null;
    if (P.steps.length) perbaruiTombol();
  };
  const tampilGalat = (msg) => {
    $('pesan-galat').textContent = msg;
    $('pesan-galat').hidden = !msg;
  };
  const cekTarget = () => {
    const ok = /^-?\d+$/.test($('input-target').value.trim());
    tampilGalat(ok ? '' : 'Target harus berupa bilangan bulat.');
    return ok;
  };

  function penanda(st, i) {
    if (st.found === i) return 'Ditemukan';
    if (st.phase === 'sort') return st.cmp === i ? 'Diperiksa' : '';
    if (st.phase === 'transition') return '';
    if (st.found >= 0) return '';
    if (state.algo === 'linear') return st.cmp === i ? 'Diperiksa' : '';

    const ada = st.lo <= st.hi, r = [];
    if (ada && i === st.lo) r.push('low');
    if (i === st.mid) r.push('mid');
    if (ada && i === st.hi) r.push('high');
    return r.join('/');
  }

  function kelas(st, i) {
    if (st.phase === 'sort') {
      return `cell ${st.cmp === i || st.mid === i ? 'compare' : ''}`.trim();
    }
    if (st.found === i) return 'cell done';
    const c = st.mid === i ? 'swap' : st.cmp === i ? 'compare' : '';
    return `cell ${c || (i < st.lo || i > st.hi ? 'dim' : '')}`.trim();
  }

  function render() {
    const st = P.steps[P.idx];
    if (!st) return;

    P.cells.forEach((el, i) => {
      const [nilai, indeks, tanda] = el.children;
      nilai.textContent = st.data[i];
      indeks.textContent = `[${i}]`;
      tanda.textContent = penanda(st, i);
      el.className = kelas(st, i);
    });

    $('penjelasan').textContent = st.msg;
    $('n-langkah').textContent = st.c;
    $('hasil').textContent = st.hasil;

    // Label proses supaya mahasiswa langsung melihat bahwa Binary Search
    // belum dimulai sampai data selesai diurutkan.
    if (state.algo === 'binary') {
      $('peringatan').textContent =
        st.phase === 'sort' || st.phase === 'transition'
          ? 'Tahap 1: data sedang diurutkan otomatis sebelum Binary Search.'
          : 'Tahap 2: data sudah terurut, Binary Search dimulai.';
    }
    perbaruiTombol();
  }

  function perbaruiTombol() {
    const selesai = P.idx === terakhir();
    $('btn-mulai').disabled = berjalan();
    $('btn-mulai').textContent = selesai ? 'Ulangi' : 'Mulai';
    $('btn-jeda').disabled = !berjalan();
    $('btn-langkah').disabled = selesai;
  }

  /* Susun langkah awal. Untuk Binary Search yang datanya masih acak,
     visualisasi TIDAK langsung mengurutkan data. Data tetap terlihat acak
     sampai tombol "Mulai" ditekan. Saat "Mulai" ditekan, data langsung
     berubah menjadi terurut di dalam box, lalu Binary Search berjalan. */
  function susun() {
    jeda();
    if (!cekTarget()) return;

    const target = Number($('input-target').value);
    const dataAwal = [...P.data];

    P.diurutkan = state.algo === 'binary' && terurut(dataAwal);

    if (state.algo === 'binary' && !terurut(dataAwal)) {
      P.steps = [{
        data: [...dataAwal],
        lo: 0, hi: dataAwal.length - 1, mid: -1, cmp: -1, found: -1,
        phase: 'idle', c: 0,
        msg: `Data masih acak: [${dataAwal.join(', ')}]. Klik Mulai untuk mengurutkan data terlebih dahulu, kemudian menjalankan Binary Search.`,
        hasil: 'belum dimulai'
      }];
    } else {
      P.steps = buatLangkah(state.algo, dataAwal, target);
    }

    $('peringatan').hidden = state.algo !== 'binary';
    P.idx = 0;
    render();
  }

  /* Menyiapkan Binary Search tepat ketika tombol "Mulai" ditekan.
     Data pada box langsung menjadi terurut, kemudian ada satu jeda singkat
     agar perubahan urutan terlihat sebelum indikator Binary Search bergerak. */
  function siapkanBinarySaatMulai() {
    if (state.algo !== 'binary' || terurut(P.data)) return false;

    const target = Number($('input-target').value);
    const hasilUrut = [...P.data].sort((a, b) => a - b);
    const langkahCari = buatLangkah('binary', hasilUrut, target);

    // Hapus snapshot pembuka agar setelah data terurut, langkah berikutnya
    // langsung merupakan langkah Binary Search.
    if (langkahCari.length) langkahCari.shift();

    P.data = hasilUrut;
    P.diurutkan = true;
    P.steps = [{
      data: [...hasilUrut],
      lo: 0, hi: hasilUrut.length - 1, mid: -1, cmp: -1, found: -1,
      phase: 'transition', c: 0,
      msg: `Data acak sudah diurutkan otomatis menjadi [${hasilUrut.join(', ')}]. Sekarang Binary Search dimulai untuk mencari ${target}.`,
      hasil: 'data terurut'
    }, ...langkahCari];
    P.idx = 0;
    render();
    return true;
  }

  function muatData(data) {
    P.data = [...data];
    P.diurutkan = false;
    stage.innerHTML = '';
    P.cells = P.data.map(() => {
      const el = document.createElement('div');
      el.innerHTML = '<span></span><small></small><small class="penanda"></small>';
      return stage.appendChild(el);
    });
    susun();
  }

  function dataAcak() {
    const s = new Set();
    const t = Number($('input-target').value);
    while (s.size < 10) s.add(1 + Math.floor(Math.random() * 99));
    const d = [...s];

    if (Number.isInteger(t) && t >= 1 && t <= 99 && !s.has(t) && Math.random() < 0.7) {
      d[Math.floor(Math.random() * 10)] = t;
    }
    return d;
  }

  function terapkanManual() {
    const token = $('input-manual').value.split(/[\s,;]+/).filter(Boolean);
    if (!token.length) {
      return tampilGalat('Masukkan angka dipisahkan koma, contoh: 3, 8, 12, 19.');
    }
    const salah = token.find((t) => !/^\d+$/.test(t) || +t < 1 || +t > 99);
    if (salah) {
      return tampilGalat(`"${salah}" tidak valid. Gunakan bilangan bulat 1–99.`);
    }
    if (token.length < 2 || token.length > MAX_N) {
      return tampilGalat(`Jumlah data harus 2–${MAX_N} angka (sekarang ${token.length}).`);
    }
    muatData(token.map(Number));
  }

  /* kontrol animasi */
  function mulai() {
    if (berjalan() || !cekTarget()) return;

    // Khusus Binary Search: saat Mulai diklik, box langsung berubah dari
    // data acak menjadi data terurut. Setelah jeda singkat, baru pencarian
    // Binary Search berjalan.
    if (state.algo === 'binary' && !terurut(P.data)) {
      siapkanBinarySaatMulai();
      const jedaSort = 900;
      P.timer = setTimeout(() => {
        P.timer = null;
        jalankanBinary();
      }, jedaSort);
      perbaruiTombol();
      return;
    }

    if (P.idx === terakhir()) susun();
    jalankanBinary();
  }

  function jalankanBinary() {
    if (P.idx >= terakhir()) return;

    const tick = () => {
      P.idx++;
      P.timer = P.idx < terakhir()
        ? setTimeout(tick, JEDA_MS[$('input-kecepatan').value - 1])
        : null;
      render();
    };
    tick();
  }

  function langkah() {
    if (!cekTarget()) return;
    jeda();

    // Pada Binary Search, satu klik Langkah pertama juga mengubah data acak
    // menjadi terurut; klik berikutnya menjalankan langkah pencarian.
    if (state.algo === 'binary' && !terurut(P.data)) {
      siapkanBinarySaatMulai();
      return;
    }

    if (P.idx === 0 && P.steps.length <= 1) susun();
    if (P.idx < terakhir()) {
      P.idx++;
      render();
    }
  }

  const reset = () => {
    jeda();
    P.idx = 0;
    render();
  };

  $('btn-buka').addEventListener('click', () =>
    (P.data.length ? susun() : muatData(dataAcak()))
  );
  $('btn-ganti').addEventListener('click', jeda);
  $('btn-mulai').addEventListener('click', mulai);
  $('btn-jeda').addEventListener('click', jeda);
  $('btn-langkah').addEventListener('click', langkah);
  $('btn-reset').addEventListener('click', reset);
  $('btn-acak').addEventListener('click', () => muatData(dataAcak()));
  $('btn-terapkan').addEventListener('click', terapkanManual);
  $('input-manual').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') terapkanManual();
  });
  $('input-target').addEventListener('change', susun);
});
