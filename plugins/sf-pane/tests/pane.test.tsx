import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'sf-pane',
  component: 'Pane',
  requestId: 'softory',
  props: { title: 'Factory', isFocused: false, bodyColumns: 44, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

test('the pane shows a finished builder with its tokens, on every surface', async ($, on) => {
  on('command.register', () => ({ value: { command: 'sf-pane' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('fs.exists', () => ({ value: false }))
  on('clock.now', () => ({ value: 1000 }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: { totalTokens: 182000, totalDurationMs: 61000 } }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Agent', subagent_type: 'sf:builder', description: 'builder-1', prompt: 'go' } as any)

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /builder-1 182k 61s/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /builder .*182k/ })).toBeDefined()
    expect(await ui.find({ key: 'dash' })).toBeDefined()
    await ui.unmount()
  }
})
