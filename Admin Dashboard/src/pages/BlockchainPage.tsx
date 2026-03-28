import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Link2, Shield, FileText, AlertTriangle, ExternalLink,
  CheckCircle, Clock, Hash, ChevronRight, Trophy,
  Users, Cpu, Box, Activity, Copy
} from 'lucide-react'

interface OnChainAlert {
  alert_id: string
  sender: string
  lat: number
  lng: number
  emergency_type: number
  timestamp: string
  mesh_path: string
  resolved: boolean
  tx_hash: string
  block_number: number
  polygonscan_url: string
}

interface OnChainReward {
  user_address: string
  total_points: number
  rank: string
  badges: string[]
  report_count: number
  checkin_count: number
}

const EMERGENCY_LABELS: Record<number, string> = {
  0: 'Medical', 1: 'Crime', 2: 'Fire', 3: 'Disaster', 4: 'Other'
}
const EMERGENCY_COLORS: Record<number, string> = {
  0: '#3b82f6', 1: '#ef4444', 2: '#f59e0b', 3: '#8b5cf6', 4: '#6b7280'
}

const CONTRACTS = [
  { name: 'SafeNetIdentity', desc: 'User identity & registration', network: 'Polygon Amoy', color: '#6366f1' },
  { name: 'SafeNetSOS', desc: 'SOS alert permanent ledger', network: 'Polygon Amoy', color: '#ef4444' },
  { name: 'SafeNetIncidentLedger', desc: 'Incident logging & verification', network: 'Polygon Amoy', color: '#f59e0b' },
  { name: 'SafeNetRewards', desc: 'On-chain gamified safety scores', network: 'Polygon Amoy', color: '#10b981' },
]



export default function BlockchainPage() {
  const [activeTab, setActiveTab] = useState<'contracts' | 'alerts' | 'rewards'>('contracts')
  const [alerts] = useState<OnChainAlert[]>([])
  const [rewards] = useState<OnChainReward[]>([])
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 1500)
  }

  const truncateHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`

  const stats = {
    totalAlerts: alerts.length,
    activeAlerts: alerts.filter(a => !a.resolved).length,
    totalRewards: rewards.reduce((s, r) => s + r.total_points, 0),
    totalUsers: rewards.length,
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#0f0f0f' }}>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'rgba(139,92,246,0.12)' }}>
                <Link2 size={20} className="text-purple-400" />
              </div>
              Blockchain Ledger
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-body">
              Polygon Amoy Testnet • 4 contracts deployed • Immutable safety records
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Box size={12} />
            Polygon Amoy • Syncing...
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'SOS Alerts On-Chain', value: stats.totalAlerts, icon: AlertTriangle, color: '#ef4444' },
            { label: 'Active (Unresolved)', value: stats.activeAlerts, icon: Activity, color: '#f59e0b' },
            { label: 'Reward Points Issued', value: stats.totalRewards.toLocaleString(), icon: Trophy, color: '#10b981' },
            { label: 'Registered Users', value: stats.totalUsers, icon: Users, color: '#6366f1' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-4"
              style={{ background: '#141414', border: '1px solid #1e1e1e' }}
            >
              <div className="flex items-center justify-between mb-2">
                <s.icon size={16} style={{ color: s.color }} />
                <span className="text-2xl font-display font-bold text-white">{s.value}</span>
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tab Nav */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
          {(['contracts', 'alerts', 'rewards'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              style={activeTab === tab ? { background: '#1e1e1e' } : {}}
            >
              {tab === 'contracts' ? '📋 Smart Contracts' :
               tab === 'alerts' ? '🚨 On-Chain SOS Alerts' : '🏆 Rewards Ledger'}
            </button>
          ))}
        </div>

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="grid grid-cols-2 gap-4">
            {CONTRACTS.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl p-5"
                style={{ background: '#141414', border: '1px solid #1e1e1e' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.color}15` }}>
                    <Cpu size={18} style={{ color: c.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.desc}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#1a1a1a' }}>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">Network</span>
                    <span className="text-xs text-purple-400 font-mono">{c.network}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#1a1a1a' }}>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">Status</span>
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle size={10} /> Deployed
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#1a1a1a' }}>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">Compiler</span>
                    <span className="text-xs text-gray-400 font-mono">Solidity ^0.8.24</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* On-Chain Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.alert_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-xl p-4"
                style={{ background: '#141414', border: '1px solid #1e1e1e' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 rounded-full"
                    style={{ background: alert.resolved ? '#10b981' : '#ef4444' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: `${EMERGENCY_COLORS[alert.emergency_type]}20`,
                          color: EMERGENCY_COLORS[alert.emergency_type],
                        }}>
                        {EMERGENCY_LABELS[alert.emergency_type]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: alert.resolved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: alert.resolved ? '#10b981' : '#ef4444',
                        }}>
                        {alert.resolved ? 'Resolved' : 'Active'}
                      </span>
                      {alert.mesh_path && (
                        <span className="text-[10px] text-purple-400">🕸 Mesh Relayed</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 cursor-pointer hover:text-gray-300"
                        onClick={() => copyToClipboard(alert.tx_hash)}>
                        <Hash size={10} />
                        {truncateHash(alert.tx_hash)}
                        <Copy size={9} className={copiedText === alert.tx_hash ? 'text-green-400' : ''} />
                      </span>
                      <span className="flex items-center gap-1"><Clock size={10} />{new Date(alert.timestamp).toLocaleString()}</span>
                      <span>Block #{alert.block_number.toLocaleString()}</span>
                    </div>
                  </div>
                  <a href={alert.polygonscan_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <ExternalLink size={12} /> Polygonscan
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Rewards Ledger Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-3">
            {rewards.map((reward, i) => (
              <motion.div
                key={reward.user_address}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl p-4"
                style={{ background: '#141414', border: '1px solid #1e1e1e' }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-center w-8"
                    style={{ color: i < 3 ? '#f59e0b' : '#6b7280' }}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-300 cursor-pointer hover:text-white"
                        onClick={() => copyToClipboard(reward.user_address)}>
                        {truncateHash(reward.user_address)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                        {reward.rank}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {reward.badges.map(b => (
                        <span key={b} className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{reward.total_points}</div>
                    <div className="text-[10px] text-gray-600">points</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
