import { GOOGLE_CLIENT_ID } from "../constants";
import { BackupData, UserProfile } from "../types";

// Types for Global Google Objects
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILE_NAME = 'volttrack_data.json';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGoogleServices = (onInitComplete: () => void) => {
  if (!GOOGLE_CLIENT_ID) {
    console.warn("Google Client ID is missing. Drive features disabled.");
    return;
  }

  const gapiLoaded = () => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      if (gisInited) onInitComplete();
    });
  };

  const gisLoaded = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: '', // Defined at request time
    });
    gisInited = true;
    if (gapiInited) onInitComplete();
  };

  // Check if scripts are already loaded (e.g. refresh)
  if (window.gapi) gapiLoaded();
  if (window.google) gisLoaded();
};

export const loginToGoogle = (): Promise<UserProfile> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject("Google Services not initialized");

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      
      // Fetch user info
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${resp.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        resolve({
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture
        });
      } catch (e) {
          reject(e);
      }
    };

    // Request access token. 
    // prompt: '' skips consent if already granted, 'consent' forces it
    tokenClient.requestAccessToken({ prompt: '' });
  });
};

export const backupToDrive = async (data: BackupData): Promise<string> => {
  // 1. Search for existing file
  const response = await window.gapi.client.drive.files.list({
    q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  const files = response.result.files;
  const fileContent = JSON.stringify(data);

  if (files && files.length > 0) {
    // 2. Update existing
    const fileId = files[0].id;
    await window.gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'media' },
        body: fileContent
    });
    return "Updated existing backup";
  } else {
    // 3. Create new
    const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json'
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }),
        body: form
    });
    return "Created new backup file";
  }
};

export const restoreFromDrive = async (): Promise<BackupData | null> => {
  // 1. Search for file
  const response = await window.gapi.client.drive.files.list({
    q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  const files = response.result.files;
  if (!files || files.length === 0) {
    throw new Error("No backup file found.");
  }

  const fileId = files[0].id;

  // 2. Get content
  const fileRes = await window.gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'
  });

  return fileRes.result as BackupData;
};