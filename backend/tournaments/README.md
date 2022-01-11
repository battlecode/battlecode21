# Tournament Presentation

Basically, everything that isn't directly running the matches themselves. (setup before matches; Challonge input after matches)

## Beforehand

TODO:
freeze submissions (allow for grace period)
Allow teams to submit extra submissions, through Discord
To handle these: (insert what Quinn and I just did -- notes in Slack)

Once all these submissions are processed:
Run some SQL, etc. (find notes in slack, and in tournament.sql)

## Match Running

Infrastructure likely knows how to do this!

## Afterward

### Installation

Install pychal, link here -- https://pypi.org/project/pychal/. Also, grab the Challonge API key, link here: https://challonge.com/settings/developer. Set this as `CHALLONGE_API_KEY` in `dev_settings_sensitive.py`.

On Challonge website, create a new tour. Pay special attention to the "tournament format" section; make sure that is as it should be. Also, to add participants, click on "add participants in bulk".

Parse results: can do this manually. if you want to do programatically --
In the initial json, would be nice to have round # (altho i think this can be caluclated), scrimmage id (can be worked around), and score (can be worked around too).

Get all matches, in json -- they're be in some order. maybe have extra matches too.
Get all matches, from challonge -- this is good canonical order.

For a match number in challonge:
    Use API to query: (this match number wil be 'suggested_play_order')
    Turn challonge player_id's into battlecode player IDs
    Get any matches involving those two teams, in that order OR create a way of matching challonge rounds to JSON rounds

TBH we should just run a tour w challonge integration already built in, instead.
    
