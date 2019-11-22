"""
What database fields are modifiable through the Django admin interface,
and how these fields appear in the UI.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import *


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Private', {'fields': ('date_of_birth', 'registration_key')}),
    )

@admin.register(Update)
class UpdateAdmin(admin.ModelAdmin):
    pass

@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'start_date', 'end_date', 'active')
    list_display_links = ('id', 'name')

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('id', 'league', 'name', 'style', 'date_time', 'divisions', 'hidden')
    list_display_links = ('id', 'name')
    list_filter = ('league',)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'league', 'name', 'divisions', 'mu', 'sigma', 'auto_accept_ranked', 'auto_accept_unranked', 'deleted')
    list_display_links = ('id', 'name')
    list_filter = ('league', 'divisions', 'deleted')


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'team_id', 'submitted_at', 'link', 'compilation_status')
    list_display_links = ('id', 'team_id')
    list_filter = ('id',)

@admin.register(TeamSubmission)
class TeamSubmissionAdmin(admin.ModelAdmin):
    list_display = ('team_id', 'compiling', 'last_1', 'last_2', 'last_3', 'tour_sprint', 'tour_seed', 'tour_qual', 'tour_final')
    list_display_links = ('team_id',)
    list_filter = ('team_id',)


@admin.register(Scrimmage)
class ScrimmageAdmin(admin.ModelAdmin):
    list_display = ('id', 'league', 'red_team', 'red_mu', 'blue_team', 'blue_mu', 'ranked', 'status',
        'requested_by', 'requested_at', 'started_at', 'updated_at')
    list_filter = ('league', 'red_team', 'blue_team')


@admin.register(TournamentScrimmage)
class TournamentScrimmageAdmin(admin.ModelAdmin):
    list_display = ('tournament', 'scrimmage', 'round', 'subround', 'index', 'hidden', 'winner_hidden')
    list_filter = ('tournament',)
