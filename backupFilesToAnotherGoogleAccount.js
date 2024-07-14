function backupFiles() {
    const DESTINATION_FOLDER_ID = 'YOUR_DESTINATION_FOLDER_ID';
    const BATCH_SIZE = 100;
    
    const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);
    const files = DriveApp.getFiles();
    let count = 0;
    
    while (files.hasNext() && count < BATCH_SIZE) {
      let file = files.next();
      file.makeCopy(destinationFolder);
      count++;
    }
    
    if (files.hasNext()) {
      ScriptApp.newTrigger('backupFiles')
               .timeBased()
               .after(30 * 1000)
               .create();
    } else {
      Logger.log('Finished backing up files.');
    }
  }
  
  function initializeBackupFiles() {
    cleanUpTriggers('backupFiles');
    backupFiles();
  }
  