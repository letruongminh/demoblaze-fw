import { DemoblazeApi } from './api-client';
import { Credentials, generateCredentials, saveCredentials } from './credentials';

async function globalSetup(): Promise<void> {
  const api = await DemoblazeApi.create();
  try {
    let creds: Credentials;

    if (process.env.DEMOBLAZE_USER && process.env.DEMOBLAZE_PASS) {
      creds = { username: process.env.DEMOBLAZE_USER, password: process.env.DEMOBLAZE_PASS };
      console.log(`[global-setup] Using DemoBlaze account from environment: ${creds.username}`);
    } else {
      creds = generateCredentials();
      await api.signup(creds.username, creds.password);
      console.log(`[global-setup] Registered a fresh DemoBlaze account: ${creds.username}`);
    }

    await api.login(creds.username, creds.password);
    saveCredentials(creds);
  } finally {
    await api.dispose();
  }
}

export default globalSetup;
