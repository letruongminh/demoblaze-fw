import * as fs from 'fs';
import * as path from 'path';

export interface Credentials {
  username: string;
  password: string;
}

const STORE_DIR = path.resolve(__dirname, '..', '.auth');
const STORE_FILE = path.join(STORE_DIR, 'credentials.json');

export function generateCredentials(): Credentials {
  const unique = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  return { username: `qa_demo_${unique}`, password: `Qa!${unique}` };
}

export function saveCredentials(creds: Credentials): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(creds, null, 2), 'utf-8');
}

export function loadCredentials(): Credentials {
  if (!fs.existsSync(STORE_FILE)) {
    throw new Error(
      `No credentials found at ${STORE_FILE}. The global setup is responsible for ` +
        'creating them before any test runs.',
    );
  }
  return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as Credentials;
}
