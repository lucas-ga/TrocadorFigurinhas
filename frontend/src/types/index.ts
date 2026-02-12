// Types para o frontend

export interface User {
    id: string
    email: string
    name: string
    nickname: string
    phone?: string
    city?: string
    state?: string
    avatarUrl?: string
    bio?: string
    createdAt: string
    isVerified: boolean
    _count?: {
        ownedStickers: number
        wantedStickers: number
        receivedRatings: number
    }
    rating?: {
        average: number
        count: number
    }
}

export interface Album {
    id: string
    name: string
    year: number
    description?: string
    coverUrl?: string
    totalCards: number
    isActive: boolean
    sections?: Section[]
    _count?: {
        stickers: number
        sections: number
    }
}

export interface Section {
    id: string
    albumId: string
    name: string
    code: string
    orderIndex: number
    _count?: {
        stickers: number
    }
}

export type Rarity = 'COMMON' | 'RARE' | 'LEGENDARY' | 'SPECIAL'

export interface Sticker {
    id: string
    albumId: string
    sectionId: string
    code: string
    name: string
    number: number
    imageUrl?: string
    rarity: Rarity
    isSpecial: boolean
    section?: {
        name: string
        code: string
    }
}

export interface UserSticker {
    id: string
    userId: string
    stickerId: string
    quantity: number
    forTrade: boolean
    forSale: boolean
    price?: number
    sticker: Sticker
}

export interface UserWantedSticker {
    id: string
    userId: string
    stickerId: string
    priority: number
    sticker: Sticker
}

export type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED'

export interface Trade {
    id: string
    senderId: string
    receiverId: string
    status: TradeStatus
    message?: string
    responseMessage?: string
    createdAt: string
    updatedAt: string
    completedAt?: string
    sender: {
        id: string
        nickname: string
        avatarUrl?: string
        city?: string
        state?: string
    }
    receiver: {
        id: string
        nickname: string
        avatarUrl?: string
        city?: string
        state?: string
    }
    items: TradeItem[]
}

export interface TradeItem {
    id: string
    tradeId: string
    offeredId?: string
    requestedId?: string
    quantity: number
    offeredSticker?: Sticker
    requestedSticker?: Sticker
}

export type NotificationType =
    | 'TRADE_RECEIVED'
    | 'TRADE_ACCEPTED'
    | 'TRADE_REJECTED'
    | 'TRADE_COMPLETED'
    | 'MATCH_FOUND'
    | 'NEW_RATING'
    | 'SYSTEM'

export interface Notification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
    isRead: boolean
    createdAt: string
}

export interface Match {
    user: {
        id: string
        nickname: string
        avatarUrl?: string
        city?: string
        state?: string
    }
    canOffer: Array<{
        id: string
        code: string
        name: string
        section: { name: string; code: string }
    }>
    wants: Array<{
        id: string
        code: string
        name: string
        section: { name: string; code: string }
    }>
    matchScore: number
}

export interface Rating {
    id: string
    raterId: string
    ratedId: string
    tradeId?: string
    score: number
    comment?: string
    createdAt: string
    rater?: {
        nickname: string
        avatarUrl?: string
    }
}
