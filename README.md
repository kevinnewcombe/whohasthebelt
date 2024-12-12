# NBA Championship belt
A real-ish indicator of who currently has the [NBA Championship belt](https://www.reddit.com/r/nba/comments/1pn9t2/can_we_keep_track_of_the_owner_of_the/). Currently deployed to https://whohasthebelt.vercel.app


## How it works
A one page static site made in Eleventy. When the site is rebuilt every evening via a cron job in Github workflows, it gets the results of the every NBA game in 2024-2025 season to date and figures out who currently has the belt.

## Installation
* Run `npm install` to install all required packages
* Copy the contents of `.env.example` to `.env` and add a [Ball Don't Lie API key](https://www.balldontlie.io/)
* Run `npm run dev` to start a local dev server


## Cron schedule
The cron schedule is set in `.github/workflows` and triggers a deploy hook on Vercel, where the project is currently hosted. It should run every evening around the time most games are finishing up, plus one in the early morning to cover any games that might have run over. 
