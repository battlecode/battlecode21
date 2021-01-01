# Mass Emails

## MIT Systems

We're using mailman -- in particular, it handles unsubscribing for us.

### Lists we maintain

We currently maintain the following lists on Mailman:
- `battlecode-interest-mm` is the general interest mailing list, linked to by the website homepage. This should be used for announcing new Battlecode contests.
- `battlecode-competitors-2020-mm` is an empty mailing list created by accident. It can be used for testing.
- `battlecode-competitors-2021-mm` contains all registered competitors of Battlecode 2021.

### Creating a list

1. Create a list at https://listmaker.mit.edu/lc/ and navigate to the admin page. You will receive an email containing the admin password.
1. Update the administrator to the Battlecode contact email (this is the publicly viewable list owner), and set yourself and others to be moderators.
   After doing this, you will need to re-authenticate (you're no longer the admin), using the password that was emailed to you.
1. Set list parameters. Below are some examples.
    - Description: MIT Battlecode 2021
    - Subject prefix: [battlecode-21]
    - Hide sender = Yes. All sent emails will appear to come from the list, not you.
    - Strip Reply-To header = Yes, explicit Reply-To = the battlecode address. This configures replies to not go back to the list.
    - In the privacy menu:
        - Only list admin should view subscription list.
        - In sender submenu, new members should be moderated. This prevents random subscribers from sending unmoderated mail.
        - In recipient submenu, ceiling should be zero. This allows us to send mail even if the subscription list is huge.

### Adding to a list

Before doing this, turn off welcome messages in the general menu (`send_welcome_msg`). This ensures we don't spam people when they're added.

We use mmblanche for this. It's easiest to use it installed on Athena. SSH in, then run:
```
bash  # if your default shell is not bash
add consult
mmblanche
```
to be able to use it. (`add consult` only works when running through bash, for some reason.)

Get a list of emails, and convert it to the format as specified by mmblanche's `-f` argument: one email per line. (For example, if you're working with a Google Form, you can get a Google Sheet of responses. Create a new tab -- **not** the tab where form responses are being collected!. Convert it into only one column of values such that all the values are emails -- strip out timestamps, header row, and the like. Then download this as a csv. If you'd like to export emails from our database, you can use a nice interface to download a table as a csv, and work with it.)

Move this file to your Athena locker; you can use `scp` for this (example [here](https://unix.stackexchange.com/questions/106480/how-to-copy-files-from-one-machine-to-another-using-ssh)).

Finally run mmblanche! For example, `mmblanche [mailman-list-name] -al [path/to/file]`. Likely you'll want to use `-al`, as it simply adds any emails in the file to the list, skips over duplicates for you, and doesn't delete anything otherwise.

You'll be prompted for the list admin password; find this somehow. You may wanna use the `-S` setting too, which will save admin passwords so you don't have to keep typing them.

### Sending to a list

If the set of emails you're trying to reach is continually growing (e.g. if you're messaging a large interest list through a  gsheet that a keeps growing), then you'll probably want to update the lists first. Follow the instructions in the above section.

Send mail to the list as you would normally.
- Ensure that you (yes, you specifically, not the Battlecode address) are a member of the list. Mark yourself as not-moderated in the Members list, or make sure you have a mod ready to release your email.
- Do not use Bcc. Bcc'd mail will be blocked by the list.
- Include trailing newlines. Mail without trailing newlines may show the message footer in the same line as your email signature.

## Sendgrid

(TODO dump some convos that I had w nate in Slack, as well as some messages that he sent in some channel.)
