function soundex(word) {
  if (!word || typeof word !== 'string') return '';
  const s = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return '';
  const first = s[0];
  const map = { B:1, F:1, P:1, V:1, C:2, G:2, J:2, K:2, Q:2, S:2, X:2, Z:2, D:3, T:3, L:4, M:5, N:5, R:6 };
  let prev = map[first] || 0;
  let out = first;
  for (let i = 1; i < s.length && out.length < 4; i++) {
    const ch = s[i];
    const code = map[ch] || 0;
    if (code === prev) continue;
    if (code !== 0) out += String(code);
    prev = code;
  }
  while (out.length < 4) out += '0';
  return out.slice(0,4);
}

console.log('sait ->', soundex('sait'));
console.log('salt ->', soundex('salt'));
console.log('sa1t ->', soundex('sa1t'));
console.log('5alt ->', soundex('5alt'));
