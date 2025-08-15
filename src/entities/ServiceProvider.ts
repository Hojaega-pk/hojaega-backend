import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface ServiceProvider {
  id: number;
  name: string;
  city: string;
  skillset: string;
  contactNo: string;
  email?: string;
  description?: string;
  experience?: string;
  isActive: boolean;
  status: number; // 1 = active subscription, 0 = expired
  subscriptionStartDate: Date;
  subscriptionEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
