// admin/design-boot.js: chooses the admin's design before the first paint (round 5,
// team/rounds/5/design/PROPOSAL.md 2.4). A classic script, linked in <head> before the stylesheets.
// 1. ?design=<name> in the address: this view only, never stored.
// 2. Else localStorage "cc.admin.design.v1", read inside try and catch; an unknown value is removed.
// 3. Else Ledger, the main admin design.
// With both ?embed and ?theme=light (the /play/ frame beside a /d/ visitor design, which is light only),
// it also sets data-theme="light" for this view only. It reads nothing else and sends nothing.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 5.
(function () {
  var NAMES = ['ledger', 'revista', 'azulejo', 'linho', 'costa', 'postal'], KEY = 'cc.admin.design.v1', d = null, q = null;
  try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
  var asked = q && q.get('design');
  if (asked && NAMES.indexOf(asked) >= 0) d = asked;
  if (!d) {
    try { var s = localStorage.getItem(KEY); if (s && NAMES.indexOf(s) >= 0) d = s; else if (s) localStorage.removeItem(KEY); } catch (e) { /* blocked: Ledger */ }
  }
  var root = document.documentElement;
  root.setAttribute('data-design', d || 'ledger');
  if (q && q.has('embed') && q.get('theme') === 'light') root.setAttribute('data-theme', 'light');
})();
