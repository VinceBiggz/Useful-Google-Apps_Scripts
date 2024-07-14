function generateDriveReport() {
    const BATCH_SIZE = 100;
    const REPORT_FILE_ID = 'YOUR_REPORT_FILE_ID';
    
    const sheet = SpreadsheetApp.openById(REPORT_FILE_ID).getActiveSheet();
    const files = DriveApp.getFiles();
    let count = 0;
    
    while (files.hasNext() && count < BATCH_SIZE) {
      let file = files.next();
      sheet.appendRow([file.getName(), file.getMimeType(), file.getOwner().getEmail(), file.getDateCreated()]);
      count++;
    }
    
    if (files.hasNext()) {
      ScriptApp.newTrigger('generateDriveReport')
               .timeBased()
               .after(30 * 1000)
               .create();
    } else {
      Logger.log('Finished generating drive report.');
    }
  }
  
  function initializeGenerateDriveReport() {
    cleanUpTriggers('generateDriveReport');
    generateDriveReport();
  }
  