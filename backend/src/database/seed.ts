import { PrismaClient, Rarity } from '@prisma/client';

const prisma = new PrismaClient();

// Dados do álbum Copa 2026
const albumData = {
    name: 'Copa do Mundo FIFA 2026',
    year: 2026,
    description: 'Álbum oficial da Copa do Mundo FIFA 2026 - Estados Unidos, México e Canadá',
    totalCards: 670
};

// Seções do álbum (baseado no padrão Panini)
const sections = [
    { name: 'Introdução', code: 'FWC', count: 20, startNumber: 1 },
    { name: 'Estádios', code: 'EST', count: 16, startNumber: 21 },
    { name: 'Catar (Campeã 2022)', code: 'QAT', count: 20, startNumber: 37 },
    { name: 'Equador', code: 'ECU', count: 20, startNumber: 57 },
    { name: 'Senegal', code: 'SEN', count: 20, startNumber: 77 },
    { name: 'Holanda', code: 'NED', count: 20, startNumber: 97 },
    { name: 'Inglaterra', code: 'ENG', count: 20, startNumber: 117 },
    { name: 'Estados Unidos', code: 'USA', count: 20, startNumber: 137 },
    { name: 'País de Gales', code: 'WAL', count: 20, startNumber: 157 },
    { name: 'Argentina', code: 'ARG', count: 20, startNumber: 177 },
    { name: 'Arábia Saudita', code: 'KSA', count: 20, startNumber: 197 },
    { name: 'México', code: 'MEX', count: 20, startNumber: 217 },
    { name: 'Polônia', code: 'POL', count: 20, startNumber: 237 },
    { name: 'França', code: 'FRA', count: 20, startNumber: 257 },
    { name: 'Austrália', code: 'AUS', count: 20, startNumber: 277 },
    { name: 'Dinamarca', code: 'DEN', count: 20, startNumber: 297 },
    { name: 'Tunísia', code: 'TUN', count: 20, startNumber: 317 },
    { name: 'Espanha', code: 'ESP', count: 20, startNumber: 337 },
    { name: 'Costa Rica', code: 'CRC', count: 20, startNumber: 357 },
    { name: 'Alemanha', code: 'GER', count: 20, startNumber: 377 },
    { name: 'Japão', code: 'JPN', count: 20, startNumber: 397 },
    { name: 'Bélgica', code: 'BEL', count: 20, startNumber: 417 },
    { name: 'Canadá', code: 'CAN', count: 20, startNumber: 437 },
    { name: 'Marrocos', code: 'MAR', count: 20, startNumber: 457 },
    { name: 'Croácia', code: 'CRO', count: 20, startNumber: 477 },
    { name: 'Brasil', code: 'BRA', count: 20, startNumber: 497 },
    { name: 'Sérvia', code: 'SRB', count: 20, startNumber: 517 },
    { name: 'Suíça', code: 'SUI', count: 20, startNumber: 537 },
    { name: 'Camarões', code: 'CMR', count: 20, startNumber: 557 },
    { name: 'Portugal', code: 'POR', count: 20, startNumber: 577 },
    { name: 'Gana', code: 'GHA', count: 20, startNumber: 597 },
    { name: 'Uruguai', code: 'URU', count: 20, startNumber: 617 },
    { name: 'Coreia do Sul', code: 'KOR', count: 20, startNumber: 637 },
    { name: 'Coca-Cola', code: 'COC', count: 8, startNumber: 657 },
    { name: 'Legends', code: 'LEG', count: 5, startNumber: 665, special: true }
];

// Jogadores exemplo por seleção (simplificado)
const playersBySection: Record<string, string[]> = {
    'BRA': [
        'Escudo', 'Alisson', 'Ederson', 'Danilo', 'Militão',
        'Marquinhos', 'Bremer', 'Wendell', 'Casemiro', 'Bruno Guimarães',
        'Lucas Paquetá', 'Raphinha', 'Rodrygo', 'Vinicius Jr', 'Endrick',
        'Neymar Jr', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ],
    'ARG': [
        'Escudo', 'E. Martínez', 'Armani', 'Molina', 'Romero',
        'Otamendi', 'Lisandro Martínez', 'Acuña', 'De Paul', 'E. Fernández',
        'Lo Celso', 'Mac Allister', 'Di María', 'Á. Correa', 'Julián Álvarez',
        'Lautaro Martínez', 'Messi', 'Time - Foto 1', 'Time - Foto 2', 'Logo'
    ],
    'FRA': [
        'Escudo', 'Lloris', 'Maignan', 'Pavard', 'Varane',
        'Upamecano', 'Konaté', 'T. Hernández', 'Tchouaméni', 'Camavinga',
        'Rabiot', 'Griezmann', 'Dembélé', 'Coman', 'Giroud',
        'Mbappé', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ],
    'ENG': [
        'Escudo', 'Pickford', 'Ramsdale', 'Walker', 'Stones',
        'Maguire', 'Shaw', 'Trippier', 'Rice', 'Bellingham',
        'Mount', 'Foden', 'Saka', 'Sterling', 'Rashford',
        'Kane', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ],
    'GER': [
        'Escudo', 'Neuer', 'Ter Stegen', 'Kimmich', 'Rüdiger',
        'Schlotterbeck', 'Süle', 'Raum', 'Gündogan', 'Goretzka',
        'Musiala', 'Wirtz', 'Gnabry', 'Sané', 'Havertz',
        'Füllkrug', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ],
    'ESP': [
        'Escudo', 'Unai Simón', 'Raya', 'Carvajal', 'Laporte',
        'Pau Torres', 'Eric García', 'Alba', 'Pedri', 'Gavi',
        'Rodri', 'Koke', 'Olmo', 'F. Torres', 'Morata',
        'Lamine Yamal', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ],
    'POR': [
        'Escudo', 'Diogo Costa', 'Rui Patrício', 'Cancelo', 'Pepe',
        'Rúben Dias', 'Nuno Mendes', 'Dalot', 'Vitinha', 'Bruno Fernandes',
        'Bernardo Silva', 'João Félix', 'Leão', 'Diogo Jota', 'Gonçalo Ramos',
        'Cristiano Ronaldo', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ],
    'USA': [
        'Escudo', 'Turner', 'Horvath', 'Dest', 'Carter-Vickers',
        'Richards', 'Robinson', 'Scally', 'McKennie', 'Adams',
        'Musah', 'Reyna', 'Weah', 'Aaronson', 'Pulisic',
        'Pepi', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ],
    'MEX': [
        'Escudo', 'Ochoa', 'Talavera', 'J. Sánchez', 'Montes',
        'Moreno', 'Araujo', 'Gallardo', 'Edson Álvarez', 'Herrera',
        'Romo', 'Guardado', 'Chucky Lozano', 'Antuna', 'Vega',
        'Jiménez', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ],
    'CAN': [
        'Escudo', 'Borjan', 'Crépeau', 'Johnston', 'Vitória',
        'Miller', 'Cornelius', 'Adekugbe', 'Eustáquio', 'Hutchinson',
        'Koné', 'Buchanan', 'Davies', 'David', 'Hoilett',
        'Larin', 'Time - Foto 1', 'Time - Foto 2', 'Estádio', 'Logo'
    ]
};

// Gera nomes genéricos para seções não detalhadas
function generatePlayerNames(sectionCode: string, count: number): string[] {
    if (playersBySection[sectionCode]) {
        return playersBySection[sectionCode];
    }

    const names = ['Escudo'];
    for (let i = 2; i <= count - 3; i++) {
        names.push(`Jogador ${i}`);
    }
    names.push('Time - Foto 1', 'Time - Foto 2', 'Logo');
    return names;
}

function getRarity(sectionCode: string, index: number, isSpecial: boolean): Rarity {
    if (isSpecial) return 'LEGENDARY';
    if (sectionCode === 'FWC' || sectionCode === 'EST') return 'RARE';
    if (index === 0) return 'RARE'; // Escudos
    if (sectionCode === 'COC') return 'SPECIAL';
    return 'COMMON';
}

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // Limpa dados existentes
    console.log('🗑️  Limpando dados existentes...');
    await prisma.notification.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.tradeItem.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.userWantedSticker.deleteMany();
    await prisma.userSticker.deleteMany();
    await prisma.sticker.deleteMany();
    await prisma.section.deleteMany();
    await prisma.album.deleteMany();
    await prisma.user.deleteMany();

    // Cria o álbum
    console.log('📚 Criando álbum da Copa 2026...');
    const album = await prisma.album.create({
        data: albumData
    });

    // Cria seções e figurinhas
    console.log('📋 Criando seções e figurinhas...\n');
    let totalStickers = 0;

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const isSpecial = section.special || false;

        const createdSection = await prisma.section.create({
            data: {
                albumId: album.id,
                name: section.name,
                code: section.code,
                orderIndex: i
            }
        });

        const playerNames = generatePlayerNames(section.code, section.count);

        for (let j = 0; j < section.count; j++) {
            const stickerNumber = section.startNumber + j;
            const rarity = getRarity(section.code, j, isSpecial);

            await prisma.sticker.create({
                data: {
                    albumId: album.id,
                    sectionId: createdSection.id,
                    code: `${section.code} ${j + 1}`,
                    name: playerNames[j] || `${section.name} ${j + 1}`,
                    number: stickerNumber,
                    rarity,
                    isSpecial
                }
            });
            totalStickers++;
        }

        console.log(`  ✓ ${section.name} (${section.code}) - ${section.count} figurinhas`);
    }

    console.log(`\n✅ Seed concluído!`);
    console.log(`   📚 1 álbum criado`);
    console.log(`   📋 ${sections.length} seções criadas`);
    console.log(`   🎴 ${totalStickers} figurinhas criadas`);
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
