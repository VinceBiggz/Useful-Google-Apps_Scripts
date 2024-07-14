function sendRemindersForUnopenedFiles() {
    const BATCH_SIZE = 100;
    const DAYS_UNOPENED = 7;
    
    const files = DriveApp.getFiles();
    let count = 0;
    
    while (files.hasNext() && count < BATCH_SIZE) {
      let file = files.next();
      let viewers = file.getViewers();
      let editors = file.getEditors();
      
      let unopened = viewers.concat(editors).filter(user => {
        let activity = DriveActivity.query({ itemName: `items/${file.getId()}` });
        return activity.events.filter(event => event.target.driveItem.owner.user.knownUser.personName === user.getEmail())
                              .length === 0;
      });
      
      unopened.forEach(user => {
        let lastOpened = new Date(file.getLastViewedByMeDate());
        let daysSinceOpened = (new Date() - lastOpened) / (1000 * 60 * 60 * 24);
        if (daysSinceOpened > DAYS_UNOPENED) {
          MailApp.sendEmail(user.getEmail(), 'Reminder to view shared file', `You have not viewed the file "${file.getName()}" in ${DAYS_UNOPENED} days.`);
        }
      });
      
      count++;
    }
    
    if (files.hasNext()) {
      ScriptApp.newTrigger('sendRemindersForUnopenedFiles')
               .timeBased()
               .after(30 * 1000)
               .create();
    } else {
      Logger.log('Finished sending reminders.');
    }
  }
  
  function initializeSendReminders() {
    cleanUpTriggers('sendRemindersForUnopenedFiles');
    sendRemindersForUnopenedFiles();
  }
  