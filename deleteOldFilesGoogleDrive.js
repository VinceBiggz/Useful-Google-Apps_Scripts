/**
 * @author Vincent Wachira
 * @date 2024-07-10
 * @version 1.0
 * 
 * @description
 * This Google Apps Script deletes files older than 5 years in your Google Drive.
 * The script processes files in batches to avoid exceeding execution time limits and manages triggers to continue processing.
 * 
 * To run this script:
 * 1. Open Google Apps Script at https://script.google.com/
 * 2. Create a new project.
 * 3. Copy and paste this script into the script editor.
 * 4. Save the script.
 * 5. Click the 'Run' button to execute the script.
 * 6. Authorize the script to access your Google Drive when prompted.
 * 7. If the execution time limit is exceeded, the script will automatically set a trigger to resume processing.
 */

function deleteOldFiles() {
    // Constants to configure the script's behavior
    const BATCH_SIZE = 100; // Number of files to process per batch to avoid exceeding time limits
    const YEARS_AGO = 5;    // Target age of files to delete (older than this)
  
    // Get a reference to script properties for storing state between executions
    const scriptProperties = PropertiesService.getScriptProperties();
  
    // Retrieve the number of files already processed, defaulting to 0 if not set
    let processedCount = parseInt(scriptProperties.getProperty('processedCount') || 0, 10); 
  
    // Retrieve the total number of files deleted so far, defaulting to 0 if not set
    let totalDeleted = parseInt(scriptProperties.getProperty('totalDeleted') || 0, 10); 
  
    // Get the date 5 years ago from today
    const pastDate = getPastDate(YEARS_AGO);
  
    // Search for files older than the specified date
    const files = DriveApp.getFiles();
  
    let filesToDelete = [];
    while (files.hasNext() && filesToDelete.length < BATCH_SIZE) {
      let file = files.next();
      if (new Date(file.getLastUpdated()) < pastDate) {
        filesToDelete.push(file);
      }
    }
  
    // If there are files found
    if (filesToDelete.length > 0) {
      // Process each file in the current batch
      filesToDelete.forEach(file => { 
        try {
          // Move the file to the trash
          file.setTrashed(true); 
          // Increment the total number of deleted files
          totalDeleted++;
        } catch (e) {
          // Log any errors encountered during deletion, but continue processing other files
          Logger.log(`Error deleting file: ${e.message}`); 
        }
      });
  
      // Update the number of processed files
      processedCount += filesToDelete.length;
  
      // Store the updated state variables in script properties for the next run
      scriptProperties.setProperty('processedCount', processedCount);
      scriptProperties.setProperty('totalDeleted', totalDeleted);
  
      // Log progress after processing the current batch
      Logger.log(`Deleted ${filesToDelete.length} files in this batch. Total deleted: ${totalDeleted}`);
    }
  
    // Manage triggers to avoid exceeding limits
    manageTriggers();
  
    // Continue execution if there are more files to process
    if (filesToDelete.length === BATCH_SIZE) { 
      // Create or reuse a trigger to call this function again after a short delay
      ScriptApp.newTrigger('deleteOldFiles')
               .timeBased()
               .after(30 * 1000) // Trigger after 30 seconds to avoid execution time limits
               .create();
    } else {
      // If no more files are found, clean up and log the final result
      Logger.log(`Finished deleting old files. Total deleted: ${totalDeleted}`);
      scriptProperties.deleteAllProperties(); // Clear properties for future runs
    }
  }
  
  /**
   * Manages the creation and deletion of triggers to avoid exceeding the trigger limit.
   */
  function manageTriggers() {
    // Get all project triggers
    const triggers = ScriptApp.getProjectTriggers();
    
    // Delete old triggers related to deleteOldFiles function
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'deleteOldFiles') {
        ScriptApp.deleteTrigger(trigger); // Delete the trigger
        Logger.log('Deleted an old trigger for deleteOldFiles.'); // Log trigger deletion
      }
    });
  
    // Optionally wait for a short period before creating a new trigger
    Utilities.sleep(3000); // Wait for 3 seconds
  
    // Create a new trigger for deleteOldFiles
    ScriptApp.newTrigger('deleteOldFiles') // Create a new time-based trigger
             .timeBased()
             .after(30 * 1000) // Trigger after 30 seconds to avoid execution time limits
             .create();
    Logger.log('Created a new trigger for deleteOldFiles.'); // Log trigger creation
  }
  
  /**
   * Returns a date object for a date older than the specified number of years.
   *
   * @param {number} yearsAgo - The number of years ago to set the date.
   * @return {Date} - The date object representing the past date.
   */
  function getPastDate(yearsAgo) {
    var date = new Date(); // Current date
    date.setFullYear(date.getFullYear() - yearsAgo); // Adjust year to the past
    return date;
  }
  