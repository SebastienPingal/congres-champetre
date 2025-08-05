import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  console.log('ℹ️  Pas de création d\'admin automatique - Utilisez OAuth pour vous connecter')

  // Créer quelques créneaux d'exemple
  const existingSlots = await prisma.timeSlot.findMany()
  
  if (existingSlots.length === 0) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const slots = [
      {
        title: 'Conférence matinale',
        startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
        endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
      },
      {
        title: 'Présentation de midi',
        startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0),
        endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 13, 0),
      },
      {
        title: 'Session après-midi',
        startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0),
        endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 0),
      }
    ]

    for (const slot of slots) {
      await prisma.timeSlot.create({
        data: slot
      })
    }

    console.log('✅ Créneaux d\'exemple créés')
  } else {
    console.log('ℹ️  Des créneaux existent déjà')
  }

  console.log('🎉 Seeding terminé !')
}

main()
  .catch((e) => {
    console.error('🚨 Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })