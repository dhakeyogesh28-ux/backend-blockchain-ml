import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Shield, User, Search, Loader2, MessageSquare, MoreVertical, Paperclip, MapPin, ExternalLink, Clock } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  user_email: string
  message: string
  is_admin: boolean
  created_at: string
}

interface ChatThread {
  email: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  messages: ChatMessage[]
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [threads, setThreads] = useState<Record<string, ChatThread>>({})
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchInitialThreads()

    const channel = supabase
      .channel('public:admin_broadcasts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_broadcasts' },
        (payload) => {
          handleIncomingMessage(payload.new as ChatMessage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedUserEmail, threads])

  const fetchInitialThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_broadcasts')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      if (data) {
        const groupedThreads: Record<string, ChatThread> = {}
        data.forEach((msg: ChatMessage) => {
          if (!groupedThreads[msg.user_email]) {
            groupedThreads[msg.user_email] = {
              email: msg.user_email,
              lastMessage: msg.message,
              timestamp: msg.created_at,
              unreadCount: 0,
              messages: [],
            }
          }
          groupedThreads[msg.user_email].messages.push(msg)
          groupedThreads[msg.user_email].lastMessage = msg.message
          groupedThreads[msg.user_email].timestamp = msg.created_at
        })
        setThreads(groupedThreads)
      }
    } catch (error: any) {
      toast.error('Failed to load chat history')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIncomingMessage = (msg: ChatMessage) => {
    setThreads((prev) => {
      const newThreads = { ...prev }
      if (!newThreads[msg.user_email]) {
        newThreads[msg.user_email] = {
          email: msg.user_email,
          lastMessage: msg.message,
          timestamp: msg.created_at,
          unreadCount: 0,
          messages: [],
        }
      }
      
      if (!newThreads[msg.user_email].messages.find(m => m.id === msg.id)) {
        newThreads[msg.user_email].messages = [...newThreads[msg.user_email].messages, msg]
        newThreads[msg.user_email].lastMessage = msg.message
        newThreads[msg.user_email].timestamp = msg.created_at
        
        if (selectedUserEmail !== msg.user_email && !msg.is_admin) {
          newThreads[msg.user_email].unreadCount++
        }
      }
      
      return newThreads
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserEmail) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    try {
      const { error } = await supabase.from('admin_broadcasts').insert({
        user_email: selectedUserEmail,
        message: messageText,
        is_admin: true,
      })

      if (error) throw error
    } catch (error: any) {
      toast.error('Failed to send message')
      console.error(error)
      setNewMessage(messageText)
    } finally {
      setIsSending(false)
    }
  }

  const handleTrackUser = async () => {
    if (!selectedUserEmail) return
    setIsTracking(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('last_lat, last_lng, name')
        .eq('email', selectedUserEmail)
        .maybeSingle()

      if (error) throw error
      if (!data?.last_lat || !data?.last_lng) {
        toast.error('No live location available for this user')
        return
      }

      // Navigate to Map with search params
      const name = data.name || selectedUserEmail.split('@')[0]
      navigate(`/?track=${encodeURIComponent(selectedUserEmail)}&lat=${data.last_lat}&lng=${data.last_lng}&name=${encodeURIComponent(name)}`)
    } catch (err) {
      toast.error('Failed to retrieve user location')
    } finally {
      setIsTracking(false)
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isToday(d)) return format(d, 'h:mm a')
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
    return format(d, 'MMM d, h:mm a')
  }

  const filteredThreads = Object.values(threads)
    .filter(t => t.email.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const selectedThread = selectedUserEmail ? threads[selectedUserEmail] : null

  return (
    <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto overflow-hidden">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Admin Support</h1>
          <p className="text-gray-400 mt-1">Manage private user communications and live tracking.</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-[#141414] border border-[#1e1e1e] rounded-2xl shadow-2xl">
        {/* Sidebar */}
        <div className="w-80 lg:w-96 border-r border-[#1e1e1e] flex flex-col bg-[#0f0f0f]">
          <div className="p-4 border-b border-[#1e1e1e]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pt-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-10 px-4 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-10" />
                <p className="text-sm">No conversations found.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.email}
                  onClick={() => {
                    setSelectedUserEmail(thread.email)
                    setThreads(prev => ({
                      ...prev,
                      [thread.email]: { ...prev[thread.email], unreadCount: 0 }
                    }))
                  }}
                  className={`w-full flex items-center gap-3 p-4 transition-all border-l-2 ${
                    selectedUserEmail === thread.email
                      ? 'bg-blue-500/5 border-blue-500'
                      : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                    {thread.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-semibold text-gray-200 truncate">{thread.email.split('@')[0]}</span>
                      <span className="text-[10px] text-gray-500">
                        {formatMessageTime(thread.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${thread.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                        {thread.lastMessage}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="bg-blue-600 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#141414] relative">
          {!selectedUserEmail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
              <div className="p-4 rounded-full bg-white/5 mb-4">
                <MessageSquare className="w-12 h-12 opacity-20" />
              </div>
              <p className="text-lg font-medium">Select a user to start chatting</p>
              <p className="text-sm opacity-50">Private 1-to-1 secure support channel</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#1e1e1e] flex justify-between items-center bg-[#141414]/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold relative">
                    {selectedUserEmail[0].toUpperCase()}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#141414] rounded-full"></div>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white mb-0.5">{selectedUserEmail}</h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-[10px] text-gray-500 font-medium">Online</span>
                      </div>
                      <button 
                        onClick={handleTrackUser}
                        disabled={isTracking}
                        className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        {isTracking ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />}
                        View Live Location
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedThread?.messages.map((msg, i) => {
                  const isMe = msg.is_admin
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMe ? 'flex flex-row-reverse' : 'flex flex-row'} items-end gap-2`}>
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-[#1e1e1e] text-gray-200 rounded-bl-none border border-[#2a2a2a]'
                          }`}
                        >
                          {msg.message}
                          <div className={`text-[9px] mt-1.5 font-medium flex items-center gap-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                            <Clock size={8} />
                            {formatMessageTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-[#0f0f0f] border-t border-[#1e1e1e]">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <button type="button" className="p-2.5 text-gray-500 hover:text-blue-500 rounded-xl hover:bg-white/5 transition-all outline-none">
                    <Paperclip size={20} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-5 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all text-sm"
                      disabled={isSending}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center min-w-[50px]"
                  >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
