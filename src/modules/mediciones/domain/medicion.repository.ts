export interface IMedicionRepository {
  send(data: any): Promise<void>;
}
