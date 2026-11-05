import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentRow, RunStatus } from '../types'

const PANE = 'sofactory'
const STATUS_FILE = '.sofactory/status.json'
const ROLES = ['scout', 'builder', 'reviewer', 'verifier']

const agents = atom({ plugin: 'sf-pane', key: 'agents' } as const, [], { shape: 'agents-1' })
const status = atom({ plugin: 'sf-pane', key: 'status' } as const, null, { shape: 'status-1' })

const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : `${n}`)
const bar = (part: number, whole: number, width: number) => {
  const filled = whole > 0 ? Math.round((part / whole) * width) : 0
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled))
}

async function loadStatus($: EngineInterface) {
  try {
    const text = await $.fs.read(STATUS_FILE)
    const parsed = JSON.parse(String(text)) as RunStatus
    await update($, status, () => parsed)
  } catch {
    // No status yet: the pane shows its empty state.
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'sf-pane', description: 'Show the Sofactory pane beside the chat' })
    const ran = await next(e)
    if (await $.fs.exists('.sofactory')) {
      await loadStatus($)
      void $.ui.open({ id: PANE, title: 'Factory' })
    }
    return ran
  })

  on('command.run', { command: 'sf-pane' }, async $ => {
    await loadStatus($)
    await $.ui.open({ id: PANE, title: 'Factory' })
    return { text: 'Factory pane opened.' }
  })

  // Every subagent call: record it while it runs, then its tokens and time.
  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    // Plugin agents arrive namespaced (sf:builder): group by the bare role.
    const role = (e.subagent_type ?? 'general').split(':').pop() ?? 'general'
    const row: AgentRow = {
      id: e.tool_use_id,
      role,
      label: e.description ?? role,
      status: 'running',
      tokens: 0,
      ms: 0,
      startedAt: await $.clock.now(),
    }
    await update($, agents, list => [...list, row].slice(-60))
    const ran = await next(e)
    const res = ran.deny === undefined && ran.isError !== true ? (ran.result as any) : undefined
    const now = await $.clock.now()
    await update($, agents, list =>
      list.map(one =>
        one.id === row.id
          ? {
              ...one,
              status: res ? 'done' : 'error',
              tokens: Number(res?.totalTokens ?? 0),
              ms: Number(res?.totalDurationMs ?? now - one.startedAt),
            }
          : one,
      ),
    )
    return ran
  }).catch(($, e, next) => next(e))

  // The orchestrator rewrites .sofactory/status.json at each phase change.
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    if (String(e.file_path).endsWith(STATUS_FILE)) await loadStatus($)
    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const st = await read($, status)
    const list = await read($, agents)
    const cols = Math.max(20, (e.props.bodyColumns ?? 40) - 2)
    const barW = Math.max(6, Math.min(20, cols - 22))

    const byRole = ROLES.map(role => ({
      role,
      tokens: list.filter(a => a.role === role).reduce((s, a) => s + a.tokens, 0),
      runs: list.filter(a => a.role === role).length,
    })).filter(r => r.runs > 0)
    const total = byRole.reduce((s, r) => s + r.tokens, 0)
    const running = list.filter(a => a.status === 'running')
    const recent = list.slice(-8)

    const ask = (text: string) => () => void $.prompt.submit({ text, asUser: true })

    return (
      <Box flexDirection="column">
        <Text bold>{st?.title ?? 'No run yet'}</Text>
        <Text dimColor>
          {st?.phase ? `phase: ${st.phase}` : 'Run /sf:go to start'}
          {st?.round ? `  ·  round ${st.round}/${st.maxRounds ?? 3}` : ''}
        </Text>
        {st?.findings && (
          <Text dimColor>
            findings: {st.findings.open ?? 0} open, {st.findings.fixed ?? 0} fixed
          </Text>
        )}
        <Text> </Text>
        <Text bold>Tokens by role</Text>
        {byRole.length === 0 && <Text dimColor>No agents yet.</Text>}
        {byRole.map(r => (
          <Text>
            {r.role.padEnd(9)} {bar(r.tokens, total, barW)} {fmt(r.tokens)}
          </Text>
        ))}
        <Text> </Text>
        <Text bold>
          Agents {running.length > 0 ? `(${running.length} running)` : ''}
        </Text>
        {recent.map(a => (
          <Text dimColor={a.status !== 'running'}>
            {a.status === 'running' ? '● ' : a.status === 'done' ? '✓ ' : '✗ '}
            {a.label.slice(0, Math.max(8, cols - 16))} {a.status === 'running' ? '' : `${fmt(a.tokens)} ${Math.round(a.ms / 1000)}s`}
          </Text>
        ))}
        <Text> </Text>
        <Box flexDirection="row" gap={1}>
          {st?.phase === 'awaiting_approval' && (
            <Button key="approve" label="Approve run" variant="primary" onPress={ask('Approve and run')} />
          )}
          {st?.phase === 'human_review' && (
            <Button key="walk" label="Walk me through review" variant="primary" onPress={ask('/sf:review')} />
          )}
          <Button key="dash" label="Dashboard" onPress={ask('/sf:stats')} />
          <Button key="clear" label="Clear" onPress={() => update($, agents, () => [])} />
        </Box>
      </Box>
    )
  })
}
