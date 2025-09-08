export interface Contact {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  themeColor: string;
}

export interface Appointment {
  id: string;
  contact: Contact;
  address: string;
  date: string;
  status: "upcoming" | "completed" | "cancelled";
  agents: Agent[];
}

export interface AppointmentCreateDTO {
  contactId: string;
  address: string;
  date: string;
  agentIds: string[];
}

export interface AppointmentUpdateDTO extends Partial<AppointmentCreateDTO> {
  status?: "upcoming" | "completed" | "cancelled";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface FilterParams {
  status?: "upcoming" | "completed" | "cancelled";
  agentIds?: string[];
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
