function organizeFilesByDate() {
    const BATCH_SIZE = 100;
    
    const files = DriveApp.getFiles();
    let count = 0;
    
    while (files.hasNext() && count < BATCH_SIZE) {
      let file = files.next();
      let date = file.getDateCreated();
      let year = date.getFullYear();
      let month = ('0' + (date.getMonth() + 1)).slice(-2);
      
      let folder = getOrCreateFolder(`${year}/${month}`);
      file.moveTo(folder);
      count++;
    }
    
    if (files.hasNext()) {
      ScriptApp.newTrigger('organizeFilesByDate')
               .timeBased()
               .after(30 * 1000)
               .create();
    } else {
      Logger.log('Finished organizing files.');
    }
  }
  
  function getOrCreateFolder(path) {
    let parts = path.split('/');
    let folder = DriveApp.getRootFolder();
    
    parts.forEach(part => {
      let folders = folder.getFoldersByName(part);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = folder.createFolder(part);
      }
    });
    
    return folder;
  }
  
  function initializeOrganizeFiles() {
    cleanUpTriggers('organizeFilesByDate');
    organizeFilesByDate();
  }
  