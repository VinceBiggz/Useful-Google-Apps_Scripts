/**
 * Deletes Google Photos older than 5 years.
 *
 * @version 1.0
 * @date 2024-07-11
 * @description
 * This script deletes photos from Google Photos that are older than 5 years.
 * 
 * Note: Ensure Google Photos API is enabled and OAuth2 is set up.
 */

const BATCH_SIZE = 50; // Number of photos to process per batch
const YEARS_AGO = 5;   // Target age of photos to delete (older than this)
const API_URL = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';

// Add your OAuth2 credentials here
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

// Function to authorize with OAuth2
function authorize() {
  const token = PropertiesService.getUserProperties().getProperty('oauthToken');
  if (!token) {
    const oauth2 = OAuth2.createService('google')
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      .setTokenUrl('https://oauth2.googleapis.com/token')
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      .setScope('https://www.googleapis.com/auth/photoslibrary')
      .setParam('access_type', 'offline')
      .setParam('approval_prompt', 'force');
    const authorizationUrl = oauth2.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
  }
}

// Callback function for OAuth2
function authCallback(request) {
  const oauth2 = OAuth2.createService('google');
  const isAuthorized = oauth2.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

// Main function to delete old photos
function deleteOldPhotos() {
  const token = PropertiesService.getUserProperties().getProperty('oauthToken');
  if (!token) {
    authorize();
    return;
  }

  const oauth2 = OAuth2.createService('google');
  oauth2.setTokenUrl('https://oauth2.googleapis.com/token');
  oauth2.setClientId(CLIENT_ID);
  oauth2.setClientSecret(CLIENT_SECRET);
  oauth2.setPropertyStore(PropertiesService.getUserProperties());
  oauth2.setScope('https://www.googleapis.com/auth/photoslibrary');

  if (!oauth2.hasAccess()) {
    authorize();
    return;
  }

  const headers = {
    'Authorization': 'Bearer ' + oauth2.getAccessToken(),
    'Content-Type': 'application/json'
  };

  const pastDate = getPastDate(YEARS_AGO);
  const payload = {
    filters: {
      dateFilter: {
        ranges: [{
          endDate: {
            year: pastDate.getFullYear(),
            month: pastDate.getMonth() + 1,
            day: pastDate.getDate()
          }
        }]
      }
    },
    pageSize: BATCH_SIZE
  };

  const response = UrlFetchApp.fetch(API_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: headers
  });

  const data = JSON.parse(response.getContentText());
  const mediaItems = data.mediaItems;

  if (mediaItems && mediaItems.length > 0) {
    mediaItems.forEach(mediaItem => {
      try {
        UrlFetchApp.fetch(`https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItem.id}:batchDelete`, {
          method: 'post',
          contentType: 'application/json',
          headers: headers,
          payload: JSON.stringify({ mediaItemIds: [mediaItem.id] })
        });
        Logger.log(`Deleted media item: ${mediaItem.id}`);
      } catch (e) {
        Logger.log(`Error deleting media item: ${mediaItem.id} - ${e.message}`);
      }
    });
    ScriptApp.newTrigger('deleteOldPhotos')
             .timeBased()
             .after(30 * 1000)
             .create();
  } else {
    Logger.log('Finished deleting old photos.');
  }
}

// Utility function to get date object for past date
function getPastDate(yearsAgo) {
  var date = new Date();
  date.setFullYear(date.getFullYear() - yearsAgo);
  return date;
}
