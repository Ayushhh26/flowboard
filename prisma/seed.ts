import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Priority } from '../src/generated/prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  // Wipe in dependency order so FK constraints don't block
  await prisma.cardLabel.deleteMany()
  await prisma.card.deleteMany()
  await prisma.label.deleteMany()
  await prisma.column.deleteMany()
  await prisma.board.deleteMany()
  await prisma.user.deleteMany()

  // Users
  const ayush = await prisma.user.create({
    data: {
      name: 'Ayush',
      email: 'ayush@flowboard.dev',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Ayush',
    },
  })

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Chen',
      email: 'alice@flowboard.dev',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AliceChen',
    },
  })

  const marcus = await prisma.user.create({
    data: {
      name: 'Marcus Rivera',
      email: 'marcus@flowboard.dev',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MarcusRivera',
    },
  })

  // Board
  const board = await prisma.board.create({
    data: {
      name: 'Product Launch Q3',
      ownerId: ayush.id,
    },
  })

  // Labels
  const labels = await Promise.all([
    prisma.label.create({ data: { boardId: board.id, name: 'Frontend', color: '#3b82f6' } }),
    prisma.label.create({ data: { boardId: board.id, name: 'Backend', color: '#10b981' } }),
    prisma.label.create({ data: { boardId: board.id, name: 'Design', color: '#a855f7' } }),
    prisma.label.create({ data: { boardId: board.id, name: 'Infra', color: '#f59e0b' } }),
  ])
  const [frontend, backend, design, infra] = labels

  // Columns
  const backlog = await prisma.column.create({
    data: { boardId: board.id, title: 'Backlog', orderIndex: 1.0 },
  })
  const todo = await prisma.column.create({
    data: { boardId: board.id, title: 'To Do', orderIndex: 2.0 },
  })
  const inProgress = await prisma.column.create({
    data: { boardId: board.id, title: 'In Progress', orderIndex: 3.0 },
  })
  const review = await prisma.column.create({
    data: { boardId: board.id, title: 'Review', orderIndex: 4.0 },
  })
  const done = await prisma.column.create({
    data: { boardId: board.id, title: 'Done', orderIndex: 5.0 },
  })

  // Cards — Backlog
  const backlogCards = await Promise.all([
    prisma.card.create({
      data: {
        columnId: backlog.id,
        title: 'Research competitor pricing',
        priority: Priority.high,
        orderIndex: 1.0,
        assigneeId: ayush.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: backlog.id,
        title: 'Draft announcement blog post',
        priority: Priority.low,
        orderIndex: 2.0,
        assigneeId: alice.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: backlog.id,
        title: 'Accessibility audit for landing page',
        priority: Priority.medium,
        orderIndex: 3.0,
        assigneeId: null,
      },
    }),
    prisma.card.create({
      data: {
        columnId: backlog.id,
        title: 'Write API migration guide',
        priority: Priority.medium,
        orderIndex: 4.0,
        assigneeId: marcus.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: backlog.id,
        title: 'Set up analytics dashboard',
        priority: Priority.low,
        orderIndex: 5.0,
        assigneeId: null,
      },
    }),
    prisma.card.create({
      data: {
        columnId: backlog.id,
        title: 'Review onboarding copy',
        priority: Priority.none,
        orderIndex: 6.0,
        assigneeId: alice.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: backlog.id,
        title: 'Define Q3 success metrics',
        priority: Priority.low,
        orderIndex: 7.0,
        assigneeId: ayush.id,
      },
    }),
  ])

  // Cards — To Do
  const todoCards = await Promise.all([
    prisma.card.create({
      data: {
        columnId: todo.id,
        title: 'Design onboarding flow',
        priority: Priority.high,
        orderIndex: 1.0,
        assigneeId: alice.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: todo.id,
        title: 'Set up error monitoring',
        priority: Priority.medium,
        orderIndex: 2.0,
        assigneeId: marcus.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: todo.id,
        title: 'Create email templates',
        priority: Priority.low,
        orderIndex: 3.0,
        assigneeId: null,
      },
    }),
  ])

  // Cards — In Progress
  const inProgressCards = await Promise.all([
    prisma.card.create({
      data: {
        columnId: inProgress.id,
        title: 'Build notification system',
        priority: Priority.high,
        orderIndex: 1.0,
        assigneeId: marcus.id,
        description: 'Implement email + in-app notifications for task assignments and mentions.',
      },
    }),
    prisma.card.create({
      data: {
        columnId: inProgress.id,
        title: 'Refactor auth middleware',
        priority: Priority.medium,
        orderIndex: 2.0,
        assigneeId: ayush.id,
        description: 'Extract session handling into a standalone middleware module.',
      },
    }),
  ])

  // Cards — Review
  const reviewCards = await Promise.all([
    prisma.card.create({
      data: {
        columnId: review.id,
        title: 'Landing page redesign',
        priority: Priority.high,
        orderIndex: 1.0,
        assigneeId: alice.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: review.id,
        title: 'Performance profiling report',
        priority: Priority.medium,
        orderIndex: 2.0,
        assigneeId: ayush.id,
      },
    }),
  ])

  // Cards — Done
  await Promise.all([
    prisma.card.create({
      data: {
        columnId: done.id,
        title: 'Set up CI/CD pipeline',
        priority: Priority.none,
        orderIndex: 1.0,
        assigneeId: marcus.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: done.id,
        title: 'Database schema migration',
        priority: Priority.none,
        orderIndex: 2.0,
        assigneeId: ayush.id,
      },
    }),
    prisma.card.create({
      data: {
        columnId: done.id,
        title: 'Design system v2 tokens',
        priority: Priority.none,
        orderIndex: 3.0,
        assigneeId: alice.id,
      },
    }),
  ])

  // Attach labels to a handful of cards
  await Promise.all([
    prisma.cardLabel.create({ data: { cardId: backlogCards[0].id, labelId: backend.id } }),
    prisma.cardLabel.create({ data: { cardId: backlogCards[2].id, labelId: frontend.id } }),
    prisma.cardLabel.create({ data: { cardId: backlogCards[2].id, labelId: design.id } }),
    prisma.cardLabel.create({ data: { cardId: backlogCards[3].id, labelId: backend.id } }),
    prisma.cardLabel.create({ data: { cardId: todoCards[0].id, labelId: design.id } }),
    prisma.cardLabel.create({ data: { cardId: todoCards[1].id, labelId: infra.id } }),
    prisma.cardLabel.create({ data: { cardId: inProgressCards[0].id, labelId: backend.id } }),
    prisma.cardLabel.create({ data: { cardId: inProgressCards[1].id, labelId: backend.id } }),
    prisma.cardLabel.create({ data: { cardId: reviewCards[0].id, labelId: frontend.id } }),
    prisma.cardLabel.create({ data: { cardId: reviewCards[0].id, labelId: design.id } }),
  ])

  console.log('Seed complete: 3 users, 1 board, 5 columns, 17 cards, 4 labels')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
