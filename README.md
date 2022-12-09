# fresh moderation bot project, built on discord.js v13.*
Complete: 
- Config command rebuilt to implement subcommands.
- Verify command added through a slash command. Skipped legacy command handler, staying with slash
- Role is now given to members who verify
- Database modification for flexible verification channel and role ids
- messageCreate event for automod. automod will include discord invite link deletion, slur and spam detection
- New option added to automod - warn: This allows admins to enable/disable automatic warning for automod triggers
- Automod auto warn system completed
- Added help command. fixed kinda
- Added database management for logging
- Added logging channel messages to moderation commands
- Added logging for automod actions
- Config command updated for altering logging

In progress:
- Filling in naughty words for automod. might .gitignore this one later
- Creation of events for logging (messageDelete, guildMemberUpdate, etc.)
- Second level of AutoMod (for message deletions, nickname changes. Just a stricter level of Automod)
