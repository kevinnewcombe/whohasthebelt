const Fetch = require("@11ty/eleventy-fetch");
require('dotenv').config();
if(!process.env.BDL_API_KEY){
  console.error(`🚨 BDL_API_KEY is missing from process.env 🚨`);
  return false;
}

const shortDate = (string) => {
  return string.substring(0, string.indexOf('T'))
}

const formatStreakDate = (date) =>{
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York'
  }).format(new Date(`${date}T00:00:00.000-05:00`))
}

const lastRun = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/New_York'
}).format(new Date());

const today = new Date();
const firstDayOfThisMonth = new Date(`${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2,0)}-01T00:00:00.000`);
const lastDayOfLastMonth = new Date(firstDayOfThisMonth.getTime() - 1000 * 60 * 60 * 24).toISOString();
const currentIsoDate = new Date().toISOString();


const getGames = async (params, cacheAge, arr, paginate) =>{
  let games = [];
  let next_cursor = 0;

  // get all the games from the start of the season up until the end of last month. These will have a month long cache
  while( next_cursor!==null){
    if(next_cursor ){
      params = {...params, cursor: next_cursor};
    }
    const url = `https://api.balldontlie.io/v1/games?${ Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&') }`
    console.log(`Fetching ${url}`);
    await Fetch(url, {
      duration: cacheAge, 
      type: "json",
      fetchOptions: {
        headers: {
          Authorization: `${process.env.BDL_API_KEY}`,
        },
      },
    }).then((response) => {
      arr.push(...response.data);
      if(response.meta.next_cursor && paginate){
        next_cursor = response.meta.next_cursor
      }else{
        next_cursor = null;
      }
    })
    .catch((error) => console.error(error));
  }

  return games;
} 

module.exports = async function () {
  let pastGames = [];
  
  await getGames( { start_date: "2024-10-22", end_date: shortDate(lastDayOfLastMonth), per_page: 99 }, '4w', pastGames, true);
  await getGames( { start_date: shortDate(lastDayOfLastMonth), end_date: shortDate(currentIsoDate), per_page: 99 }, '29m', pastGames, true);

  // Generate streak data.
  const streaks = [
    {
      full_name: 'Boston Celtics',
      id: 2,
      length: 0,
      start_date: formatStreakDate('2024-10-22')
    }
  ];

  // Filter out any duplicates or games that haven't ended yet
  pastGames = pastGames.filter((game) => game.time === 'Final');
  pastGames = pastGames.filter((elem, index) => pastGames.findIndex(obj => obj.id === elem.id) === index);

  while(pastGames.length){
    const game = pastGames.shift();
    const currentStreak = streaks[streaks.length - 1];
    let def, opp = null; // defending champs, opponent
    if(game.home_team.full_name === currentStreak.full_name){
      def = {...game.home_team, score: game.home_team_score };
      opp = {...game.visitor_team, score: game.visitor_team_score };
    }else if(game.visitor_team.full_name === currentStreak.full_name){
      opp = {...game.home_team, score: game.home_team_score }; 
      def = {...game.visitor_team, score: game.visitor_team_score };
    }

    if(def){
      currentStreak.length++; // Increase the value for 'games played with the belt'
      if(def.score < opp.score){
        // start a new steak
        currentStreak.end_date = formatStreakDate(game.date);
        streaks.push({
          full_name: opp.full_name,
          prev_holder: def.full_name,
          id: opp.id,
          length: 0,
          start_date: formatStreakDate(game.date),
        })
      }
    } 
  }

  streaks[streaks.length - 1].end_date = 'Present';

  // get upcoming games for the current belt holders
  upcomingGames = [];
  await getGames( { start_date: shortDate(currentIsoDate),'team_ids[]' : streaks[streaks.length - 1].id, per_page: 5 }, '1d', upcomingGames, false);
  upcomingGames.filter((game) => game.time !== 'Final').forEach((a) => {
    a.human_date = formatStreakDate(a.date);
  });

  return{ 
    lastRun,
    streaks, 
    upcomingGames
  }
};



