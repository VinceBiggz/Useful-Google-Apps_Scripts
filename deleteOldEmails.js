/**
 * @author Vincent Wachira
 * @date 2024-07-10
 * @version 1.7
 * 
 * @description
 * This Google Apps Script connects to your Gmail account and deletes all emails older than 5 years.
 * The script processes emails in batches to avoid exceeding execution time limits and handles all folders and labels.
 * It introduces pauses between each batch to ensure efficient processing and manages triggers to avoid exceeding limits.
 * 
 * To run this script:
 * 1. Open Google Apps Script at https://script.google.com/
 * 2. Create a new project.
 * 3. Copy and paste this script into the script editor.
 * 4. Save the script.
 * 5. Click the 'Run' button to execute the script.
 * 6. Authorize the script to access your Gmail account when prompted.
 * 7. If the execution time limit is exceeded, the script will automatically set a trigger to resume processing.
 */

function deleteOldEmails() {
    // Constants to configure the script's behavior
    const BATCH_SIZE = 100; // Number of emails to process per batch to avoid exceeding time limits
    const YEARS_AGO = 5;    // Target age of emails to delete (older than this)
  
    // Get a reference to script properties for storing state between executions
    const scriptProperties = PropertiesService.getScriptProperties();
  
    // Retrieve the number of emails already processed, defaulting to 0 if not set
    let processedCount = parseInt(scriptProperties.getProperty('processedCount') || 0, 10); 
  
    // Retrieve the total number of emails deleted so far, defaulting to 0 if not set
    let totalDeleted = parseInt(scriptProperties.getProperty('totalDeleted') || 0, 10); 
  
    // Search for emails older than the specified years, starting from the last processed email
    const query = `older_than:${YEARS_AGO}y`; 
    const threads = GmailApp.search(query, processedCount, BATCH_SIZE);
  
    // If there are emails found
    if (threads.length > 0) {
      // Process each email thread in the current batch
      threads.forEach(thread => { 
        try {
          // Move the email thread to the trash
          GmailApp.moveThreadToTrash(thread); 
          // Increment the total number of deleted emails
          totalDeleted++;
        } catch (e) {
          // Log any errors encountered during deletion, but continue processing other emails
          Logger.log(`Error deleting thread: ${e.message}`); 
        }
      });
  
      // Update the number of processed emails
      processedCount += threads.length;
  
      // Store the updated state variables in script properties for the next run
      scriptProperties.setProperty('processedCount', processedCount);
      scriptProperties.setProperty('totalDeleted', totalDeleted);
  
      // Log progress after processing the current batch
      Logger.log(`Deleted ${threads.length} threads in this batch. Total deleted: ${totalDeleted}`);
    }
  
    // Manage triggers to avoid exceeding limits
    manageTriggers();
  
    // Continue execution if there are more threads to process
    if (threads.length === BATCH_SIZE) { 
      // Create or reuse a trigger to call this function again after a short delay
      ScriptApp.newTrigger('deleteOldEmails')
               .timeBased()
               .after(30 * 1000) // Trigger after 30 seconds to avoid execution time limits
               .create();
    } else {
      // If no more emails are found, clean up and log the final result
      Logger.log(`Finished deleting old emails. Total deleted: ${totalDeleted}`);
      scriptProperties.deleteAllProperties(); // Clear properties for future runs
    }
  }
  
  /**
   * Manages the creation and deletion of triggers to avoid exceeding the trigger limit.
   */
  function manageTriggers() {
    // Get all project triggers
    const triggers = ScriptApp.getProjectTriggers();
  
    // Iterate over each trigger to delete any that are set for the deleteOldEmails function
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'deleteOldEmails') {
        ScriptApp.deleteTrigger(trigger); // Delete the trigger
        Logger.log('Deleted an old trigger for deleteOldEmails.'); // Log trigger deletion
      }
    });
  
    // Create a new trigger for deleteOldEmails
    ScriptApp.newTrigger('deleteOldEmails') // Create a new time-based trigger
             .timeBased()
             .after(30 * 1000) // Trigger after 30 seconds to avoid execution time limits
             .create();
    Logger.log('Created a new trigger for deleteOldEmails.'); // Log trigger creation
  }
  
  /**
   * Returns a date string for emails older than the specified number of years.
   *
   * @param {number} yearsAgo - The number of years ago to set the date.
   * @return {string} - The date string in 'YYYY/MM/DD' format.
   */
  function getPastDate(yearsAgo) {
    var date = new Date(); // Current date
    date.setFullYear(date.getFullYear() - yearsAgo); // Adjust year to the past
    // Format date components with leading zeros
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    // Return formatted date string
    return year + '/' + month + '/' + day;
  }
  