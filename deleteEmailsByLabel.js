/**
 * @author Vincent Wachira
 * @date 2024-07-10
 * @version 1.3
 * 
 * @description
 * This Google Apps Script connects to your Gmail account and deletes all emails that have specified labels.
 * The script processes emails in batches to avoid exceeding the execution time limit. It also introduces pauses 
 * between each batch to ensure efficient processing.
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

function deleteEmailsByLabels() {
    var labels = ['Label1', 'Label2']; // Array of labels to delete emails from (Change these as needed)
    var batchSize = 100; // Number of threads to process per batch

    // Retrieve the number of processed threads from script properties, defaulting to 0 if not set
    var processedCount = PropertiesService.getScriptProperties().getProperty('processedCount') || 0;
    processedCount = parseInt(processedCount, 10); // Ensure processedCount is an integer

    // Retrieve the total number of deleted threads from script properties, defaulting to 0 if not set
    var totalDeleted = PropertiesService.getScriptProperties().getProperty('totalDeleted') || 0;
    totalDeleted = parseInt(totalDeleted, 10); // Ensure totalDeleted is an integer

    // Build search query for all labels specified in the array
    var query = labels.map(function (label) {
        return 'label:' + label;
    }).join(' OR '); // Combine multiple labels with OR condition

    // Search for email threads matching the labels, starting from the processedCount and fetching up to batchSize threads
    var threads = GmailApp.search(query, processedCount, batchSize);

    // If there are threads to process
    if (threads.length > 0) {
        for (var i = 0; i < threads.length; i++) {
            GmailApp.moveThreadToTrash(threads[i]); // Move each thread to trash
        }

        processedCount += threads.length; // Update the count of processed threads
        totalDeleted += threads.length; // Update the count of total deleted threads

        // Store the updated counts in script properties for next execution
        PropertiesService.getScriptProperties().setProperty('processedCount', processedCount);
        PropertiesService.getScriptProperties().setProperty('totalDeleted', totalDeleted);

        // Log progress
        Logger.log('Deleted ' + threads.length + ' threads. Total deleted: ' + totalDeleted);

        // Pause to avoid exceeding execution time limit (3 seconds)
        Utilities.sleep(3000);

        // Set a trigger to continue the execution if more threads are found
        if (threads.length == batchSize) {
            ScriptApp.newTrigger('deleteEmailsByLabels')
                .timeBased()
                .after(1 * 60 * 1000) // Continue after 1 minute
                .create();
        } else {
            Logger.log('Finished deleting emails by labels. Total deleted: ' + totalDeleted);
            PropertiesService.getScriptProperties().deleteProperty('processedCount');
            PropertiesService.getScriptProperties().deleteProperty('totalDeleted');
        }
    } else {
        Logger.log('No more emails to delete by labels. Total deleted: ' + totalDeleted);
        PropertiesService.getScriptProperties().deleteProperty('processedCount');
        PropertiesService.getScriptProperties().deleteProperty('totalDeleted');
    }
}
