# Mass Emails

## MIT Systems

We're using mailman -- in particular, it handles unsubscribing for us.

### Creating a list

### Adding to a list

We use mmblanche for this. It's easiest to use it installed on Athena. SSH in, then run:
```
bash
add consult
mmblanche
```
to be able to use it. (`add consult` only works when running through bash, for some reason.)

Get a list of emails, and convert it to the format as specified by mmblanche's `-f` argument: one email per line. (For example, if you're working with a Google Form, you can get a Google Sheet of responses. Create a new tab -- **not** the tab where form responses are being collected!. Convert it into only one column of values such that all the values are emails -- strip out timestamps, header row, and the like. Then download this as a csv. If you'd like to export emails from our database, you can use a nice interface to download a table as a csv, and work with it.)

Move this file to your Athena locker; you can use `scp` for this (example [here](https://unix.stackexchange.com/questions/106480/how-to-copy-files-from-one-machine-to-another-using-ssh)).

Finally run mmblanche! For example, `mmblanche [mailman-list-name] -al [path/to/file]`. Likely you'll want to use `-addlist`, as it simply adds any emails in the file to the list, skips over duplicates for you, and doesn't delete anything otherwise.

### Sending to a list

If the set of emails you're trying to reach is continually growing (e.g. if you're messaging )

BCC EVERYTHING

## Sendgrid

(TODO dump some convos that I had w nate in Slack, as well as some messages that he sent in some channel.)
