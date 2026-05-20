export const invitationTemplate = (inviteeName, projectName, inviteLink) => `
  <h1>You're Invited to Join ${projectName}</h1>
  <p>Hi ${inviteeName},</p>
  <p>You have been invited to join the project "${projectName}" on our platform.</p>
  <p>Click the link below to accept the invitation:</p>
  <a href="${inviteLink}">Accept Invitation</a>
  <p>If you don't have an account, you'll be prompted to sign up.</p>
  <p>Best regards,<br>The Team</p>
`;

export const taskAssignmentTemplate = (assigneeName, taskTitle, projectName) => `
  <h1>New Task Assigned</h1>
  <p>Hi ${assigneeName},</p>
  <p>You have been assigned a new task: "${taskTitle}" in project "${projectName}".</p>
  <p>Please check your dashboard for details.</p>
  <p>Best regards,<br>The Team</p>
`;

export const taskStatusUpdateTemplate = (updaterName, taskTitle, newStatus, projectName) => `
  <h1>Task Status Updated</h1>
  <p>Hi Team,</p>
  <p>${updaterName} has updated the status of task "${taskTitle}" in project "${projectName}" to "${newStatus}".</p>
  <p>Please check your dashboard for details.</p>
  <p>Best regards,<br>The Team</p>
`;

export const deadlineReminderTemplate = (taskTitle, deadline, projectName) => `
  <h1>Deadline Reminder</h1>
  <p>Hi,</p>
  <p>The task "${taskTitle}" in project "${projectName}" is due on ${new Date(deadline).toLocaleDateString()}.</p>
  <p>Please ensure it's completed on time.</p>
  <p>Best regards,<br>The Team</p>
`;
