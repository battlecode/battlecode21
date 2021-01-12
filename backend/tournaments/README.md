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
