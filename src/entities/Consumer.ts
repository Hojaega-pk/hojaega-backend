export interface Consumer {
  id?: number;
  name: string;
  city: string;
  contactNo: string;
  pin: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateConsumerDto {
  name: string;
  city: string;
  contactNo: string;
  pin: string;
}

export interface ConsumerResponse {
  id: number;
  name: string;
  city: string;
  contactNo: string;
  pin: string;
  createdAt: Date;
  updatedAt: Date;
}
