-- MAKE A BACKUP ON GCLOUD BEFORE RUNNING THIS
-- Also run this in steps not as a file

-- 1: Set submissions_enabled to False in api_league
update api_league set submissions_enabled=FALSE;

-- 2: Change `tour_seed_id` to the current tournament
update api_teamsubmission set tour_seed_id = last_1_id;

-- 3: Add the tournament to the tournaments table
insert into api_tournament (id, "name", style, date_time, divisions, stream_link, hidden, league_id)
values (2, 'Seeding', 'doubleelim', CURRENTDATE, '{college}', STREAMLINK, True, 0);



-- Get the emails of winning teams
SELECT email from api_user left join api_team_users on api_team_users.user_id = api_user.id 
left join api_team on api_team_users.team_id = api_team.id
WHERE api_team."name" in ('wining', 'team', 'names');

 -- Lock in submissions for more advanced tournaments
UPDATE api_teamsubmission SET tour_intl_qual_id=last_1_id FROM api_team WHERE api_team.id=api_teamsubmission.team_id AND api_team.international AND api_team.student;