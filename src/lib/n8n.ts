const N8N_API_URL = process.env.NEXT_PUBLIC_N8N_URL || "https://djwconsulting.app.n8n.cloud";
const N8N_API_KEY = process.env.N8N_API_KEY;

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: Record<string, N8nConnection>;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string; name: string }>;
}

export interface N8nConnection {
  main: Array<Array<{ node: string; type: string; index: number }>>;
}

class N8nClient {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor() {
    this.baseUrl = N8N_API_URL;
    this.apiKey = N8N_API_KEY;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error("N8N_API_KEY is not configured");
    }

    const url = `${this.baseUrl}/api/v1${path}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    return this.fetch<N8nWorkflow>(`/workflows/${id}`);
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    // n8n API only accepts these fields on PUT - filter out everything else
    const allowedFields = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings,
    };

    // Remove undefined fields
    const cleanedWorkflow = Object.fromEntries(
      Object.entries(allowedFields).filter(([, value]) => value !== undefined)
    );

    return this.fetch<N8nWorkflow>(`/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(cleanedWorkflow),
    });
  }

  async listWorkflows(): Promise<{ data: N8nWorkflow[] }> {
    return this.fetch<{ data: N8nWorkflow[] }>("/workflows");
  }
}

export const n8nClient = new N8nClient();
