const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');

function compile(filename, mod) {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  mod._compile(outputText, filename);
}

require.extensions['.ts'] = (mod, filename) => compile(filename, mod);
require.extensions['.css'] = (mod) => {
  mod.exports = new Proxy({}, { get: (_, key) => key === '__esModule' ? false : key });
};

function centralWith(tasks) {
  const data = {
    tasks,
    fronts: [{ tasks: tasks.map(task => task.id) }],
    updatedAt: '2026-11-21T12:00:00Z',
    revisions: Object.fromEntries(tasks.map(task => [task.id, 'revision'])),
  };
  const states = [data, '', false];
  const refs = [];
  let stateIndex;
  let refIndex;
  const hooks = {
    ...React,
    useCallback: callback => callback,
    useEffect() {},
    useMemo: factory => factory(),
    useRef(initial) {
      const index = refIndex++;
      return refs[index] ??= { current: initial };
    },
    useState(initial) {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], next => {
        states[index] = typeof next === 'function' ? next(states[index]) : next;
      }];
    },
  };
  const filename = path.resolve(__dirname, '../app/central-de-control/Control.tsx');
  const control = new Module(filename, module);
  control.filename = filename;
  control.paths = Module._nodeModulePaths(path.dirname(filename));
  const requestModule = control.require.bind(control);
  control.require = name => name === 'react' ? hooks : requestModule(name);
  compile(filename, control);
  return () => {
    stateIndex = 0;
    refIndex = 0;
    return control.exports.default();
  };
}

function find(node, predicate) {
  if (!React.isValidElement(node)) return undefined;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

const byId = (tree, id) => find(tree, node => node.props.id === id);
const label = (tree, value) => find(tree, node => node.type === 'button' && node.props['aria-label'] === value);
const button = (tree, value) => find(tree, node => node.type === 'button' && node.props.children === value);
const action = (id, fields) => ({
  id, name: id, stage: 'ready', baseStage: 'ready',
  issues: [], blockers: [], due: '', front: 'Primario',
  ...fields,
});

test('Detalles abre y cierra el contenido sin tocar el estado de una acción puntual o recurrente', (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => {
    throw new Error('El desplegable no debe enviar solicitudes');
  });
  const text = 'Materiales de prueba\n- Insumo A\n- Insumo B';
  const render = centralWith([
    action('Puntual', { description: text }),
    action('Recurrente', { stage: 'recurring', baseStage: 'recurring', comment: 'Nota de ejemplo' }),
  ]);

  for (const [name, content] of [['Puntual', text], ['Recurrente', 'Nota de ejemplo']]) {
    let tree = render();
    let details = label(tree, 'Detalles de ' + name);
    const id = details.props['aria-controls'];
    const controlsId = 'controls-' + name;
    assert.equal(details.props.type, 'button');
    assert.equal(details.props['aria-expanded'], false);
    assert.equal(byId(tree, id).props.hidden, true);
    assert.equal(byId(tree, controlsId).props.hidden, true);

    details.props.onClick();
    tree = render();
    assert.equal(label(tree, 'Detalles de ' + name).props['aria-expanded'], true);
    assert.equal(byId(tree, id).props.hidden, false);
    assert.ok(find(byId(tree, id), node => node.type === 'p' && node.props.children === content));
    assert.equal(byId(tree, controlsId).props.hidden, true);

    const statusToggle = find(tree, node => node.type === 'button' && node.props['aria-controls'] === controlsId);
    statusToggle.props.onClick();
    tree = render();
    const controls = byId(tree, controlsId);
    assert.equal(controls.props.hidden, false);
    assert.equal(button(controls, 'Por hoy ya estamos').props.disabled, false);
    assert.equal(Boolean(button(controls, 'Finalizada')), name === 'Puntual');
    assert.equal(button(controls, 'Confirmar finalización'), undefined);

    label(tree, 'Detalles de ' + name).props.onClick();
    tree = render();
    assert.equal(label(tree, 'Detalles de ' + name).props['aria-expanded'], false);
    assert.equal(byId(tree, id).props.hidden, true);
    assert.equal(byId(tree, controlsId).props.hidden, false);
    assert.equal(button(byId(tree, controlsId), 'Confirmar finalización'), undefined);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('Detalles se omite si está vacío y muestra una sola vez el contexto repetido', () => {
  const tree = centralWith([
    action('Vacía', { description: ' \n ', comment: '\t' }),
    action('Sin campos', {}),
    action('Repetida', { description: 'Insumo de prueba', comment: ' Insumo de prueba ' }),
    action('Completa', { description: 'Contexto de prueba', comment: 'Comentario de prueba' }),
  ])();
  for (const name of ['Vacía', 'Sin campos']) {
    assert.equal(label(tree, 'Detalles de ' + name), undefined);
    assert.equal(byId(tree, 'details-' + name), undefined);
  }
  const repeated = byId(tree, 'details-Repetida');
  assert.ok(find(repeated, node => node.props.children === 'Contexto del proyecto'));
  assert.equal(find(repeated, node => node.props.children === 'Comentario'), undefined);
  const complete = byId(tree, 'details-Completa');
  assert.ok(find(complete, node => node.props.children === 'Contexto de prueba'));
  assert.ok(find(complete, node => node.props.children === 'Comentario de prueba'));
});
