/*
Gets the list of teams consisting of only verified students,
with at least one submission, in order of scrimmage rank.
Useful for seeding tournaments which require only verified students.
*/

SELECT
  api_team.id, api_team.name, api_team.score
FROM
  api_team
INNER JOIN
  api_teamsubmission
ON
  api_team.id = api_teamsubmission.team_id
INNER JOIN
  api_team_users
ON
  api_team.id = api_team_users.team_id
INNER JOIN
  api_user
ON
  api_team_users.user_id = api_user.id
WHERE
  api_teamsubmission.last_1_id IS NOT NULL
  AND NOT api_team.staff_team
  AND NOT api_team.deleted
GROUP BY
  api_team.id
HAVING
  COUNT(api_user.id) = COUNT(CASE WHEN api_user.verified THEN 1 END)
ORDER BY
  api_team.score DESC;
