import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { User, MapPin, Star, Calendar, Loader2 } from 'lucide-react'
import api from '../services/api'

export default function UserProfile() {
    const { nickname } = useParams<{ nickname: string }>()

    const { data: userData, isLoading } = useQuery({
        queryKey: ['user', nickname],
        queryFn: async () => {
            const response = await api.get(`/users/${nickname}`)
            return response.data.data
        },
        enabled: !!nickname
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        )
    }

    if (!userData) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Usuário não encontrado</h2>
                <p className="text-gray-600 mt-2">O perfil que você procura não existe.</p>
            </div>
        )
    }

    const user = userData
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-32 rounded-t-xl" />

                <div className="px-6 pb-6">
                    {/* Avatar and Info */}
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 mb-6">
                        <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 pt-4 md:pt-0">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                                    <p className="text-gray-500">@{user.nickname}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {user.rating && (
                                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                            <span className="font-semibold text-yellow-700">
                                                {user.rating.average.toFixed(1)}
                                            </span>
                                            <span className="text-sm text-yellow-600">
                                                ({user.rating.count} avaliações)
                                            </span>
                                        </div>
                                    )}
                                    {user.isVerified && (
                                        <span className="badge bg-green-100 text-green-800">Verificado</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <p className="text-gray-600 mb-6">{user.bio}</p>
                    )}

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-gray-600 mb-6">
                        {(user.city || user.state) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{[user.city, user.state].filter(Boolean).join(', ')}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Membro desde {formatDate(user.createdAt)}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="card p-4 text-center bg-green-50 border-green-200">
                            <div className="text-2xl font-bold text-green-700">
                                {user._count?.ownedStickers || 0}
                            </div>
                            <div className="text-sm text-green-600">Para troca</div>
                        </div>
                        <div className="card p-4 text-center bg-yellow-50 border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-700">
                                {user._count?.wantedStickers || 0}
                            </div>
                            <div className="text-sm text-yellow-600">Procurando</div>
                        </div>
                        <div className="card p-4 text-center bg-primary-50 border-primary-200">
                            <div className="text-2xl font-bold text-primary-700">
                                {user._count?.receivedRatings || 0}
                            </div>
                            <div className="text-sm text-primary-600">Trocas avaliadas</div>
                        </div>
                    </div>

                    {/* Last Ratings */}
                    {user.lastRatings && user.lastRatings.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Últimas avaliações</h3>
                            <div className="space-y-3">
                                {user.lastRatings.map((rating: any, index: number) => (
                                    <div key={index} className="card p-4 bg-gray-50">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                {rating.rater.avatarUrl ? (
                                                    <img src={rating.rater.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                                                ) : (
                                                    <span className="text-sm font-bold text-primary-600">
                                                        {rating.rater.nickname[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-900">@{rating.rater.nickname}</span>
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-4 h-4 ${i < rating.score ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                {rating.comment && (
                                                    <p className="text-gray-600 text-sm">{rating.comment}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
