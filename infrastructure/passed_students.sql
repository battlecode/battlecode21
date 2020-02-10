/*
Checks the given list of MIT students to determine who has passed the class.
Passing condition: win >= 8 scrims out of any consecutive 10 against Teh Devs.

Usage:
- In this script, update the list of MIT emails
- In this script, update the team ID of the reference player
- In this script, update the timestamp of when the reference player was uploaded
- Then run this query
*/

WITH
  mit_students(email)
AS (
  VALUES
    ('student1@mit.edu'),
    ('student2@mit.edu'),
    ('student3@mit.edu')
)
SELECT
  api_user.first_name,
  api_user.last_name,
  mit_students.email,
  collated_results.max_wins_out_of_10,
  (collated_results.max_wins_out_of_10 >= 8) AS passed
FROM
  api_user
INNER JOIN
  api_team_users
ON
  api_user.id = api_team_users.user_id
INNER JOIN (
  SELECT
    team_id,
    MAX(wins_out_of_10) AS max_wins_out_of_10
  FROM (
    SELECT
      (CASE WHEN s0 THEN 1 ELSE 0 END) +
        (CASE WHEN s1 THEN 1 ELSE 0 END) +
        (CASE WHEN s2 THEN 1 ELSE 0 END) +
        (CASE WHEN s3 THEN 1 ELSE 0 END) +
        (CASE WHEN s4 THEN 1 ELSE 0 END) +
        (CASE WHEN s5 THEN 1 ELSE 0 END) +
        (CASE WHEN s6 THEN 1 ELSE 0 END) +
        (CASE WHEN s7 THEN 1 ELSE 0 END) +
        (CASE WHEN s8 THEN 1 ELSE 0 END) +
        (CASE WHEN s9 THEN 1 ELSE 0 END) AS wins_out_of_10,
      team_id
    FROM (
      SELECT
        ((LAG(red_team_id, 0) OVER w = consts.ref_team_id AND LAG(status, 0) OVER w = 'bluewon') OR (LAG(blue_team_id, 0) OVER w = consts.ref_team_id AND LAG(status, 0) OVER w = 'redwon')) AS s0,
        ((LAG(red_team_id, 1) OVER w = consts.ref_team_id AND LAG(status, 1) OVER w = 'bluewon') OR (LAG(blue_team_id, 1) OVER w = consts.ref_team_id AND LAG(status, 1) OVER w = 'redwon')) AS s1,
        ((LAG(red_team_id, 2) OVER w = consts.ref_team_id AND LAG(status, 2) OVER w = 'bluewon') OR (LAG(blue_team_id, 2) OVER w = consts.ref_team_id AND LAG(status, 2) OVER w = 'redwon')) AS s2,
        ((LAG(red_team_id, 3) OVER w = consts.ref_team_id AND LAG(status, 3) OVER w = 'bluewon') OR (LAG(blue_team_id, 3) OVER w = consts.ref_team_id AND LAG(status, 3) OVER w = 'redwon')) AS s3,
        ((LAG(red_team_id, 4) OVER w = consts.ref_team_id AND LAG(status, 4) OVER w = 'bluewon') OR (LAG(blue_team_id, 4) OVER w = consts.ref_team_id AND LAG(status, 4) OVER w = 'redwon')) AS s4,
        ((LAG(red_team_id, 5) OVER w = consts.ref_team_id AND LAG(status, 5) OVER w = 'bluewon') OR (LAG(blue_team_id, 5) OVER w = consts.ref_team_id AND LAG(status, 5) OVER w = 'redwon')) AS s5,
        ((LAG(red_team_id, 6) OVER w = consts.ref_team_id AND LAG(status, 6) OVER w = 'bluewon') OR (LAG(blue_team_id, 6) OVER w = consts.ref_team_id AND LAG(status, 6) OVER w = 'redwon')) AS s6,
        ((LAG(red_team_id, 7) OVER w = consts.ref_team_id AND LAG(status, 7) OVER w = 'bluewon') OR (LAG(blue_team_id, 7) OVER w = consts.ref_team_id AND LAG(status, 7) OVER w = 'redwon')) AS s7,
        ((LAG(red_team_id, 8) OVER w = consts.ref_team_id AND LAG(status, 8) OVER w = 'bluewon') OR (LAG(blue_team_id, 8) OVER w = consts.ref_team_id AND LAG(status, 8) OVER w = 'redwon')) AS s8,
        ((LAG(red_team_id, 9) OVER w = consts.ref_team_id AND LAG(status, 9) OVER w = 'bluewon') OR (LAG(blue_team_id, 9) OVER w = consts.ref_team_id AND LAG(status, 9) OVER w = 'redwon')) AS s9,
        LAG(requested_at, 9) OVER w AS oldest_scrim,
        (CASE WHEN red_team_id = consts.ref_team_id THEN blue_team_id ELSE red_team_id END) AS team_id
      FROM
        api_scrimmage
      CROSS JOIN (
        VALUES (919)
      ) AS consts(ref_team_id)
      WHERE
        red_team_id = consts.ref_team_id OR blue_team_id = consts.ref_team_id
      WINDOW
        w
      AS (
        PARTITION BY (
          CASE WHEN red_team_id = consts.ref_team_id THEN blue_team_id ELSE red_team_id END
        )
        ORDER BY
          id
      )
    ) AS last_10
    CROSS JOIN (
      VALUES (CAST ('2020-01-17 16:57:35.785685+00' AS TIMESTAMP))
    ) AS consts(ref_timestamp)
    WHERE
      oldest_scrim >= consts.ref_timestamp
  ) AS result_dump
  GROUP BY
    team_id
) AS collated_results
ON
  collated_results.team_id = api_team_users.team_id
RIGHT JOIN
  mit_students
ON
  api_user.email = mit_students.email
ORDER BY
  api_user.last_name,
  mit_students.email;
