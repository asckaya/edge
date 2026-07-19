export type EdgeEnv = {
	ASSETS?: { fetch: typeof fetch };
	EDGE_KV?: {
		get: (key: string) => Promise<string | null>;
		put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
		delete: (key: string) => Promise<void>;
	};
	EDGE_ADMIN_KEY?: string;
};
