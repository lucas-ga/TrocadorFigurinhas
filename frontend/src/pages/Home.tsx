import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
    Repeat, Users, Shield, Search, Star, ArrowRight,
    CheckCircle, TrendingUp, Zap
} from 'lucide-react'

export default function Home() {
    const { isAuthenticated } = useAuthStore()

    const features = [
        {
            icon: <Search className="w-6 h-6" />,
            title: 'Busca Inteligente',
            description: 'Encontre usuários que têm as figurinhas que você precisa e precisam das suas'
        },
        {
            icon: <Repeat className="w-6 h-6" />,
            title: 'Sistema de Trocas',
            description: 'Proponha e gerencie trocas de forma simples e organizada'
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: 'Reputação',
            description: 'Sistema de avaliações para garantir trocas seguras e confiáveis'
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: 'Comunidade',
            description: 'Conecte-se com colecionadores de todo o Brasil'
        }
    ]

    const steps = [
        {
            number: 1,
            title: 'Cadastre-se',
            description: 'Crie sua conta gratuitamente em segundos'
        },
        {
            number: 2,
            title: 'Adicione suas figurinhas',
            description: 'Marque as que você tem repetidas e as que precisa'
        },
        {
            number: 3,
            title: 'Encontre matches',
            description: 'Nosso sistema encontra os melhores parceiros de troca'
        },
        {
            number: 4,
            title: 'Realize trocas',
            description: 'Combine a entrega e complete seu álbum!'
        }
    ]

    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                            Complete seu álbum da
                            <span className="block text-yellow-300">Copa 2026</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
                            A plataforma mais fácil para trocar figurinhas com outros colecionadores.
                            Encontre quem tem o que você precisa e troque suas repetidas!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/my-collection"
                                        className="btn bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-3"
                                    >
                                        <CheckCircle className="w-5 h-5 inline mr-2" />
                                        Minha Coleção
                                    </Link>
                                    <Link
                                        to="/find-matches"
                                        className="btn bg-yellow-400 text-gray-900 hover:bg-yellow-300 text-lg px-8 py-3"
                                    >
                                        <Search className="w-5 h-5 inline mr-2" />
                                        Encontrar Trocas
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/register"
                                        className="btn bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-3"
                                    >
                                        Começar Agora
                                        <ArrowRight className="w-5 h-5 inline ml-2" />
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-3"
                                    >
                                        Já tenho conta
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Wave divider */}
                <div className="relative h-16 md:h-24">
                    <svg
                        className="absolute bottom-0 w-full h-full"
                        viewBox="0 0 1440 100"
                        preserveAspectRatio="none"
                    >
                        <path
                            fill="#f9fafb"
                            d="M0,50 C150,100 350,0 600,50 C850,100 1050,0 1200,50 C1350,100 1440,50 1440,50 L1440,100 L0,100 Z"
                        />
                    </svg>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary-600">670</div>
                            <div className="text-gray-600">Figurinhas no álbum</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary-600">32</div>
                            <div className="text-gray-600">Seleções</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary-600">
                                <TrendingUp className="w-8 h-8 inline" />
                            </div>
                            <div className="text-gray-600">Matches em tempo real</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary-600">
                                <Zap className="w-8 h-8 inline" />
                            </div>
                            <div className="text-gray-600">100% Gratuito</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Por que usar o TrocadorFigurinhas?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Facilitamos a vida de quem quer completar o álbum sem gastar fortunas
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="card p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Como funciona?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Em 4 passos simples você já pode começar a trocar
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {steps.map((step) => (
                            <div key={step.number} className="relative">
                                <div className="card p-6 text-center">
                                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                                        {step.number}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600">
                                        {step.description}
                                    </p>
                                </div>
                                {step.number < 4 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                        <ArrowRight className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            O que dizem os usuários
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                name: 'João Silva',
                                city: 'São Paulo, SP',
                                text: 'Consegui completar meu álbum em apenas 2 semanas! O sistema de match é incrível.',
                                rating: 5
                            },
                            {
                                name: 'Maria Santos',
                                city: 'Rio de Janeiro, RJ',
                                text: 'Muito prático! Encontrei várias pessoas na minha região para trocar figurinhas.',
                                rating: 5
                            },
                            {
                                name: 'Pedro Costa',
                                city: 'Belo Horizonte, MG',
                                text: 'O melhor site para trocar figurinhas. Simples, rápido e seguro.',
                                rating: 5
                            }
                        ].map((testimonial, index) => (
                            <div key={index} className="card p-6">
                                <div className="flex items-center mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-4 italic">
                                    "{testimonial.text}"
                                </p>
                                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                <div className="text-sm text-gray-500">{testimonial.city}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!isAuthenticated && (
                <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Pronto para completar seu álbum?
                        </h2>
                        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                            Cadastre-se gratuitamente e comece a trocar figurinhas agora mesmo!
                        </p>
                        <Link
                            to="/register"
                            className="btn bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-3 inline-flex items-center"
                        >
                            Criar minha conta
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                    </div>
                </section>
            )}
        </div>
    )
}
