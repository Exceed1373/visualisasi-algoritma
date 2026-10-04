'use strict';
/* Bagian bersama: navigasi + pemilih algoritma (Scene 2 -> Scene 3/4). */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('menu');
  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', menu.classList.toggle('open'));
  });
  const file = location.pathname.split('/').pop() || 'index.html';
  menu.querySelectorAll('a').forEach((a) => {
    if (a.getAttribute('href') === file) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });
});

/** Mengatur pilihan kartu algoritma. `names` = { id: 'Nama Algoritma' }. Mengembalikan state { algo }. */
function initPemilihAlgoritma(names) {
  const state = { algo: null };
  const $ = (id) => document.getElementById(id);
  const tampilPilih = (ya) => { $('pilih').hidden = !ya; $('viz').hidden = ya; };

  $('algo-list').addEventListener('click', (e) => {
    const card = e.target.closest('.algo-card');
    if (!card) return;
    state.algo = card.dataset.algo;
    document.querySelectorAll('.algo-card').forEach((c) => {
      c.classList.toggle('active', c === card);
      c.setAttribute('aria-pressed', c === card);
    });
    $('btn-buka').disabled = false;
  });
  $('btn-buka').addEventListener('click', () => {
    $('algo-title').textContent = names[state.algo];
    tampilPilih(false);
    document.dispatchEvent(new CustomEvent('algo:buka', { detail: state.algo }));
    window.scrollTo(0, 0);
  });
  $('btn-ganti').addEventListener('click', () => {
    tampilPilih(true);
    document.dispatchEvent(new Event('algo:ganti'));
  });
  return state;
}
