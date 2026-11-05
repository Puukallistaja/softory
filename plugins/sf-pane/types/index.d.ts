export type AgentRow = {
  id: string
  role: string
  label: string
  status: 'running' | 'done' | 'error'
  tokens: number
  ms: number
  startedAt: number
}

export type RunStatus = {
  run?: string
  title?: string
  phase?: string
  round?: number
  maxRounds?: number
  findings?: { open?: number; fixed?: number }
  pr_url?: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'sf-pane': {
      agents: Shaped<AgentRow[]>
      status: Shaped<RunStatus | null>
    }
  }
}
