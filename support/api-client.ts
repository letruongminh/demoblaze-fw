import { APIRequestContext, request } from '@playwright/test';
import { config } from '../config/env';

export function encodePassword(raw: string): string {
  const binary = encodeURIComponent(raw).replace(/%([0-9A-F]{2})/g, (_match, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  return Buffer.from(binary, 'binary').toString('base64');
}

export class DemoblazeApi {
  private constructor(private readonly ctx: APIRequestContext) {}

  static async create(): Promise<DemoblazeApi> {
    const ctx = await request.newContext({ baseURL: config.apiURL });
    return new DemoblazeApi(ctx);
  }

  async signup(username: string, password: string): Promise<void> {
    const res = await this.ctx.post('/signup', {
      data: { username, password: encodePassword(password) },
    });
    const body = await res.text();
    if (body.includes('errorMessage')) {
      const { errorMessage } = JSON.parse(body) as { errorMessage: string };
      if (errorMessage !== 'This user already exist.') {
        throw new Error(`Sign-up failed for "${username}": ${errorMessage}`);
      }
    }
  }

  async login(username: string, password: string): Promise<string> {
    const res = await this.ctx.post('/login', {
      data: { username, password: encodePassword(password) },
    });
    const body = await res.text();
    if (body.includes('errorMessage')) {
      const { errorMessage } = JSON.parse(body) as { errorMessage: string };
      throw new Error(`Login failed for "${username}": ${errorMessage}`);
    }
    return (JSON.parse(body) as string).replace('Auth_token: ', '');
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }
}
