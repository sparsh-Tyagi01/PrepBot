import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

  // Create AI Interviewers
  const aiInterviewers = [
    {
      name: 'Sarah Chen',
      personality: 'Friendly',
      description: 'A warm and encouraging interviewer who creates a comfortable environment. Perfect for nervous candidates or first-time interview practice.',
      avatar: '/avatars/sarah-chen.png',
      voice: 'en-US-Neural2-F',
      expertise: ['Technical', 'Behavioral', 'General'],
      greetingMessage: 'Hi there! I\'m Sarah, and I\'m so glad you\'re here today. Let\'s have a great conversation and see how we can help you shine. Ready to begin?',
    },
    {
      name: 'Dr. James Mitchell',
      personality: 'Professional',
      description: 'A seasoned professional with decades of experience. Maintains formal interview standards while being fair and thorough.',
      avatar: '/avatars/james-mitchell.png',
      voice: 'en-US-Neural2-D',
      expertise: ['Technical', 'System Design', 'Architecture'],
      greetingMessage: 'Good day. I\'m Dr. Mitchell. I\'ll be conducting your interview today. We\'ll cover several topics to assess your capabilities. Shall we begin?',
    },
    {
      name: 'Alex Rodriguez',
      personality: 'Strict',
      description: 'A rigorous interviewer who asks challenging follow-up questions. Ideal for advanced preparation and stress testing.',
      avatar: '/avatars/alex-rodriguez.png',
      voice: 'en-US-Neural2-A',
      expertise: ['Technical', 'Problem Solving', 'System Design'],
      greetingMessage: 'I\'m Alex Rodriguez. I expect precise answers and thorough explanations. This will be challenging, but that\'s the point. Let\'s see what you\'ve got.',
    },
    {
      name: 'Maya Patel',
      personality: 'Casual',
      description: 'A relaxed and conversational interviewer who makes the process feel natural. Great for behavioral interviews and cultural fit assessments.',
      avatar: '/avatars/maya-patel.png',
      voice: 'en-IN-Neural2-A',
      expertise: ['Behavioral', 'Cultural Fit', 'General'],
      greetingMessage: 'Hey! I\'m Maya. Let\'s just chat and get to know each other. Think of this as a friendly conversation where we learn about your experiences. Sound good?',
    },
    {
      name: 'Robert Turner',
      personality: 'Encouraging',
      description: 'An extremely supportive interviewer who provides positive reinforcement. Perfect for building confidence and improving gradually.',
      avatar: '/avatars/robert-turner.png',
      voice: 'en-GB-Neural2-B',
      expertise: ['All Topics', 'Mentoring', 'Career Development'],
      greetingMessage: 'Welcome! I\'m Robert, and I\'m here to help you succeed. Every answer you give is a learning opportunity. Take your time, and let\'s make this a great experience together!',
    },
    {
      name: 'Dr. Emily Watson',
      personality: 'Professional',
      description: 'A data-driven interviewer who focuses on analytical and problem-solving skills. Excellent for technical and quantitative roles.',
      avatar: '/avatars/emily-watson.png',
      voice: 'en-AU-Neural2-C',
      expertise: ['Data Science', 'Analytics', 'Technical'],
      greetingMessage: 'Good morning. I\'m Dr. Watson. Today we\'ll explore your analytical capabilities and problem-solving approach. Please be specific in your responses.',
    },
  ];

  console.log('Creating AI Interviewers...');
  for (const interviewer of aiInterviewers) {
    const existing = await prisma.aIInterviewer.findFirst({
      where: { name: interviewer.name },
    });
    
    if (existing) {
      console.log(`✓ AI Interviewer already exists: ${interviewer.name}`);
    } else {
      const created = await prisma.aIInterviewer.create({
        data: interviewer,
      });
      console.log(`✓ Created AI Interviewer: ${created.name}`);
    }
  }

  // Create default Interview Types (global)
  const interviewTypes = [
    {
      name: 'Technical Interview',
      description: 'Coding problems, algorithms, data structures, and technical concepts',
      icon: '💻',
      isGlobal: true,
    },
    {
      name: 'Behavioral Interview',
      description: 'Past experiences, teamwork, conflict resolution, and soft skills',
      icon: '🤝',
      isGlobal: true,
    },
    {
      name: 'System Design',
      description: 'Architecture design, scalability, distributed systems',
      icon: '🏗️',
      isGlobal: true,
    },
    {
      name: 'HR Interview',
      description: 'Career goals, company fit, salary expectations, and general questions',
      icon: '👔',
      isGlobal: true,
    },
    {
      name: 'Case Study',
      description: 'Business problems, analytical thinking, and strategic planning',
      icon: '📊',
      isGlobal: true,
    },
    {
      name: 'Mock Interview',
      description: 'Full interview simulation combining multiple types',
      icon: '🎭',
      isGlobal: true,
    },
  ];

  console.log('\nCreating Interview Types...');
  for (const type of interviewTypes) {
    const typeId = type.name.toLowerCase().replace(/\s+/g, '-');
    const existing = await prisma.interviewType.findUnique({
      where: { id: typeId },
    });
    
    if (existing) {
      console.log(`✓ Interview Type already exists: ${type.name}`);
    } else {
      const created = await prisma.interviewType.create({
        data: {
          id: typeId,
          ...type,
        },
      });
      console.log(`✓ Created Interview Type: ${created.name}`);
    }
  }

  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
