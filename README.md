# fresh moderation bot project, built on discord.js v13.*
Complete: 
- config.js rebuilt to implement subcommands.
- Verify command added through a slash command. Skipped legacy command handler, staying with slash
    -- Role is now given to members who verify
- Database modification for flexible verification channel and role ids
- messageCreate event for automod. automod will include discord invite link deletion, slur and spam detection
- New option added to automod - warn: This allows admins to enable/disable automatic warning for automod triggers

- Automod auto warn system completed

In progress:
- Filling in naughty words for automod. might .gitignore this one D:
- Added help command, currently broken