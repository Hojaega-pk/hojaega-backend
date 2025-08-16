export interface Consumer {
  id?: number;
  name: string;
  city: string;
  pin: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateConsumerDto {
  name: string;
  city: string;
  pin: string;
}

export interface ConsumerResponse {
  id: number;
  name: string;
  city: string;
  pin: string;
  createdAt: Date;
  updatedAt: Date;
}
