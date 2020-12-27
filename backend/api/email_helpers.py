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

# Middleware that sends an email on exceptions.
# https://docs.djangoproject.com/en/2.2/topics/http/middleware/
# https://simpleisbetterthancomplex.com/tutorial/2016/07/18/how-to-create-a-custom-django-middleware.html
class EmailMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        print("exception")
        return None
