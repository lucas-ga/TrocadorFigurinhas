import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, MapPin, Star, Loader2, Users, ArrowRight } from 'lucide-react'
import api from '../services/api'
import type { Match } from '../types'

export default function FindMatches() {
    const [filters, setFilters] = useState({
        city: '',
        state: ''
    })

    const { data: matchesData, isLoading, refetch } = useQuery({
        queryKey: ['matches', filters],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters.city) params.append('city', filters.city)
            if (filters.state) params.append('state', filters.state)
            const response = await api.get(`/match/find?${params}`)
            return response.data
        }
    })

    const matches = matchesData?.data as Match[] || []
    const meta = matchesData?.meta

    const brazilianStates = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Search className="w-8 h-8 text-primary-600" />
                    Encontrar Trocas
                </h1>
                <p className="mt-2 text-gray-600">
                    Encontre pessoas compatíveis para trocar figurinhas
                </p>
            </div>

            {/* Info Cards */}
            {meta && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="card p-4 bg-yellow-50 border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-700">{meta.yourWantedCount}</div>
                        <div className="text-sm text-yellow-600">Figurinhas que você procura</div>
                    </div>
                    <div className="card p-4 bg-green-50 border-green-200">
                        <div className="text-2xl font-bold text-green-700">{meta.yourOwnedForTradeCount}</div>
                        <div className="text-sm text-green-600">Figurinhas para trocar</div>
                    </div>
                    <div className="card p-4 bg-primary-50 border-primary-200">
                        <div className="text-2xl font-bold text-primary-700">{meta.totalMatches}</div>
                        <div className="text-sm text-primary-600">Matches encontrados</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filtrar por estado
                        </label>
                        <select
                            className="input"
                            value={filters.state}
                            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                        >
                            <option value="">Todos os estados</option>
                            {brazilianStates.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filtrar por cidade
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Digite a cidade..."
                            value={filters.city}
                            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="btn-primary"
                    >
                        <Search className="w-4 h-4 mr-2 inline" />
                        Buscar
                    </button>
                </div>
            </div>

            {/* No Wanted Stickers Warning */}
            {meta?.yourWantedCount === 0 && (
                <div className="card p-8 text-center mb-6 bg-yellow-50 border-yellow-200">
                    <Users className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Adicione figurinhas que você precisa
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Para encontrar matches, primeiro adicione à sua lista as figurinhas que você está procurando.
                    </p>
                    <Link to="/my-collection" className="btn-primary inline-flex items-center">
                        Ir para Minha Coleção
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            )}

            {/* Results */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : matches.length > 0 ? (
                <div className="space-y-4">
                    {matches.map((match, index) => (
                        <div key={match.user.id} className="card p-6 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-start gap-6">
                                {/* User Info */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                                        {match.user.avatarUrl ? (
                                            <img src={match.user.avatarUrl} alt="" className="w-14 h-14 rounded-full" />
                                        ) : (
                                            <span className="text-2xl font-bold text-primary-600">
                                                {match.user.nickname[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <Link
                                            to={`/user/${match.user.nickname}`}
                                            className="font-semibold text-lg text-gray-900 hover:text-primary-600"
                                        >
                                            @{match.user.nickname}
                                        </Link>
                                        {(match.user.city || match.user.state) && (
                                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {[match.user.city, match.user.state].filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                        <div className="flex items-center mt-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="text-sm text-gray-600 ml-1">
                                                Score: {match.matchScore}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Match Details */}
                                <div className="flex-1 grid md:grid-cols-2 gap-4">
                                    {/* Can Offer (they have what you need) */}
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <h4 className="font-medium text-green-800 mb-2">
                                            Tem o que você precisa ({match.canOffer.length})
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {match.canOffer.slice(0, 8).map((sticker) => (
                                                <span
                                                    key={sticker.id}
                                                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                                                >
                                                    {sticker.code}
                                                </span>
                                            ))}
                                            {match.canOffer.length > 8 && (
                                                <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-sm font-medium">
                                                    +{match.canOffer.length - 8} mais
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Wants (they need what you have) */}
                                    <div className="bg-yellow-50 rounded-lg p-4">
                                        <h4 className="font-medium text-yellow-800 mb-2">
                                            Precisa do que você tem ({match.wants.length})
                                        </h4>
                                        {match.wants.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {match.wants.slice(0, 8).map((sticker) => (
                                                    <span
                                                        key={sticker.id}
                                                        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm"
                                                    >
                                                        {sticker.code}
                                                    </span>
                                                ))}
                                                {match.wants.length > 8 && (
                                                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm font-medium">
                                                        +{match.wants.length - 8} mais
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-yellow-600">
                                                Não identificamos figurinhas em comum, mas você pode propor uma troca
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex md:flex-col gap-2">
                                    <Link
                                        to={`/user/${match.user.nickname}`}
                                        className="btn-outline text-sm"
                                    >
                                        Ver Perfil
                                    </Link>
                                    <button className="btn-primary text-sm">
                                        Propor Troca
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : meta?.yourWantedCount > 0 ? (
                <div className="card p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Nenhum match encontrado
                    </h3>
                    <p className="text-gray-600">
                        Não encontramos usuários com as figurinhas que você procura no momento.
                        Tente novamente mais tarde ou ajuste seus filtros.
                    </p>
                </div>
            ) : null}
        </div>
    )
}
