"""
The database schema, and any events that may need to happen before,
during, or after saving objects in the database.
"""

import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres import fields
from django.core.mail import EmailMultiAlternatives
from django.db import models
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
# from django.urls import reverse
from django_rest_passwordreset.signals import reset_password_token_created
from api.email_helpers import send_email

HIGHSCHOOL = 'highschool'
NEWBIE     = 'newbie'
COLLEGE    = 'college'
PRO        = 'pro'


TOURNAMENT_DIVISION_CHOICES = (
    (HIGHSCHOOL, 'High School'),
    (NEWBIE, 'Newbie'),
    (COLLEGE, 'College'),
    (PRO, 'Pro'),
)

class User(AbstractUser):
    email            = models.EmailField(unique=True)
    username         = models.CharField(max_length=30, unique=True)
    first_name       = models.CharField(max_length=30)
    last_name        = models.CharField(max_length=150)
    date_of_birth    = models.DateField()
    registration_key = models.CharField(max_length=32, null=True, unique=True)
    verified         = models.BooleanField(default=False)

    bio      = models.CharField(max_length=1000, blank=True)
    avatar   = models.TextField(blank=True)
    country  = models.TextField(blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name', 'date_of_birth']


class League(models.Model):
    id                  = models.TextField(primary_key=True)
    name                = models.TextField()
    start_date          = models.DateField()
    end_date            = models.DateField()
    active              = models.BooleanField(default=False)
    submissions_enabled = models.BooleanField(default=False)
    game_released = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Update(models.Model):
    message = models.CharField(max_length=1000, blank=True)
    time = models.DateTimeField(auto_now_add=True)
    league = models.ForeignKey(League, related_name='updates', on_delete=models.PROTECT)


class Tournament(models.Model):
    TRUESKILL   = 'trueskill'
    SINGLE_ELIM = 'singleelim'
    DOUBLE_ELIM = 'doubleelim'

    TOURNAMENT_STYLE_CHOICES = (
        (TRUESKILL, 'TrueSkill'),
        (SINGLE_ELIM, 'Single Elimination'),
        (DOUBLE_ELIM, 'Double Elimination'),
    )

    league      = models.ForeignKey(League, on_delete=models.PROTECT)
    name        = models.TextField()
    style       = models.TextField(choices=TOURNAMENT_STYLE_CHOICES)
    date_time   = models.DateTimeField()
    # Allow for divisions to be anything.
    # This could be dangerous, but I don't think we use divsions in our code anywhere else.
    # divisions   = fields.ArrayField(models.TextField(choices=TOURNAMENT_DIVISION_CHOICES), blank=True, default=list)
    divisions   = models.TextField(blank=True)
    stream_link = models.TextField(blank=True)
    hidden      = models.BooleanField(default=True)
    bracket_link = models.TextField(blank=True)
    blurb       = models.TextField(blank=True)
    teamsubmission_column_name = models.TextField(default='tour_sprint_id')

    def __str__(self):
        return '{}: {} {}'.format(self.league, self.name, self.date_time)


class Team(models.Model):
    league    = models.ForeignKey(League, on_delete=models.PROTECT)
    name      = models.CharField(max_length=64)
    team_key  = models.CharField(max_length=16, unique=True)
    avatar    = models.TextField(blank=True)
    users     = models.ManyToManyField(User, default=list)
    staff_team = models.BooleanField(default=False)
    # team profile
    bio       = models.CharField(max_length=1000, blank=True)
    divisions = fields.ArrayField(models.TextField(choices=TOURNAMENT_DIVISION_CHOICES), default=list)

    # scrimmages
    mu                   = models.FloatField(default=25)
    sigma                = models.FloatField(default=8.333)
    score                = models.FloatField(default=settings.ELO_NULL)
    auto_accept_ranked   = models.BooleanField(default=True)
    auto_accept_unranked = models.BooleanField(default=True)
    wins                 = models.IntegerField(default=0)
    losses               = models.IntegerField(default=0)
    draws                = models.IntegerField(default=0)
    
    #eligibility
    # NOTE -- these columns are unfortunately poorly named.
    # If you want to work with them, see backend/docs/ELIGIBILITY.md!
    student = models.BooleanField(default=False)
    mit = models.BooleanField(default=False)
    high_school = models.BooleanField(default=False)
    international = models.BooleanField(default=True)

    # metadata
    deleted = models.BooleanField(default=False)

    # which users are verified
    @property
    def verified_users(self):
        return [user for user in self.users.all() if user.verified]

    def __str__(self):
        return '{}: (#{}) {}'.format(self.league, self.id, self.name)


# Old submission table
# class Submission(models.Model):
#     team         = models.ForeignKey(Team, on_delete=models.PROTECT)
#     name         = models.CharField(max_length=150)
#     filename     = models.TextField(null=True, default=None)
#     submitted_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return '{}: (#{}) {}'.format(self.team, self.id, self.name)

class Submission(models.Model):
    """
    Submission table stores every submission made
    idea is that this will be slow to look through, so we can quickly get the submissions
    stored in the team_submission table, but reserve possibility to get data for all the
    submissions the team has ever made
    """
    #submission_id        = models.CharField(primary_key=True, max_length=20)
    team                 = models.ForeignKey(Team, null=True, on_delete=models.PROTECT, related_name="team_id_sub")
    submitted_at         = models.DateTimeField(auto_now_add=True)
    link                 = models.TextField(null=True)
    compilation_status   = models.IntegerField(default=0) #0 = in progress, 1 = succeeded, 2 = failed, 3 = server failed
    error_msg            = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.id is not None:
            SUBMISSION_FILENAME = lambda submission_id: f"{submission_id}/source.zip"
            self.link = SUBMISSION_FILENAME(self.id)
        super().save(*args, **kwargs)

    def __str__(self):
        return '{}: {}'.format(self.id, self.team)

class TeamSubmission(models.Model):
    """
    Team submissions table stores submission ids of select submissions 
    with team_ids as pks
    storing past n submissions where n = 3, and submissions to the four tournaments
    submissions are first placed in compiling until they are succesfully compiled
    """
    team        = models.OneToOneField(Team, on_delete=models.PROTECT, primary_key=True, related_name="team_id")
    compiling   = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="compiling")
    last_1      = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="last_1")
    last_2      = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="last_2")
    last_3      = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="last_3")
    tour_sprint = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="tour_sprint")
    tour_seed   = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="tour_seed")
    tour_qual   = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="tour_qual")
    tour_intl_qual   = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="tour_intl_qual")
    tour_final  = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="tour_final")
    tour_hs  = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="tour_hs")
    tour_newbie  = models.ForeignKey(Submission, on_delete=models.PROTECT, blank=True, null=True, related_name="tour_newbie")

    def __str__(self):
        return '{}: {}'.format(self.team, self.last_1)


class Scrimmage(models.Model):
    SCRIMMAGE_STATUS_CHOICES = (
        ('created', 'Created'),
        ('pending', 'Pending'),
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('redwon', 'Red Won!'),
        ('bluewon', 'Blue Won!'),
        ('rejected', 'Rejected'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )

    # Match-running (completed by requester)
    league    = models.ForeignKey(League, on_delete=models.PROTECT)
    red_team  = models.ForeignKey(Team, null=True, on_delete=models.PROTECT, related_name='red_team')
    blue_team = models.ForeignKey(Team, null=True, on_delete=models.PROTECT, related_name='blue_team')
    ranked    = models.BooleanField(default=False)
    map_ids    = models.TextField(null=True)


    # Match-running (completed by match runner)
    status    = models.TextField(choices=SCRIMMAGE_STATUS_CHOICES, default='created')
    error_msg = models.TextField(null=True, blank=True)
    winscore  = models.IntegerField(null=True)
    losescore = models.IntegerField(null=True)
    replay    = models.TextField(blank=True)

    # Metadata
    red_mu       = models.IntegerField(null=True)
    blue_mu      = models.IntegerField(null=True)
    red_submission_id  = models.IntegerField(null=True)
    blue_submission_id = models.IntegerField(null=True)
    requested_by = models.ForeignKey(Team, null=True, on_delete=models.PROTECT, related_name='requested_by')
    requested_at = models.DateTimeField(auto_now_add=True)
    started_at   = models.DateTimeField(null=True)
    updated_at   = models.DateTimeField(auto_now=True)
    tournament_id = models.IntegerField(null=True)

    def __str__(self):
        return '{}: (#{}) {} vs {}'.format(self.league, self.id, self.red_team, self.blue_team)


class TournamentScrimmage(models.Model):
    tournament    = models.ForeignKey(Tournament, on_delete=models.PROTECT)
    scrimmage     = models.OneToOneField(Scrimmage, on_delete=models.PROTECT)
    round         = models.IntegerField(null=True)
    subround      = models.CharField(max_length=1, null=True)
    index         = models.IntegerField(null=True)
    red_from      = models.ForeignKey('self', null=True, default=None, on_delete=models.SET_DEFAULT, related_name='+')
    blue_from     = models.ForeignKey('self', null=True, default=None, on_delete=models.SET_DEFAULT, related_name='+')
    hidden        = models.BooleanField(default=True)
    winner_hidden = models.BooleanField(default=True)

    def __str__(self):
        return '{}: (#{}) {} vs {} Round {}{} Game {}'.format(
            self.tournament, self.id, self.red_team, self.blue_team, self.round, self.subround, self.index)


@receiver(pre_save, sender=settings.AUTH_USER_MODEL)
def gen_registration_key(sender, instance, raw, update_fields, **kwargs):
    """
    Generate a new registration key for the user.
    """
    if not raw and instance._state.adding:
        instance.registration_key = uuid.uuid4().hex
        email = instance.email
        context = {
            'username': instance.username,
            'verification_key': instance.registration_key,
            'url': settings.THIS_URL + '/verify/' +
            instance.registration_key
        }
        content = render_to_string('email/verification.html', context)
        # Unused, would be helpful for email verification if/when we work on that.
        # send_email(email, 'Email Verification', content, True)
        # try:
        #     send_email(email, 'Email Verification', content, True)
        # except:
        #     import sys
        #     print(sys.exc_info()[0])



@receiver(pre_save, sender=Team)
def gen_team_key(sender, instance, raw, update_fields, **kwargs):
    """
    Generate a new team key.
    """
    if not raw and instance._state.adding:
        instance.team_key = uuid.uuid4().hex[:16]

# @receiver(post_save, sender=Submission)
# def gen_filename(sender, instance, created, **kwargs):
#     """
#     Saves the filename in the format "/league_id/team_id/submission_id.zip".
#     """
#     if created:
#         league_id = instance.team.league.id
#         team_id = instance.team.id
#         filename = '/{}/{}/{}.zip'.format(league_id, team_id, instance.id)
#         instance.filename = filename
#         instance.save()


@receiver(reset_password_token_created)
def password_reset_token_created(sender, reset_password_token, *args, **kwargs):
    """
    Handles password reset tokens
    When a token is created, an e-mail needs to be sent to the user
    :param sender:
    :param reset_password_token:
    :param args:
    :param kwargs:
    :return:
    """
    # send an e-mail to the user
    email = reset_password_token.user.email
    context = {
        'username': reset_password_token.user.username,
        'reset_password_url':
        settings.THIS_URL + "/password_change?token={}"
        .format(reset_password_token.key)
    }
    content = render_to_string('email/password_reset.html', context)
    send_email(email, 'Password Reset Token', content, True)
    