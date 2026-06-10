interface ApiErrorDetail { path: string; message: string }

// M5 : on distingue erreur réseau (offline/timeout) d'erreur HTTP (métier).
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: ApiErrorDetail[],
  ) {
    super(message);
  }
}

export class NetworkError extends Error {
  constructor(message = 'Pas de connexion') {
    super(message);
  }
}
