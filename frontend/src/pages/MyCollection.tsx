import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    BookOpen, Plus, Minus, Search, Filter, Check,
    X, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import type { Album, Section, Sticker, UserSticker, UserWantedSticker } from '../types'

export default function MyCollection() {
    const queryClient = useQueryClient()
    const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
    const [selectedSection, setSelectedSection] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'all' | 'owned' | 'wanted' | 'missing'>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

    // Fetch albums
    const { data: albumsData } = useQuery({
        queryKey: ['albums'],
        queryFn: async () => {
            const response = await api.get('/stickers/albums')
            return response.data.data as Album[]
        }
    })

    // Auto-select first album
    useEffect(() => {
        if (albumsData && albumsData.length > 0 && !selectedAlbum) {
            setSelectedAlbum(albumsData[0].id)
        }
    }, [albumsData, selectedAlbum])

    // Fetch album details with sections
    const { data: albumDetails } = useQuery({
        queryKey: ['album', selectedAlbum],
        queryFn: async () => {
            const response = await api.get(`/stickers/albums/${selectedAlbum}`)
            return response.data.data as Album
        },
        enabled: !!selectedAlbum
    })

    // Fetch all stickers for the album
    const { data: stickers, isLoading: loadingStickers } = useQuery({
        queryKey: ['stickers', selectedAlbum, selectedSection],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (selectedSection) params.append('sectionId', selectedSection)
            const response = await api.get(`/stickers/albums/${selectedAlbum}/stickers?${params}`)
            return response.data.data as Sticker[]
        },
        enabled: !!selectedAlbum
    })

    // Fetch user's owned stickers
    const { data: ownedStickers } = useQuery({
        queryKey: ['my-collection', selectedAlbum],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (selectedAlbum) params.append('albumId', selectedAlbum)
            const response = await api.get(`/stickers/my-collection?${params}`)
            return response.data.data as UserSticker[]
        }
    })

    // Fetch user's wanted stickers
    const { data: wantedStickers } = useQuery({
        queryKey: ['my-wanted', selectedAlbum],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (selectedAlbum) params.append('albumId', selectedAlbum)
            const response = await api.get(`/stickers/my-wanted?${params}`)
            return response.data.data as UserWantedSticker[]
        }
    })

    // Create maps for quick lookup
    const ownedMap = new Map(ownedStickers?.map(s => [s.stickerId, s]) || [])
    const wantedMap = new Map(wantedStickers?.map(s => [s.stickerId, s]) || [])

    // Add to collection mutation
    const addToCollection = useMutation({
        mutationFn: async (stickerId: string) => {
            await api.post('/stickers/my-collection', { stickerId, quantity: 1 })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-collection'] })
            queryClient.invalidateQueries({ queryKey: ['my-wanted'] })
            toast.success('Figurinha adicionada à coleção!')
        }
    })

    // Add to wanted mutation
    const addToWanted = useMutation({
        mutationFn: async (stickerId: string) => {
            await api.post('/stickers/my-wanted', { stickerId })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-wanted'] })
            toast.success('Figurinha adicionada à lista de desejadas!')
        }
    })

    // Remove from collection mutation
    const removeFromCollection = useMutation({
        mutationFn: async (userStickerId: string) => {
            await api.delete(`/stickers/my-collection/${userStickerId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-collection'] })
            toast.success('Figurinha removida da coleção!')
        }
    })

    // Remove from wanted mutation
    const removeFromWanted = useMutation({
        mutationFn: async (userWantedId: string) => {
            await api.delete(`/stickers/my-wanted/${userWantedId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-wanted'] })
            toast.success('Figurinha removida da lista de desejadas!')
        }
    })

    // Filter stickers based on view mode and search
    const filteredStickers = stickers?.filter(sticker => {
        const matchesSearch = searchTerm === '' ||
            sticker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sticker.code.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        switch (viewMode) {
            case 'owned':
                return ownedMap.has(sticker.id)
            case 'wanted':
                return wantedMap.has(sticker.id)
            case 'missing':
                return !ownedMap.has(sticker.id)
            default:
                return true
        }
    })

    // Group stickers by section
    const stickersBySection = filteredStickers?.reduce((acc, sticker) => {
        const sectionId = sticker.sectionId
        if (!acc[sectionId]) {
            acc[sectionId] = []
        }
        acc[sectionId].push(sticker)
        return acc
    }, {} as Record<string, Sticker[]>)

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections)
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId)
        } else {
            newExpanded.add(sectionId)
        }
        setExpandedSections(newExpanded)
    }

    // Stats
    const totalStickers = stickers?.length || 0
    const ownedCount = ownedStickers?.length || 0
    const wantedCount = wantedStickers?.length || 0
    const missingCount = totalStickers - ownedCount
    const completionPercentage = totalStickers > 0 ? Math.round((ownedCount / totalStickers) * 100) : 0

    const getStickerStatus = (sticker: Sticker) => {
        if (ownedMap.has(sticker.id)) return 'owned'
        if (wantedMap.has(sticker.id)) return 'wanted'
        return 'missing'
    }

    const getRarityBadge = (rarity: string) => {
        switch (rarity) {
            case 'RARE':
                return <span className="badge-rare">Rara</span>
            case 'LEGENDARY':
                return <span className="badge-legendary">Lendária</span>
            case 'SPECIAL':
                return <span className="badge-special">Especial</span>
            default:
                return null
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-primary-600" />
                    Minha Coleção
                </h1>
                <p className="mt-2 text-gray-600">
                    Gerencie suas figurinhas e acompanhe seu progresso
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-primary-600">{completionPercentage}%</div>
                    <div className="text-sm text-gray-600">Completo</div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{ownedCount}</div>
                    <div className="text-sm text-gray-600">Tenho</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600">{wantedCount}</div>
                    <div className="text-sm text-gray-600">Procurando</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{missingCount}</div>
                    <div className="text-sm text-gray-600">Faltam</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar figurinha por nome ou código..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* View Mode */}
                    <div className="flex gap-2">
                        {[
                            { value: 'all', label: 'Todas' },
                            { value: 'owned', label: 'Tenho' },
                            { value: 'wanted', label: 'Procuro' },
                            { value: 'missing', label: 'Faltam' }
                        ].map((mode) => (
                            <button
                                key={mode.value}
                                onClick={() => setViewMode(mode.value as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === mode.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sections and Stickers */}
            {loadingStickers ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : (
                <div className="space-y-4">
                    {albumDetails?.sections?.map((section) => {
                        const sectionStickers = stickersBySection?.[section.id] || []
                        if (sectionStickers.length === 0 && viewMode !== 'all') return null

                        const isExpanded = expandedSections.has(section.id) || expandedSections.size === 0
                        const sectionOwned = sectionStickers.filter(s => ownedMap.has(s.id)).length

                        return (
                            <div key={section.id} className="card">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-lg text-gray-900">
                                            {section.name}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            ({section.code})
                                        </span>
                                        <span className="badge bg-primary-100 text-primary-700">
                                            {sectionOwned}/{sectionStickers.length || section._count?.stickers || 0}
                                        </span>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {sectionStickers.map((sticker) => {
                                            const status = getStickerStatus(sticker)
                                            const owned = ownedMap.get(sticker.id)
                                            const wanted = wantedMap.get(sticker.id)

                                            return (
                                                <div
                                                    key={sticker.id}
                                                    className={`sticker-card ${status} relative group`}
                                                >
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-gray-900">
                                                            {sticker.code}
                                                        </div>
                                                        <div className="text-xs text-gray-600 truncate">
                                                            {sticker.name}
                                                        </div>
                                                        {getRarityBadge(sticker.rarity)}

                                                        {owned && (
                                                            <div className="mt-2 text-sm text-green-600 font-medium">
                                                                {owned.quantity}x
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                                                        {!owned && !wanted && (
                                                            <>
                                                                <button
                                                                    onClick={() => addToCollection.mutate(sticker.id)}
                                                                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                                                                    title="Tenho essa"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => addToWanted.mutate(sticker.id)}
                                                                    className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                                                                    title="Preciso dessa"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {owned && (
                                                            <>
                                                                <button
                                                                    onClick={() => addToCollection.mutate(sticker.id)}
                                                                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                                                                    title="Adicionar mais uma"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => removeFromCollection.mutate(owned.id)}
                                                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                                    title="Remover"
                                                                >
                                                                    <Minus className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {wanted && (
                                                            <button
                                                                onClick={() => removeFromWanted.mutate(wanted.id)}
                                                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                                title="Remover da lista"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
