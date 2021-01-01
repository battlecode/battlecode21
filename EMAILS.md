# Mass Emails

# Athena

## Adding to a list

We use blanche for this. Documentation here: https://debathena.mit.edu/manpages/www/manpages/lucid/man1/blanche.1.html. The easiest way to use blanche is to use it pre-installed on Athena; you can try to install it yourself locally but it's pretty difficult.

Get a list of emails, and convert it to the format as specified by blanche's `-f` argument: one email per line. (For example, if you're working with a Google Form, you can get a Google Sheet of responses. Create a new tab -- **not** the tab where form responses are being collected!. Convert it into only one column of values such that all the values are emails -- strip out timestamps, header row, and the like. Then download this as a csv.)

Move this file to your Athena locker; you can use `scp` for this (example [here](https://unix.stackexchange.com/questions/106480/how-to-copy-files-from-one-machine-to-another-using-ssh)). 

Finally run blanche! For example, `blanche [webmoira-list-name] -addlist [path/to/file]`. Likely you'll want to use `-addlist`, as it simply adds any emails in the file to the list, skips over duplicates for you, and doesn't delete anything otherwise.

## Sending to a list

BCC EVERYTHING

# Sendgrid

(TODO dump some convos that I had w nate in Slack, as well as some messages that he sent in some channel.)
