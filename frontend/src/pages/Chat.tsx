import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, ArrowLeft, Loader2, User } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

interface Message {
    id: string
    content: string
    createdAt: string
    isRead: boolean
    isMine: boolean
    sender: {
        id: string
        name: string
        nickname: string
        avatarUrl: string | null
    }
}

interface Conversation {
    id: string
    otherUser: {
        id: string
        name: string
        nickname: string
        avatarUrl: string | null
    }
    messages: Message[]
}

interface ConversationPreview {
    id: string
    otherUser: {
        id: string
        name: string
        nickname: string
        avatarUrl: string | null
    }
    lastMessage: {
        content: string
        createdAt: string
        isRead: boolean
        isMine: boolean
    } | null
    updatedAt: string
}

export default function Chat() {
    const { conversationId, nickname } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const [message, setMessage] = useState('')
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Se veio um nickname, busca/cria a conversa
    const { data: conversationByNickname, isLoading: loadingByNickname } = useQuery({
        queryKey: ['chat-by-nickname', nickname],
        queryFn: async () => {
            const response = await api.get(`/chat/user/${nickname}`)
            return response.data.data
        },
        enabled: !!nickname && !conversationId
    })

    // Atualiza o currentConversationId quando encontrar por nickname
    useEffect(() => {
        if (conversationByNickname?.conversationId) {
            setCurrentConversationId(conversationByNickname.conversationId)
        }
    }, [conversationByNickname])

    // Lista de conversas
    const { data: conversationsData, isLoading: loadingConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const response = await api.get('/chat/conversations')
            return response.data
        },
        refetchInterval: 5000 // Atualiza a cada 5 segundos
    })

    const conversations = conversationsData?.data as ConversationPreview[] || []

    // Mensagens da conversa atual
    const { data: conversationData, isLoading: loadingMessages } = useQuery({
        queryKey: ['conversation', currentConversationId],
        queryFn: async () => {
            const response = await api.get(`/chat/conversations/${currentConversationId}`)
            return response.data.data as Conversation
        },
        enabled: !!currentConversationId,
        refetchInterval: 3000 // Atualiza a cada 3 segundos
    })

    // Scroll para última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversationData?.messages])

    // Enviar mensagem
    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            const response = await api.post(`/chat/conversations/${currentConversationId}/messages`, { content })
            return response.data.data
        },
        onSuccess: () => {
            setMessage('')
            queryClient.invalidateQueries({ queryKey: ['conversation', currentConversationId] })
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
    })

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (message.trim() && currentConversationId) {
            sendMessage.mutate(message.trim())
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        
        if (isToday) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + 
               date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const otherUser = conversationData?.otherUser || conversationByNickname?.otherUser

    if (loadingByNickname) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-64px)] flex">
            {/* Sidebar - Lista de conversas */}
            <div className={`w-full md:w-80 border-r bg-white flex flex-col ${currentConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <MessageCircle className="w-6 h-6 text-primary-600" />
                        Mensagens
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma conversa ainda</p>
                            <p className="text-sm mt-1">Encontre um match e inicie uma troca!</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => {
                                    setCurrentConversationId(conv.id)
                                    navigate(`/chat/${conv.id}`, { replace: true })
                                }}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 border-b transition-colors ${
                                    currentConversationId === conv.id ? 'bg-primary-50' : ''
                                }`}
                            >
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    {conv.otherUser.avatarUrl ? (
                                        <img src={conv.otherUser.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                                    ) : (
                                        <span className="text-lg font-bold text-primary-600">
                                            {conv.otherUser.nickname[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="font-medium text-gray-900">@{conv.otherUser.nickname}</div>
                                    {conv.lastMessage && (
                                        <div className={`text-sm truncate ${conv.lastMessage.isRead || conv.lastMessage.isMine ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                                            {conv.lastMessage.isMine && <span className="text-gray-400">Você: </span>}
                                            {conv.lastMessage.content}
                                        </div>
                                    )}
                                </div>
                                {conv.lastMessage && (
                                    <div className="text-xs text-gray-400">
                                        {formatTime(conv.lastMessage.createdAt)}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-gray-50 ${currentConversationId ? 'flex' : 'hidden md:flex'}`}>
                {currentConversationId && otherUser ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white border-b flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setCurrentConversationId(null)
                                    navigate('/chat', { replace: true })
                                }}
                                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <Link to={`/user/${otherUser.nickname}`} className="flex items-center gap-3 hover:opacity-80">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    {otherUser.avatarUrl ? (
                                        <img src={otherUser.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <span className="font-bold text-primary-600">
                                            {otherUser.nickname[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{otherUser.name}</div>
                                    <div className="text-sm text-gray-500">@{otherUser.nickname}</div>
                                </div>
                            </Link>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : conversationData?.messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Inicie a conversa!</p>
                                        <p className="text-sm mt-1">Envie uma mensagem para @{otherUser.nickname}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {conversationData?.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                                    msg.isMine
                                                        ? 'bg-primary-600 text-white rounded-br-md'
                                                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                                }`}
                                            >
                                                <p className="break-words">{msg.content}</p>
                                                <div className={`text-xs mt-1 ${msg.isMine ? 'text-primary-100' : 'text-gray-400'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 input"
                                    disabled={sendMessage.isPending}
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim() || sendMessage.isPending}
                                    className="btn-primary px-4"
                                >
                                    {sendMessage.isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-xl">Selecione uma conversa</p>
                            <p className="text-sm mt-1">Ou encontre matches para iniciar uma troca</p>
                            <Link to="/find-matches" className="btn-primary mt-4 inline-block">
                                Encontrar Matches
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
