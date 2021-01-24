# Database and Eligibility columns

In our team table of the database are four columns: `high_school`, `international`, `mit`, and `student`. Unfortunately, these names don't actually mean what they may seem at first glance...

`high_school=True` means that the team is all high school students. (This should be a strict subset of `student` -- that is, `student` can not be false while `high_school` is true, unless someone filled something out wrong.)

`international=True` means that the team is **not [all (US students)]**. (i.e. at least one non-student and/or one int'l person.) The value of `international` is the boolean opposite of the "US students" checkbox in the frontend. **A team is full of international students if and only if `international=True` and `student=True`.**

`mit=True` means that the team is all **newbies**.

`student=True` means that the team is all full-time students.

(Changing the column names requires either server downtime or messy workarounds. Perhaps when the competition isn't active, it'd be a good idea to rethink what information we hold about a team, or what the columns are named.)