import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { User, MapPin, Phone, Mail, Save, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Profile() {
    const { user, updateUser } = useAuthStore()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: user?.name || '',
        nickname: user?.nickname || '',
        phone: user?.phone || '',
        city: user?.city || '',
        state: user?.state || '',
        bio: user?.bio || ''
    })

    const brazilianStates = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ]

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await api.put('/users/me', formData)
            updateUser(response.data.data)
            toast.success('Perfil atualizado com sucesso!')
            setIsEditing(false)
        } catch (error) {
            // Error handled by interceptor
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-32 rounded-t-xl" />

                <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="-mt-16 mb-4">
                        <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    {!isEditing ? (
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                                    <p className="text-gray-500">@{user?.nickname}</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-outline"
                                >
                                    Editar Perfil
                                </button>
                            </div>

                            {user?.bio && (
                                <p className="text-gray-600 mb-4">{user.bio}</p>
                            )}

                            <div className="space-y-2 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{user?.email}</span>
                                </div>
                                {user?.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                                {(user?.city || user?.state) && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{[user.city, user.state].filter(Boolean).join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome completo
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Apelido
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bio
                                </label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    placeholder="Conte um pouco sobre você..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telefone
                                    </label>
                                    <input
                                        type="tel"
                                        className="input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cidade
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        className="input"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    >
                                        <option value="">Selecione</option>
                                        {brazilianStates.map((state) => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="btn-primary flex items-center"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Salvar
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn-secondary"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
