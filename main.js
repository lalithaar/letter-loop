// Function to send weekly prompt emails
function sendWeeklyPrompts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Prompts");
  const prompts = sheet.getRange("A:A").getValues().flat().filter(String);
  
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  
  const participantsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Participants");
  const participants = participantsSheet.getRange("A2:B").getValues().filter(row => row[0] && row[1]);
  
  for (const [name, email] of participants) {
    MailApp.sendEmail({
      to: email,
      subject: "Weekly Prompt",
      body: `Hi ${name},\n\nYour prompt for this week is:\n\n"${randomPrompt}"\n\nPlease reply to this email with your response.`
    });
  }
  
  const responsesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");
  responsesSheet.appendRow([new Date(), randomPrompt]);
}

// Function to collect responses from email replies
function collectEmailResponses() {
  const threads = GmailApp.search('subject:"Weekly Prompt" newer_than:1w');
  const responsesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");
  const participantsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Participants");
  
  // Load participants data from Participants sheet
  const participantsData = participantsSheet.getRange('A2:B').getValues(); // Assuming participants are in columns A (email) and B (name)
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const senderEmail = message.getFrom().match(/<(.*?)>/)[1]; // Extract sender's email address
      const response = message.getPlainBody(); // Get plain text body of the email
      
      // Find participant name associated with sender's email
      let senderName = "";
      participantsData.forEach(participant => {
        if (participant[0] === senderEmail) {
          senderName = participant[1]; // Assign participant name
          return; // Exit forEach loop
        }
      });
      
      if (senderName) {
        // Check if response is already recorded
        const data = responsesSheet.getRange('A2:E').getValues(); // Adjust range as per your sheet structure
        const existingResponse = data.find(row => row[2] === senderName && row[3] === response);
        
        if (!existingResponse) {
          const lastRow = responsesSheet.getLastRow() + 1;
          responsesSheet.getRange(lastRow, 1).setValue(new Date()); // Column A: Date
          responsesSheet.getRange(lastRow, 2).setValue(responsesSheet.getRange(lastRow - 1, 2).getValue()); // Column B: Question
          switch (senderName) {
            case "Lalitha":
              responsesSheet.getRange(lastRow, 3).setValue(response); // Column C: Lalitha's response
              break;
            case "Jeong Seo Ah":
              responsesSheet.getRange(lastRow, 4).setValue(response); // Column D: Jeong Seo Ah's response
              break;
            case "Xu xin":
              responsesSheet.getRange(lastRow, 5).setValue(response); // Column E: Xu xin's response
              break;
            default:
              // Handle other participants if needed
              break;
          }
        }
      }
    });
  });
}


// Function to send consolidated email
function sendConsolidatedEmail() {
  const responsesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");
  const lastRow = responsesSheet.getLastRow();
  const lastResponseRow = responsesSheet.getRange(lastRow, 1, 1, responsesSheet.getLastColumn()).getValues()[0];
  
  const [date, question, ...responses] = lastResponseRow;
  const participantsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Participants");
  const participants = participantsSheet.getRange("A2:A").getValues().flat().filter(String);
  
  let emailContent = `Question: ${question}\n\n`;
  
  responsesSheet.getRange(`C2:D${lastRow}`).getValues().forEach(row => {
    emailContent += `${row[0]}: ${row[1]}\n\n`;
  });

  // Get all participant emails
  const recipientEmails = participantsSheet.getRange("B2:B").getValues().flat().filter(String).join(",");

  MailApp.sendEmail({
    to: recipientEmails, // Send to all participants
    subject: "Crackheads Unite",
    body: emailContent
  });
}

// Function to set up weekly triggers
function setUpTriggers() {
  ScriptApp.newTrigger('sendWeeklyPrompts')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  
  ScriptApp.newTrigger('collectEmailResponses')
    .timeBased()
    .everyDays(1)
    .atHour(18)
    .create();
  
  ScriptApp.newTrigger('sendConsolidatedEmail')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(18)
    .create();
}
