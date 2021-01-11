"""
The view that is returned in a request.
"""
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework import permissions, status, mixins, viewsets, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from api.serializers import *
from api.permissions import *


from google.cloud import storage
from google.cloud import pubsub_v1
from google.oauth2 import service_account

import os, tempfile, datetime, argparse, time, json, random, binascii, threading, math

GCLOUD_PROJECT = "battlecode18"
GCLOUD_SUB_BUCKET = "bc21-submissions"
GCLOUD_SUB_COMPILE_NAME  = 'bc21-compile'
GCLOUD_SUB_SCRIMMAGE_NAME = 'bc21-game'
GCLOUD_RES_BUCKET = "bc21-resumes"
SUBMISSION_FILENAME = lambda submission_id: f"{submission_id}/source.zip"
RESUME_FILENAME = lambda user_id: f"{user_id}/resume.pdf"

# NOTE: throughout our codebase, we sometimes refer to a pubsub as a "queue", adding a message to a pubsub as "queueing" something, etc. Technically this is not true: the pubsub gives no guarantee at all of a true queue or FIFO order. However, this detail of pubsub order is generally nonconsequential, and when it does matter, we have workarounds for non-FIFO-order cases.

# Some helper methods that don't belong in any one class,
# and shouldn't be directly callable through the api.

# Methods for publishing a message to a pubsub.
# Note that data must be a bytestring.
# Adapted from https://github.com/googleapis/python-pubsub/blob/master/samples/snippets/quickstart/pub.py
def pub(project_id, topic_name, data, num_retries=5):
    """Publishes a message to a Pub/Sub topic."""

    # Repeat while this fails, because the data is already in the
    # database. The pub/sub message needs to be enqueued to ensure the
    # request is complete.
    for i in range(num_retries):
        try:
            # Initialize a Publisher client.
            # credentials must be loaded from a file, so we temporarily create ibe 
            with open('gcloud-key.json', 'w') as outfile:
                outfile.write(settings.GOOGLE_APPLICATION_CREDENTIALS)
                outfile.close()
            credentials = service_account.Credentials. from_service_account_file('gcloud-key.json')
            client = pubsub_v1.PublisherClient(credentials=credentials)
            os.remove('gcloud-key.json') # important!!!

            # Create a fully qualified identifier in the form of
            # `projects/{project_id}/topics/{topic_name}`
            topic_path = client.topic_path(project_id, topic_name)

            # When you publish a message, the client returns a future.
            api_future = client.publish(topic_path, data)
            message_id = api_future.result()
        except:
            pass
        else:
            break

# TODO at some point, these two methods should be moved into the scrim class. 
# by not adding decorators, we can create a method which has no url -- essentially a private helper method.
# moving into scrim class would make more sense conceptually / for organization.
def create_scrimmage_helper(red_team_id, blue_team_id, ranked, requested_by, is_tour_match, tournament_id, accept, league, map_ids):
    # Don't use status as a var name, to avoid some http status enum
    scrim_status = 'created'
    # String used to associate to a replay file/link.
    # Sufficiently random, to ensure privacy (so that others can't guess the link and find a replay).
    replay = binascii.b2a_hex(os.urandom(15)).decode('utf-8')

    # get team submission ids and names, with careful attention to tour matches
    red_team_sub = TeamSubmission.objects.get(pk=red_team_id) 
    blue_team_sub = TeamSubmission.objects.get(pk=blue_team_id) 
    if is_tour_match:
        tour = Tournament.objects.get(pk=int(tournament_id))
        column_name = tour.teamsubmission_column_name
        red_submission_id = getattr(red_team_sub, column_name)
        blue_submission_id = getattr(blue_team_sub, column_name)
    else:
        red_submission_id = red_team_sub.last_1_id
        blue_submission_id = blue_team_sub.last_1_id
    red_team_name = Team.objects.get(pk=red_team_id).name
    blue_team_name = Team.objects.get(pk=blue_team_id).name

    # no need to set blue rating, red rating for ranked matches -- this is actually done when the outcome is set

    # if map_ids is not specified, use some default way to select maps.
    if map_ids is None:
        # By default, pick 3 random maps (requires specifying maps in settings.py).
        map_ids = ','.join(get_random_maps(3))

    # TODO we save red_team_id, etc by passing the red_team name to the serializer; the serializer queries the db, and find the corresponding team, and gets its team ID. This is really inefficient (since we already have IDs to start); also, if we have dupe team names, this query fails.
    # We should change this, although not sure how best. (Perhaps as easy as removing SlugRelatedFields in serializers, and then passing in IDs.)
    data = {
        'league': league,
        'red_team': red_team_name,
        'blue_team': blue_team_name,
        'red_submission_id': red_submission_id,
        'blue_submission_id': blue_submission_id,
        'ranked': ranked,
        'requested_by': requested_by,
        'tournament_id': tournament_id,
        'replay': replay,
        'map_ids': map_ids,
    }

    serializer = ScrimmageSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)
    scrimmage = serializer.save()

    # If applicable, immediately accept scrimmage, rather than wait for the other team to accept.
    if accept:
        result = accept_scrimmage_helper(scrimmage.id)
    else:
        scrimmage.status = 'pending'
        scrimmage.save()
        result = Response({'message': scrimmage.id}, status.HTTP_200_OK)
    return result

def accept_scrimmage_helper(scrimmage_id):
    scrimmage = Scrimmage.objects.get(pk=scrimmage_id)
    # put onto pubsub
    # TODO if called through create_scrimmage_helper, then a lot of these queries are performed twice in succession, once in each method. Could use optimization.
    # for example, pass data from create_scrimmage_helper into accept_scrimmage_helper, as an argument, and get your values from there.
    red_team_id = scrimmage.red_team.id
    blue_team_id = scrimmage.blue_team.id
    red_submission_id = scrimmage.red_submission_id
    blue_submission_id = scrimmage.blue_submission_id
    red_team_name = Team.objects.get(pk=red_team_id).name
    blue_team_name = Team.objects.get(pk=blue_team_id).name
    replay = scrimmage.replay
    map_ids = scrimmage.map_ids
    scrimmage_pub_sub_call(red_submission_id, blue_submission_id, red_team_name, blue_team_name, scrimmage.id, replay, map_ids)

    # save the scrimmage, again, to mark save
    if red_submission_id is None or blue_submission_id is None:
        scrimmage.status = 'error'
        scrimmage.error_msg = 'Make sure your team and the team you requested have a submission.'
    else:
        scrimmage.status = 'queued'
    scrimmage.save()

    return Response({'message': scrimmage.id}, status.HTTP_200_OK)

def scrimmage_pub_sub_call(red_submission_id, blue_submission_id, red_team_name, blue_team_name, scrimmage_id, scrimmage_replay, map_ids):

    if red_submission_id is None and blue_submission_id is None:
        return Response({'message': 'Both teams do not have a submission.'}, status.HTTP_400_BAD_REQUEST)
    if red_submission_id is None:
        return Response({'message': 'Red team does not have a submission.'}, status.HTTP_400_BAD_REQUEST)
    if blue_submission_id is None:
        return Response({'message': 'Blue team does not have a submission.'}, status.HTTP_400_BAD_REQUEST)
    # gametype is intended to always be scrimmage:
    # the infra uses gametype to figure out the url it should report results to, and we only have a set of urls for scrimmage.
    # TODO change gametype here to actually be meaningful, and in the infra, always send to url of 'scrimmage'
    scrimmage_server_data = {
        'gametype': 'scrimmage',
        'gameid': str(scrimmage_id),
        'player1': str(red_submission_id),
        'player2': str(blue_submission_id),
        'name1': str(red_team_name),
        'name2': str(blue_team_name),
        'maps': str(map_ids),
        'replay': scrimmage_replay
    }
    data_bytestring = json.dumps(scrimmage_server_data).encode('utf-8')
    # In testing, it's helpful to comment out the actual pubsub call, and print what would be added instead, so you can see it.
    # Make sure to revert this before pushing to master and deploying!
    # print(data_bytestring)
    pub(GCLOUD_PROJECT, GCLOUD_SUB_SCRIMMAGE_NAME, data_bytestring)

def get_random_maps(num):
    n = min(num, len(settings.SERVER_MAPS))
    return random.sample(settings.SERVER_MAPS, n)

class GCloudUploadDownload():
    """
    a class containing helper functions for creating signed urls for uploading and downloading
    files from our google cloud. Assumes that the credentials for gcloud service account are 
    stored in an env variable "GOOGLE_APPLICATION_CREDENTIALS"
    """

    @staticmethod
    def get_blob(file_path, bucket):
        """
        gets the blob (gcloud representation of file path) for the given file path inside bucket
        """
        with tempfile.NamedTemporaryFile() as temp:
            temp.write(settings.GOOGLE_APPLICATION_CREDENTIALS.encode('utf-8'))
            temp.flush()
            storage_client = storage.Client.from_service_account_json(temp.name)
            bucket = storage_client.get_bucket(bucket)
            blob = bucket.blob(file_path)
            return blob

    @staticmethod
    def signed_upload_url(file_path, bucket):
        """
        returns a pre-signed url for uploading the submission with given id to google cloud
        this URL can be used with a PUT request to upload data; no authentication needed.
        """

        blob = GCloudUploadDownload.get_blob(file_path, bucket)
        # Origin is necessary to prevent CORS errors later:
        # https://stackoverflow.com/questions/25688608/xmlhttprequest-cors-to-google-cloud-storage-only-working-in-preflight-request
        # https://stackoverflow.com/questions/46971451/cors-request-made-despite-error-in-console
        # https://googleapis.dev/python/storage/latest/blobs.html
        return blob.create_resumable_upload_session(origin=settings.THIS_URL)

    @staticmethod
    def signed_download_url(file_path, bucket):
        """
        returns a pre-signed url for downloading the zip of the submission from
        google cloud, this URL can be used with a GET request to dowload the file
        with no additional authentication needed.
        """

        blob = GCloudUploadDownload.get_blob(file_path, bucket)
        return blob.generate_signed_url(expiration=datetime.timedelta(hours=1), method='GET')


class SearchResultsPagination(PageNumberPagination):
    page_size = 10


class PartialUpdateModelMixin(mixins.UpdateModelMixin):
    def update(self, request, partial=False, league_id=None, pk=None):
        if request.method == 'PUT':
            return Response({}, status.HTTP_405_METHOD_NOT_ALLOWED)
        return super().update(request, partial=partial, pk=pk)


class UserViewSet(viewsets.GenericViewSet,
                  mixins.CreateModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin):
    """
    create:
    Creates a new user.

    retrieve:
    Returns a new user with the given username.

    update:
    Updates a user.

    partial_update:
    Partial updates a user.

    destroy:
    Destroys a user.
    """

    queryset = get_user_model().objects.all()
    serializer_class = FullUserSerializer
    permission_classes = (IsAuthenticatedAsRequestedUser,)

    @action(detail=True, methods=['get'])
    def resume_upload(self, request, pk=None):
        upload_url = GCloudUploadDownload.signed_upload_url(RESUME_FILENAME(pk), GCLOUD_RES_BUCKET)
        user = self.queryset.get(pk=pk)
        user.verified = True
        user.save()
        return Response({'upload_url': upload_url}, status.HTTP_200_OK)

class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:
    Returns a list of public user profiles.

    retrieve:
    Returns a public user profile given the username.
    """
    queryset = get_user_model().objects.all().order_by('id')
    serializer_class = BasicUserSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'username'
    lookup_url_kwarg = 'username'
    lookup_value_regex = '.*'

    filter_backends = (filters.SearchFilter,)
    search_fields = ('username',)
    pagination_class = SearchResultsPagination

class VerifyUserViewSet(viewsets.GenericViewSet):
    queryset = get_user_model().objects.all().order_by('id')
    permission_classes = (IsAuthenticatedAsRequestedUser,)
    serializer_class = VerifyUserSerializer

    @action(detail=True, methods=['post'])
    def verifyUser(self, request, pk=None):
        serializer = self.serializer_class(data=request.data)
        user = self.get_object()
        serializer.is_valid(raise_exception=True)
        gotten_key = serializer.validated_data['registration_key']
        if gotten_key == user.registration_key:
            user.verified = True
            user.save()
            return Response({'status': 'OK'})
        return Response({'status': 'Wrong Key'},
                status=status.HTTP_400_BAD_REQUEST)

class MatchmakingViewSet(viewsets.GenericViewSet):
    permission_classes = ()
    serializer_class = serializers.Serializer

    @action(detail=False, methods=['get'])
    def scrimmage_list(self, request):
        is_admin = User.objects.all().get(username=request.user).is_superuser
        if is_admin:
            teams = Team.objects.all()
            team_subs = TeamSubmission.objects.all()
            ratings = []
            has_sub = set()
            scrim_list = []

            for team_sub in team_subs:
                if team_sub.last_1_id is not None:
                    has_sub.add(team_sub.team_id)
            for team in teams:
                if team.id in has_sub and not team.deleted:
                    # The uniform random number prevents a sort from using a non-existent team comparator.
                    ratings.append((team.score, random.uniform(0, 1), team))
            ratings.sort()

            # Partition into blocks, and round robin in each block
            IDEAL_BLOCK_SIZE = 5
            block_sizes = [IDEAL_BLOCK_SIZE] * (len(ratings) // IDEAL_BLOCK_SIZE)
            num_blocks = len(block_sizes)
            for i in range(len(ratings) % IDEAL_BLOCK_SIZE):
                block_sizes[i % num_blocks] += 1
            random.shuffle(block_sizes)

            already_matched = 0
            for size in block_sizes:
                for i in range(size):
                    for j in range(i+1, size):
                        scrim_list.append({
                            "player1": ratings[already_matched+i][2].id,
                            "player2": ratings[already_matched+j][2].id
                        })
                already_matched += size

            # add some scatter
            # specifically, match team 1 with team 11, team 2 with team 12, etc
            # where the offset is randomly determined between 5 and 15
            scatter_step = random.randint(5,15)
            for i in range(len(ratings)-scatter_step):
                scrim_list.append({
                    "player1": ratings[i][2].id,
                    "player2": ratings[i+scatter_step][2].id
                })


            return Response({'matches': scrim_list}, status.HTTP_200_OK)
        else:
            return Response({'message': 'make this request from server account'}, status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'])
    def enqueue(self, request):
        user = User.objects.all().get(username=request.user)
        is_admin = user.is_superuser
        if is_admin:
            # TODO multiple accesses to request.data are annyoing; replace w setting to a stingle var, data
            match_type = request.data.get("type")
            if match_type == "scrimmage" or match_type == "tour_scrimmage":
                team_1_id = request.data.get("player1")
                team_2_id = request.data.get("player2")

                is_tour_match = (match_type == "tour_scrimmage")

                if is_tour_match:
                    # Tour matches are unranked.
                    ranked = False
                    tournament_id = int(request.data.get("tournament_id"))
                    # In a tour, we use specific maps for each round.
                    # Infra handles picking the maps, and sends it through the request.
                    map_ids = request.data.get("map_ids")
                else:
                    # For now regular matches created automatically are ranked; subjject to change.
                    ranked = True
                    # tournament_id of -1 indicates a normal scrimmage match (a non-tour match).
                    tournament_id = -1
                    # Use default map selection
                    map_ids = None
                
                # TODO admin_team has to be requeried every time. Easier to run this once (like as a setting, kinda).
                admin_team = Team.objects.get(users__username=user.username)
                requested_by = admin_team.id

                league = 0

                result = create_scrimmage_helper(team_1_id, team_2_id, ranked, requested_by, is_tour_match, tournament_id, True, league, map_ids)
                return result
            else:
                return Response({'message': 'unsupported match type'}, status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'message': 'make this request from server account'}, status.HTTP_401_UNAUTHORIZED)


class UserTeamViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:
    Returns a list of every team a specific user is on.

    retrieve:
    Returns the team the specific user in is on in the specific league.
    """
    serializer_class = BasicTeamSerializer
    permission_classes = (IsAuthenticatedOrSafeMethods,)
    lookup_field = 'league'

    def get_queryset(self):
        """
        Only teams the user is on are visible.
        """
        return Team.objects.filter(users__username=self.kwargs['username'])




class LeagueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:
    Returns a list of leagues, ordered by end date.

    retrieve:
    Returns a league from its id e.g. bc18.
    """
    queryset = League.objects.order_by('end_date')
    serializer_class = LeagueSerializer
    permission_classes = (permissions.AllowAny,)

class TeamViewSet(viewsets.GenericViewSet,
                  mixins.CreateModelMixin,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  PartialUpdateModelMixin):
    """
    create:
    Creates a team in this league, where the authenticated user is the first user to join the team.
    The user must not already be on a team in this league. The team must have a unique name, and can
    have a maximum of four members.

    Additionally, the league must be currently active to create a team.

    list:
    Returns a list of active teams in the league, ordered alphabetically by name.

    retrieve:
    Returns an active team in the league. Also gets the team key if the authenticated user is on this team.

    partial_update:
    Updates the team bio, divisions, or auto-accepting for ranked and unranked scrimmages.
    The authenticated user must be on the team, and the league must be active.

    join:
    Joins the team. The league must be active.
    Fails if the team has the maximum number of members, or if the team key is incorrect.

    leave:
    Leaves the team. The authenticated user must be on the team, and the league must be active.
    Deletes the team if this is the last user to leave the team.
    """
    model = Team
    serializer_class = TeamSerializer
    pagination_class = SearchResultsPagination
    permission_classes = (LeagueActiveOrSafeMethods, IsAuthenticatedOrSafeMethods)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    # NOTE: IF THE TEAM SEARCH IS EVER SLOW, REMOVE TEAM SEARCH BY USERNAME
    # it is nice to have it, but will certainly take more time to evaluate
    search_fields = ('name','users__username')
    ordering_fields = ('score','name')
    ordering = ('score','name')
    TEAM_SIZE = 4

    def get_queryset(self):
        """
        Only teams within the league are visible.
        """
        return Team.objects.all().exclude(deleted=True).filter(league_id=self.kwargs['league_id'])

    def list(self, request, *args, **kwargs):
        """
        If used, do one of the following:
            (1) Paginate.
            (2) Modify team serializer. Maybe something like https://www.peterbe.com/plog/efficient-m2m-django-rest-framework.
        """
        res = super().list(request)

        return res

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def create(self, request, league_id):
        name = request.data.get('name', None)
        if name is None:
            return Response({'message': 'Team name required'}, status.HTTP_400_BAD_REQUEST)

        if len(self.get_queryset().filter(users__username=request.user.username)) > 0:
            return Response({'message': 'Already on a team in this league'}, status.HTTP_400_BAD_REQUEST)
            
        if len(Team.objects.all().filter(name=name)) > 0:
            return Response({'message': 'Team with this name already exists'}, status.HTTP_400_BAD_REQUEST)

        try:
            team = {}
            team['league'] = league_id
            team['name'] = request.data.get('name', None)
            team['users'] = [request.user.username]

            serializer = self.get_serializer(data=team)
            if serializer.is_valid():
                serializer.save()

                team_data = {
                    'team': serializer.data['id'],
                    'compiling': None,
                    'last_1': None,
                    'last_2': None,
                    'last_3': None,
                    'tour_sprint': None,
                    'tour_seed': None,
                    'tour_qual': None,
                    'tour_final': None,
                    'tour_intl_qual': None,
                    'tour_newbie': None,
                    'tour_hs': None
                }

                TeamSerializer = TeamSubmissionSerializer(data=team_data)

                if not TeamSerializer.is_valid():
                    return Response(TeamSerializer.errors, status.HTTP_400_BAD_REQUEST)

                TeamSerializer.save()

                return Response(serializer.data, status.HTTP_201_CREATED)
            return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error = {'message': ','.join(e.args) if len(e.args) > 0 else 'Unknown Error'}
            return Response(error, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, league_id, pk=None):
        res = super().retrieve(request, pk=pk)
        if res.status_code == status.HTTP_200_OK and request.user.username in res.data.get('users'):
            res.data['team_key'] = self.get_queryset().get(pk=pk).team_key
        return res

    def partial_update(self, request, league_id, pk=None):
        try:
            team = self.get_queryset().get(pk=pk)
        except Team.DoesNotExist:
            return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

        if len(team.users.filter(username=request.user.username)) == 0:
            return Response({'message': 'User not on this team'}, status.HTTP_401_UNAUTHORIZED)

        return super().partial_update(request)

    @action(methods=['get'], detail=True)
    def ranking(self, request, league_id, pk=None):
        cur_place = 0
        num_same = 0
        latest_mu = None
        for team in Team.objects.order_by('-score'):
            cur_place += 1
            if team.score == latest_mu:
                num_same += 1
            else:
                num_same = 0
            latest_mu = team.score

            if team.id == int(pk):
                return Response({'ranking': cur_place-num_same}, status.HTTP_200_OK)

        return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

    @action(methods=['get'], detail=True)
    def history(self, request, league_id, pk=None):
        try:
            team_id = self.get_queryset().get(pk=pk).id
        except Team.DoesNotExist:
            return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

        scrimmages = Scrimmage.objects.filter(Q(blue_team_id=pk) | Q(red_team_id=pk))

        return_data = []

        # loop through all scrimmages involving this team
        # only add ranked, non-tournament scrimmages
        # add entry to result array defining whether or not this team won and time of scrimmage
        for scrimmage in scrimmages:
            if (scrimmage.ranked and scrimmage.tournament_id == -1):
                won_as_red = (scrimmage.status == 'redwon' and scrimmage.red_team_id == team_id)
                won_as_blue = (scrimmage.status == 'bluewon' and scrimmage.blue_team_id == team_id)
                team_mu = scrimmage.red_mu if scrimmage.red_team_id == team_id else scrimmage.blue_mu 
                return_data.append({'won': (won_as_red or won_as_blue) if (scrimmage.status == 'redwon' or scrimmage.status == 'bluewon') else None,
                                    'date': scrimmage.updated_at, 'mu': team_mu})

        return Response(return_data, status.HTTP_200_OK)

    @action(methods=['patch'], detail=True)
    def join(self, request, league_id, pk=None):
        try:
            team = self.get_queryset().get(pk=pk)
        except Team.DoesNotExist:
            return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

        if len(self.get_queryset().filter(users__username=request.user.username)) > 0:
            return Response({'message': 'Already on a team in this league'}, status.HTTP_400_BAD_REQUEST)
        if team.team_key != request.data.get('team_key', None):
            return Response({'message': 'Invalid team key'}, status.HTTP_400_BAD_REQUEST)
        if team.users.count() == self.TEAM_SIZE:
            return Response({'message': 'Team has max number of users'}, status.HTTP_400_BAD_REQUEST)
        team.users.add(request.user.id)
        team.save()

        serializer = self.get_serializer(team)
        return Response(serializer.data, status.HTTP_200_OK)

    @action(methods=['patch'], detail=True)
    def leave(self, request, league_id, pk=None):
        try:
            team = self.get_queryset().get(pk=pk)
        except Team.DoesNotExist:
            return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

        if len(team.users.filter(username=request.user.username)) == 0:
            return Response({'message': 'User not on this team'}, status.HTTP_401_UNAUTHORIZED)

        team.users.remove(request.user.id)
        team.deleted = team.users.count() == 0
        team.save()

        serializer = self.get_serializer(team)
        return Response(serializer.data, status.HTTP_200_OK)


class SubmissionViewSet(viewsets.GenericViewSet,
                  mixins.CreateModelMixin,
                  mixins.RetrieveModelMixin):
    """
    list:
    Returns a list of submissions for the authenticated user's team in this league, in chronological order.

    create:
    Uploads a submission for the authenticated user's team in this league. The file contents
    are uploaded to Google Cloud Storage in the format given by the SUBMISSION_FILENAME function
    The relative filename is stored in the database and routed through the website.

    The league must be active in order to accept submissions.

    retrieve:
    Returns a submission for the authenticated user's team in this league.

    latest:
    Returns the latest submission for the authenticated user's team in this league.
    """
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer
    permission_classes = (LeagueActiveOrSafeMethods, SubmissionsEnabledOrSafeMethodsOrIsSuperuser, IsAuthenticatedOnTeam, IsStaffOrGameReleased)

    def get_queryset(self):
        return super().get_queryset()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def create(self, request, team, league_id):
        data = {
            'team': team.id
        }

        serializer = self.get_serializer(data=data)

        if not serializer.is_valid():
            return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)

        # Note that IDs are needed to generate the link.
        serializer.save() #save it once, link will be undefined since we don't have any way to know id
        serializer.save() #save again, link automatically set

        submission = Submission.objects.all().get(pk=serializer.data['id'])
        team_sub = TeamSubmission.objects.all().get(team=team)
        # compiling_id holds id of last submission created for this team
        # (regardless of compilation status)
        team_sub.compiling_id = submission
        team_sub.save()

        # set ELO score to 1200
        # if there has not been any submission yet, then we should start at the start ELO
        if team_sub.last_1_id is None:
            team.score = settings.ELO_START
            team.save()

        upload_url = GCloudUploadDownload.signed_upload_url(SUBMISSION_FILENAME(serializer.data['id']), GCLOUD_SUB_BUCKET)

        return Response({'upload_url': upload_url, 'submission_id': submission.id}, status.HTTP_201_CREATED)


    def retrieve(self, request, team, league_id, pk=None):
        submission = self.get_queryset().get(pk=pk)

        if team != submission.team:
            return Response({'message': 'Not authenticated'}, status.HTTP_401_UNAUTHORIZED)

        return super().retrieve(request, pk=pk)

    @action(methods=['get'], detail=True)
    def retrieve_file(self, request, team, league_id, pk=None):
        submission = self.get_queryset().get(pk=pk)

        if team != submission.team:
            return Response({'message': 'Not authenticated'}, status.HTTP_401_UNAUTHORIZED)

        download_url = GCloudUploadDownload.signed_download_url(SUBMISSION_FILENAME(pk), GCLOUD_SUB_BUCKET)
        return Response({'download_url': download_url}, status.HTTP_200_OK)


    @action(methods=['patch', 'post'], detail=True)
    def compilation_pubsub_call(self, request, team, league_id, pk=None):
        # It is better if compile server gets requests for compiling submissions that are actually in buckets. 
        # So, only after an upload is done, the frontend calls this endpoint to give the compile server a request.

        # Only allow if superuser, or on the team of the submission
        # Also make sure that the admin is on a team! Otherwise you may get a 403.
        submission = self.get_queryset().get(pk=pk)
        is_admin = User.objects.all().get(username=request.user).is_superuser
        if not ((team == submission.team) or is_admin):
            return Response({'message': 'Not authenticated on the right team, nor is admin'}, status.HTTP_401_UNAUTHORIZED)
        
        # If a compilation has already succeeded, keep as so; no need to re-do.
        # (Might make sense to re-do for other submissions though, for example if messages are accidentally taken off the compilation pubsub queue.)
        if submission.compilation_status == settings.COMPILE_STATUS.SUCCESS:
            return Response({'message': 'Success response already received for this submission'}, status.HTTP_400_BAD_REQUEST)
        # Only allow the admin to re-queue submissions, to prevent submission spam.
        if (submission.compilation_status != settings.COMPILE_STATUS.PROGRESS) and (not is_admin):
            return Response({'message': 'Only admin can attempt to re-queue submissions'}, status.HTTP_400_BAD_REQUEST)

        # indicate submission being in a bucket
        submission.compilation_status = settings.COMPILE_STATUS.UPLOADED
        submission.save()

        id = submission.id
        # Notify compile server through pubsub queue.
        data = str(id)
        data_bytestring = data.encode('utf-8')
        pub(GCLOUD_PROJECT, GCLOUD_SUB_COMPILE_NAME, data_bytestring)

        # indicate submission being queued
        submission.compilation_status = settings.COMPILE_STATUS.QUEUED
        submission.save()

        return Response({'message': 'Status updated'}, status.HTTP_200_OK)

    @action(methods=['patch', 'post'], detail=True)
    def compilation_update(self, request, team, league_id, pk=None):
        is_admin = User.objects.all().get(username=request.user).is_superuser
        # Also make sure that the admin is on a team! Otherwise you may get a 403.
        if is_admin:
            submission = self.get_queryset().get(pk=pk)
            if submission.compilation_status == settings.COMPILE_STATUS.SUCCESS:
                # If a compilation has already succeeded, keep as so.
                # (Would make sense for failed / errored compiles to flip to successes upon retry, so allow for this)
                return Response({'message': 'Success response already received for this submission'}, status.HTTP_400_BAD_REQUEST)
            try: 
                new_comp_status = int(request.data.get('compilation_status'))
            except:
                return Response({'message': 'No status provided. 0 = compiling, 1 = succeeded, 2 = failed'}, status.HTTP_400_BAD_REQUEST)

            if new_comp_status is None:
                return Response({'message': 'Requires compilation status'}, status.HTTP_400_BAD_REQUEST)
            elif new_comp_status in (settings.COMPILE_STATUS.SUCCESS, settings.COMPILE_STATUS.FAIL, settings.COMPILE_STATUS.ERROR): #status provided in correct form
                submission.compilation_status = new_comp_status
                submission.save()

                if new_comp_status == settings.COMPILE_STATUS.SUCCESS: #compilation succeeded
                    team_sub = TeamSubmission.objects.all().get(team=submission.team)
                    # Only if this submission is newer than what's already been processed,
                    # update the submission history. 
                    # (to prevent reverting to older submissions that took longer to process)
                    # (The compile server should generally be processing submissions in the same order they were uploaded, anyways. But this check is still good in case of async conditions, re-queueing, etc)
                    if team_sub.last_1_id is None or submission.id > team_sub.last_1_id:
                        team_sub.last_3_id = team_sub.last_2_id
                        team_sub.last_2_id = team_sub.last_1_id
                        team_sub.last_1_id = submission
                        team_sub.save()

                return Response({'message': 'Status updated'}, status.HTTP_200_OK)
            elif new_comp_status == settings.COMPILE_STATUS.PROGRESS: # Trying to set to compilation in progress, which shouldn't be a valid result
                return Response({'message': 'Cannot set status to compiling'}, status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': 'Unknown status. 0 = compiling, 1 = succeeded, 2 = failed'}, status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'message': 'Only superuser can update compilation status'}, status.HTTP_401_UNAUTHORIZED)

    
    @action(methods=['get'], detail=True)
    def get_status(self, request, team, league_id, pk=None):
        submission = self.get_queryset().get(pk=pk)
        if team != submission.team:
            return Response({'message': 'Not authenticated'}, status.HTTP_401_UNAUTHORIZED)

        return Response({'compilation_status': submission.compilation_status}, status.HTTP_200_OK)


class TeamSubmissionViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin):
    """
    list:
    Returns a list of submissions for the authenticated user's team in this league, in chronological order.

    create:
    Uploads a submission for the authenticated user's team in this league. The file contents
    are uploaded to Google Cloud Storage in the format given by the SUBMISSION_FILENAME function
    The relative filename is stored in the database and routed through the website.

    The league must be active in order to accept submissions.

    retrieve:
    Returns a submission for the authenticated user's team in this league.

    latest:
    Returns the latest submission for the authenticated user's team in this league.
    """
    queryset = TeamSubmission.objects.all()
    serializer_class = TeamSubmissionSerializer
    permission_classes = (LeagueActiveOrSafeMethods, SubmissionsEnabledOrSafeMethodsOrIsSuperuser, IsAuthenticatedOnTeam, IsStaffOrGameReleased)

    def get_submissions(self, team_id):
        return Submission.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def retrieve(self, request, team, league_id, pk=None):
        if str(team.id) != pk:
            return Response({'message': 'Not authenticated'}, status.HTTP_401_UNAUTHORIZED)

        return super().retrieve(request, pk=pk)

    @action(methods=['get'], detail=True)
    def team_compilation_status(self, request, team, league_id, pk=None):
 
        if pk != str(team.id):
            return Response({'message': "Not authenticated"}, status.HTTP_401_UNAUTHORIZED)

        team_data = self.get_queryset().get(pk=pk)
        comp_id = team_data.compiling_id
        if comp_id is not None:
            comp_status = self.get_submissions(pk).get(pk=comp_id).compilation_status
            return Response({'status': comp_status}, status.HTTP_200_OK)
        else:
            return Response({'status': None}, status.HTTP_200_OK)


class ScrimmageViewSet(viewsets.GenericViewSet,
                       mixins.ListModelMixin,
                       mixins.CreateModelMixin,
                       mixins.RetrieveModelMixin):
    """
    list:
    Returns a list of scrimmages in the league, where the authenticated user is on one of the participating teams.
    The scrimmages are returned in descending order of the time of request.

    TODO: If the "tournament" parameter accepts a tournament ID to filter, otherwise lists non-tournament scrimmages.

    create:
    Creates a scrimmage in the league, where the authenticated user is on one of the participating teams.
    The map and each team must also be in the league. If the requested team auto accepts this scrimmage,
    then the scrimmage is automatically queued with each team's most recent submission.

    Each team in the scrimmage must have at least one submission.

    retrieve:
    Retrieves a scrimmage in the league, where the authenticated user is on one of the participating teams.

    accept:
    Accepts an incoming scrimmage in the league, where the authenticated user is on the participating team
    that did not request the scrimmage. Queues the game with each team's most recent submissions.

    reject:
    Rejects an incoming scrimmage in the league, where the authenticated user is on the participating team
    that did not request the scrimmage.

    cancel:
    Cancels an outgoing scrimmage in the league, where the authenticated user is on the participating team
    that requested the scrimmage.
    """
    queryset = Scrimmage.objects.all().order_by('-requested_at')
    serializer_class = ScrimmageSerializer
    permission_classes = (SubmissionsEnabledOrSafeMethodsOrIsSuperuser, IsAuthenticatedOnTeam, IsStaffOrGameReleased)

    def get_team(self, league_id, team_id):
        teams = Team.objects.filter(league_id=league_id, id=team_id)
        if len(teams) == 0:
            return None
        if len(teams) > 1:
            raise InternalError
        return teams[0]

    def get_submission(self, team_id):
        submissions = Submission.objects.all().filter(team_id=team_id).order_by('-submitted_at')
        if submissions.count() == 0:
            return None
        return submissions[0]

    def get_queryset(self):
        team = self.kwargs['team']
        return super().get_queryset().filter((Q(red_team=team) | Q(blue_team=team)) & Q(tournament_id=-1)) 

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def retrieve(self, request, league_id, team, pk=None):
        is_admin = User.objects.all().get(username=request.user).is_superuser
        queryset = self.get_queryset()
        if is_admin:
            queryset = Scrimmage.objects.all()
        scrimmage_queried = get_object_or_404(queryset, pk=pk)
        scrimmage_serializer = ScrimmageSerializer(scrimmage_queried, context=self.get_serializer_context())
        return Response(scrimmage_serializer.data)

    def create(self, request, league_id, team):
        try:
            red_team_id = int(request.data['red_team'])
            blue_team_id = int(request.data['blue_team'])
            # ranked = request.data['ranked'] == 'True'
            # Scrimmages created by regular challenges should not be ranked, to prevent ladder manipulation.
            ranked = False

            # Validate teams
            team = self.kwargs['team']
            if team.id == blue_team_id:
                red_team, blue_team = (self.get_team(league_id, red_team_id), team)
                this_team, that_team = (blue_team, red_team)
            elif team.id == red_team_id:
                red_team, blue_team = (team, self.get_team(league_id, blue_team_id))
                this_team, that_team = (red_team, blue_team)
            else:
                return Response({'message': 'Scrimmage does not include my team'}, status.HTTP_400_BAD_REQUEST)
            if that_team is None:
                return Response({'message': 'Requested team does not exist'}, status.HTTP_404_NOT_FOUND)

            requested_by = this_team.id
            is_tour_match = False
            # tournament_id of -1 indicates a normal scrimmage match (a non-tour match).
            tournament_id = -1

            # Check auto accept
            if (ranked and that_team.auto_accept_ranked) or (not ranked and that_team.auto_accept_unranked):
                accept = True
            else:
                accept = False

            # Use default map selection
            map_ids = None

            result = create_scrimmage_helper(red_team_id, blue_team_id, ranked, requested_by, is_tour_match, tournament_id, accept, league_id, map_ids)

            return result
        except Exception as e:
            error = {'message': ','.join(e.args) if len(e.args) > 0 else 'Unknown Error'}
            return Response(error, status.HTTP_400_BAD_REQUEST)

    @action(methods=['patch'], detail=True)
    def accept(self, request, league_id, team, pk=None):
        try:
            scrimmage = self.get_queryset().get(pk=pk)
            if scrimmage.requested_by == team and scrimmage.red_team.id != scrimmage.blue_team.id:
                return Response({'message': 'Cannot accept an outgoing scrimmage.'}, status.HTTP_400_BAD_REQUEST)
            if scrimmage.status != 'pending':
                return Response({'message': 'Scrimmage is not pending.'}, status.HTTP_400_BAD_REQUEST)
            
            result = accept_scrimmage_helper(scrimmage.id)
            return result
        except Scrimmage.DoesNotExist:
            return Response({'message': 'Scrimmage does not exist.'}, status.HTTP_404_NOT_FOUND)

    @action(methods=['patch'], detail=True)
    def reject(self, request, league_id, team, pk=None):
        try:
            scrimmage = self.get_queryset().get(pk=pk)
            if scrimmage.requested_by == team and scrimmage.red_team.id != scrimmage.blue_team.id:
                return Response({'message': 'Cannot reject an outgoing scrimmage.'}, status.HTTP_400_BAD_REQUEST)
            if scrimmage.status != 'pending':
                return Response({'message': 'Scrimmage is not pending.'}, status.HTTP_400_BAD_REQUEST)
            scrimmage.status = 'rejected'

            scrimmage.save()

            serializer = self.get_serializer(scrimmage)
            return Response(serializer.data, status.HTTP_200_OK)
        except Scrimmage.DoesNotExist:
            return Response({'message': 'Scrimmage does not exist.'}, status.HTTP_404_NOT_FOUND)

    @action(methods=['patch'], detail=True)
    def cancel(self, request, league_id, team, pk=None):
        try:
            scrimmage = self.get_queryset().get(pk=pk)
            if scrimmage.requested_by != team:
                return Response({'message': 'Cannot cancel an incoming scrimmage.'}, status.HTTP_400_BAD_REQUEST)
            if scrimmage.status != 'pending':
                return Response({'message': 'Scrimmage is not pending.'}, status.HTTP_400_BAD_REQUEST)
            scrimmage.status = 'cancelled'

            scrimmage.save()

            serializer = self.get_serializer(scrimmage)
            return Response(serializer.data, status.HTTP_200_OK)
        except Scrimmage.DoesNotExist:
            return Response({'message': 'Scrimmage does not exist.'}, status.HTTP_404_NOT_FOUND)

    @action(methods=['patch'], detail=True)
    def set_outcome(self, request, league_id, team, pk=None):
        is_admin = User.objects.all().get(username=request.user).is_superuser
        if is_admin:
            try:
                scrimmage = Scrimmage.objects.all().get(pk=pk)
            except:
                return Response({'message': 'Scrimmage does not exist.'}, status.HTTP_404_NOT_FOUND)

            if 'status' in request.data:
                sc_status = request.data['status']
                sc_error_msg = request.data['error_msg']
                if sc_status == "redwon" or sc_status == "bluewon":

                    if 'winscore' in request.data and 'losescore' in request.data:
                        sc_winscore = request.data['winscore']
                        sc_losescore = request.data['losescore']
                    else:
                        return Response({'message': 'Must include both winscore and losescore in request.'},
                                        status.HTTP_400_BAD_REQUEST)

                    if sc_winscore <= sc_losescore:
                        return Response({'message': 'Scores invalid. Winscore must be at least half of total games.'}, status.HTTP_400_BAD_REQUEST)
                    scrimmage.status = sc_status
                    scrimmage.winscore = sc_winscore
                    scrimmage.losescore = sc_losescore

                    # if tournament, then return here
                    if scrimmage.tournament_id != -1:
                        scrimmage.save()
                        return Response({'status': sc_status, 'winscore': sc_winscore, 'losescore': sc_losescore}, status.HTTP_200_OK)

                    # update rankings using elo
                    # get team info
                    rteam = self.get_team(league_id, scrimmage.red_team_id)
                    bteam = self.get_team(league_id, scrimmage.blue_team_id)
                    won = rteam if sc_status == "redwon" else bteam
                    lost = rteam if sc_status == "bluewon" else bteam
                        
                    if scrimmage.ranked: 
                        # store previous score in scrimmage. NOTE: fields are called blue_mu and red_mu but they actually represent score
                        scrimmage.blue_mu = bteam.score
                        scrimmage.red_mu = rteam.score

                        # ELO; see https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details
                        # get score
                        sW = won.score
                        sL = lost.score

                        probW = 1.0 * 1.0 / (1 + 1.0 * math.pow(10, 1.0 * (sL - sW) / 400))  # the probability that W would win
                        probL = 1 - probW   # the probability that L would win

                        # update W's score
                        won.score = won.score + settings.ELO_K * (1 - probW)
                        lost.score = lost.score + settings.ELO_K * (0 - probL)

                    # update wins and losses
                    won.wins = won.wins + 1
                    lost.losses = lost.losses + 1

                    won.save()
                    lost.save()

                    scrimmage.save()
                    return Response({'status': sc_status, 'winscore': sc_winscore, 'losescore': sc_losescore}, status.HTTP_200_OK)
                elif sc_status == "error":
                    scrimmage.status = sc_status
                    scrimmage.error_msg = sc_error_msg
                    scrimmage.save()
                    # Return 200, because the scrimmage runner should be informed that it successfully sent the error status to the backend
                    return Response({'status': sc_status}, status.HTTP_200_OK)
                else:
                    return Response({'message': 'Set scrimmage to pending/queued/cancelled with accept/reject/cancel api calls'}, status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': 'Status not specified.'}, status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'message': 'make this request from server account'}, status.HTTP_401_UNAUTHORIZED)

class TournamentViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.RetrieveModelMixin):
    model = Tournament
    queryset = Tournament.objects.all().exclude(hidden=True)
    serializer_class = TournamentSerializer
    permission_classes = (LeagueActiveOrSafeMethods, )
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    @action(methods=['get'], detail=True)
    def bracket(self):
        """
        Retrieves the bracket for a tournament in this league. Formatted as a list of rounds, where each round
        is a list of games, and each game consists of a list of at most 3 matches. Can be formatted either as a
        "replay" file for the client or for display on the "website". Defaults to "website" format.

        Formats:
         - "replay": Returns the minimum number of games to ensure the winning team has a majority of wins
            in the order each match was played i.e. 2 games if the team wins the first 2 games out of 3.
         - "website": Includes all 3 matches regardless of results. Does not return avatars or list of winner IDs.

        {
            "tournament": {...},
            "rounds": [{
                "round": "3A",
                "games": [{
                    "index": 0",
                    "red_team": {
                        "id": 1,
                        "name": "asdf",
                        "avatar": "avatar/1.gif"
                    },
                    "blue_team": {
                        "id": 2,
                        "name": "asdfasdfasf",
                        "avatar": "avatar/2.gif"
                    },
                    "replays": ["replay/1.bc18", "replay/2.bc18"],
                    "winner_ids": [2, 2],
                    "winner_id": 2
                }, {
                    "index": 1,
                    "red_team": {
                        "id": 3,
                        "name": "assdfdf",
                        "avatar": "avatar/3.jpg"
                    },
                    "blue_team": {
                        "id": 4,
                        "name": "asdfasdfasf",
                        "avatar": "avatar/4.png"
                    },
                    "replays": ["replay/3.bc18", "replay/4.bc18", "replay/5.bc18"],
                    "winner_ids": [3, 4, 4],
                    "winner_id": 4
                }]
            }]
        }
        """
        pass
