-- MAKE A BACKUP ON GCLOUD BEFORE RUNNING THIS
-- Change `tour_seed_id` to the current tournament
update api_teamsubmission set tour_seed_id = last_1_id;
