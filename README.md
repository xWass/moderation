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
- Creation of events for logging (messageDelete, guildMemberUpdate, etc.)
- Second level of AutoMod (for message deletions, nickname changes. Just a stricter level of Automod)

- AUTOMOD WORD FILTERS REMOVED, TO BE REPLACED WITH BUILT IN AUTOMOD.
- Updated logging. Pulls from audit log event instead of individual events.

In progress:
- Config command rebuilding for ease of use
- Moving to v14


**New config command requires a LOT more work and is not even close to complete. its gonna be long. and annoying. enjoy.
