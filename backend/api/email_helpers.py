from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_email(recipient, subject, content, is_html):
    from_address = settings.EMAIL_HOST_USER
    message = Mail(from_email=from_address, to_emails=recipient, subject=subject, html_content=content)
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
    except Exception as e:
        print(str(e))
