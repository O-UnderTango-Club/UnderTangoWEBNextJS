import test from 'node:test';
import assert from 'node:assert/strict';
import { countText } from '../app/academia/contador-de-palabras/count-text.ts';
import { academiaRewrite, isAcademiaPath } from '../src/lib/academia-routing.ts';

test('empty, whitespace and punctuation do not add words', () => {
  assert.deepEqual(countText(''), { words: 0, characters: 0, withoutSpaces: 0 });
  assert.equal(countText(' \t\n').words, 0);
  assert.equal(countText('… ¡! 👨‍👩‍👧‍👦').words, 0);
});
test('Spanish, line breaks, numbers and apostrophes are counted consistently', () => {
  assert.deepEqual(countText('Hola, tango!\n83'), { words: 3, characters: 15, withoutSpaces: 13 });
  assert.equal(countText('¿Aprendés? Sí: acción, corazón.').words, 4);
  assert.equal(countText("l'apprentissage d’Artagnan").words, 2);
  assert.equal(countText('online-presencial').words, 2);
});
test('visually combined characters and emoji remain one character', () => {
  assert.deepEqual(countText('e\u0301'), { words: 1, characters: 1, withoutSpaces: 1 });
  assert.deepEqual(countText('👨‍👩‍👧‍👦'), { words: 0, characters: 1, withoutSpaces: 1 });
  assert.equal(countText('tango '.repeat(20000)).words, 20000);
});
test('83 routes work at the root and at nested paths', () => {
  assert.equal(academiaRewrite('83.undertangoclub.com', '/'), '/academia');
  assert.equal(academiaRewrite('83.UNDERTANGOCLUB.com:3000', '/contador-de-palabras'), '/academia/contador-de-palabras');
  assert.equal(academiaRewrite('83.undertangoclub.com', '/tango'), '/academia/tango');
  assert.equal(academiaRewrite('83.undertangoclub.com', '/academia/tango'), null);
  assert.equal(academiaRewrite('83.undertangoclub.com', '/favicon.ico'), '/academia-icon.svg');
  for (const path of ['/assets/images/clasesImage1.png', '/_next/static/test.js', '/api/test', '/academia-icon.svg']) {
    assert.equal(academiaRewrite('83.undertangoclub.com', path), null);
  }
});
test('routing leaves existing hosts and similar names alone', () => {
  for (const host of ['undertangoclub.com', 'www.undertangoclub.com', 'aprende.undertangoclub.com', 'elitros.undertangoclub.com', '83.undertangoclub.com.example.com']) {
    assert.equal(academiaRewrite(host, '/'), null);
    assert.equal(academiaRewrite(host, '/operacion'), null);
  }
  assert.equal(isAcademiaPath('/academia'), true);
  assert.equal(isAcademiaPath('/academia/contador-de-palabras'), true);
  assert.equal(isAcademiaPath('/academia-otra'), false);
});
