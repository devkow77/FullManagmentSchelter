import express from 'express';
import authRoutes from './routes/authRoutes';
import animalRoutes from './routes/animalRoutes';
import cageRoutes from './routes/cageRoutes';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';
import adoptionRoutes from './routes/adoptionRoutes';
import newsletterRoutes from './routes/newsletterRoutes';
import medicalRecordsRoutes from './routes/medicalRecordsRoutes';
import vetsRoutes from './routes/vetsRoutes';
import zoneAssignmentRoutes from './routes/zoneAssignmentRoutes';
import animalNeedRoutes from './routes/animalNeedRoutes';
import statsRoutes from './routes/statsRoutes';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { startAnimalStatusJob } from './jobs/animalStatus.job';
import { startAdoptionExpiryJob } from './jobs/adoptionExpiry.job';

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ??
      (process.env.NODE_ENV === 'production'
        ? 'https://shelter-with-ai-chatbox.vercel.app'
        : 'http://localhost:5174'),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/cages', cageRoutes);
app.use('/api/contact', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/vets', vetsRoutes);
app.use('/api/zone-assignments', zoneAssignmentRoutes);
app.use('/api/animal-needs', animalNeedRoutes);
app.use('/api/stats', statsRoutes);

startAnimalStatusJob();
startAdoptionExpiryJob();

export default app;
