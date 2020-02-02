/*
Gets the list of teams with at least one submission, in order of scrimmage rank.
Useful for seeding tournaments such as Sprint.
*/

SELECT
  api_team.id, api_team.name, api_team.score
FROM
  api_team
INNER JOIN
  api_teamsubmission
ON
  api_team.id = api_teamsubmission.team_id
WHERE
  api_teamsubmission.last_1_id IS NOT NULL
  AND NOT api_team.staff_team
  AND NOT api_team.deleted
ORDER BY
  score DESC;
