export class AppError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const notFound = (resource = "Recurso") =>
  new AppError(404, `${resource} não encontrado`);

export const unauthorized = (message = "Não autorizado") =>
  new AppError(401, message);

export const forbidden = (message = "Acesso negado") =>
  new AppError(403, message);

export const badRequest = (message = "Requisição inválida", details?: unknown) =>
  new AppError(400, message, details);
