import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Repeat, Clock, Check, X, MessageSquare, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import type { Trade, TradeStatus } from '../types'

export default function Trades() {
    const queryClient = useQueryClient()

    const { data: tradesData, isLoading } = useQuery({
        queryKey: ['trades'],
        queryFn: async () => {
            const response = await api.get('/trades')
            return response.data.data as Trade[]
        }
    })

    const acceptTrade = useMutation({
        mutationFn: async (tradeId: string) => {
            await api.put(`/trades/${tradeId}/accept`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades'] })
            toast.success('Troca aceita!')
        }
    })

    const rejectTrade = useMutation({
        mutationFn: async (tradeId: string) => {
            await api.put(`/trades/${tradeId}/reject`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades'] })
            toast.success('Troca recusada')
        }
    })

    const completeTrade = useMutation({
        mutationFn: async (tradeId: string) => {
            await api.put(`/trades/${tradeId}/complete`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades'] })
            queryClient.invalidateQueries({ queryKey: ['my-collection'] })
            toast.success('Troca concluída! Figurinhas transferidas.')
        }
    })

    const getStatusBadge = (status: TradeStatus) => {
        const styles: Record<TradeStatus, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            ACCEPTED: 'bg-blue-100 text-blue-800',
            REJECTED: 'bg-red-100 text-red-800',
            CANCELLED: 'bg-gray-100 text-gray-800',
            COMPLETED: 'bg-green-100 text-green-800',
            EXPIRED: 'bg-gray-100 text-gray-500'
        }
        const labels: Record<TradeStatus, string> = {
            PENDING: 'Pendente',
            ACCEPTED: 'Aceita',
            REJECTED: 'Recusada',
            CANCELLED: 'Cancelada',
            COMPLETED: 'Concluída',
            EXPIRED: 'Expirada'
        }
        return (
            <span className={`badge ${styles[status]}`}>
                {labels[status]}
            </span>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const trades = tradesData || []
    const pendingReceived = trades.filter(t => t.status === 'PENDING')
    const accepted = trades.filter(t => t.status === 'ACCEPTED')
    const history = trades.filter(t => !['PENDING', 'ACCEPTED'].includes(t.status))

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Repeat className="w-8 h-8 text-primary-600" />
                    Minhas Trocas
                </h1>
                <p className="mt-2 text-gray-600">
                    Gerencie suas propostas de troca
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : trades.length === 0 ? (
                <div className="card p-8 text-center">
                    <Repeat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Nenhuma troca ainda
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Encontre matches e proponha trocas para completar seu álbum!
                    </p>
                    <Link to="/find-matches" className="btn-primary">
                        Encontrar Trocas
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Pending Trades */}
                    {pendingReceived.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                Propostas Pendentes ({pendingReceived.length})
                            </h2>
                            <div className="space-y-4">
                                {pendingReceived.map((trade) => (
                                    <TradeCard
                                        key={trade.id}
                                        trade={trade}
                                        getStatusBadge={getStatusBadge}
                                        formatDate={formatDate}
                                        onAccept={() => acceptTrade.mutate(trade.id)}
                                        onReject={() => rejectTrade.mutate(trade.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Accepted Trades */}
                    {accepted.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Check className="w-5 h-5 text-blue-500" />
                                Trocas Aceitas - Aguardando Conclusão ({accepted.length})
                            </h2>
                            <div className="space-y-4">
                                {accepted.map((trade) => (
                                    <TradeCard
                                        key={trade.id}
                                        trade={trade}
                                        getStatusBadge={getStatusBadge}
                                        formatDate={formatDate}
                                        onComplete={() => completeTrade.mutate(trade.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {history.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Histórico
                            </h2>
                            <div className="space-y-4">
                                {history.map((trade) => (
                                    <TradeCard
                                        key={trade.id}
                                        trade={trade}
                                        getStatusBadge={getStatusBadge}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

interface TradeCardProps {
    trade: Trade
    getStatusBadge: (status: TradeStatus) => JSX.Element
    formatDate: (date: string) => string
    onAccept?: () => void
    onReject?: () => void
    onComplete?: () => void
}

function TradeCard({ trade, getStatusBadge, formatDate, onAccept, onReject, onComplete }: TradeCardProps) {
    const offeredStickers = trade.items.filter(i => i.offeredSticker)
    const requestedStickers = trade.items.filter(i => i.requestedSticker)

    return (
        <div className="card p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* User and Status */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-primary-600">
                            {trade.sender.nickname[0].toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                to={`/user/${trade.sender.nickname}`}
                                className="font-semibold text-gray-900 hover:text-primary-600"
                            >
                                @{trade.sender.nickname}
                            </Link>
                            <span className="text-gray-400">→</span>
                            <Link
                                to={`/user/${trade.receiver.nickname}`}
                                className="font-semibold text-gray-900 hover:text-primary-600"
                            >
                                @{trade.receiver.nickname}
                            </Link>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            {getStatusBadge(trade.status)}
                            <span>{formatDate(trade.createdAt)}</span>
                        </div>
                        {trade.message && (
                            <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{trade.message}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stickers */}
                <div className="flex gap-4 flex-1 justify-center">
                    {/* Offered */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 mb-2">Oferece</div>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {offeredStickers.slice(0, 5).map((item) => (
                                <span key={item.id} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                    {item.offeredSticker?.code}
                                </span>
                            ))}
                            {offeredStickers.length > 5 && (
                                <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                                    +{offeredStickers.length - 5}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center text-gray-300">
                        <Repeat className="w-5 h-5" />
                    </div>

                    {/* Requested */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 mb-2">Quer</div>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {requestedStickers.slice(0, 5).map((item) => (
                                <span key={item.id} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                    {item.requestedSticker?.code}
                                </span>
                            ))}
                            {requestedStickers.length > 5 && (
                                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                                    +{requestedStickers.length - 5}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-start">
                    {trade.status === 'PENDING' && onAccept && onReject && (
                        <>
                            <button onClick={onAccept} className="btn-success text-sm">
                                <Check className="w-4 h-4 mr-1 inline" />
                                Aceitar
                            </button>
                            <button onClick={onReject} className="btn-danger text-sm">
                                <X className="w-4 h-4 mr-1 inline" />
                                Recusar
                            </button>
                        </>
                    )}
                    {trade.status === 'ACCEPTED' && onComplete && (
                        <button onClick={onComplete} className="btn-success text-sm">
                            <Check className="w-4 h-4 mr-1 inline" />
                            Marcar como Concluída
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
