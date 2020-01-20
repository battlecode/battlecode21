-- MAKE A BACKUP ON GCLOUD BEFORE RUNNING THIS
-- Also run this in steps not as a file

-- 1: Set submissions_enabled to False in api_league
update api_league set submissions_enabled=FALSE;

-- 2: Change `tour_seed_id` to the current tournament
update api_teamsubmission set tour_seed_id = last_1_id;

-- 3: Add the tournament to the tournaments table
insert into api_tournament (id, "name", style, date_time, divisions, stream_link, hidden, league_id)
values (2, 'Seeding', 'doubleelim', CURRENTDATE, '{college}', STREAMLINK, True, 0);
