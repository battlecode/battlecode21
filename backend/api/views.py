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
from api.serializers import *
from api.permissions import *

from google.cloud import storage
from google.cloud import pubsub_v1
from google.oauth2 import service_account
import trueskill

import os, tempfile, datetime, argparse, time, json, random, binascii, threading

GCLOUD_PROJECT = "battlecode18" #not nessecary???
GCLOUD_SUB_BUCKET = "bc20-submissions"
GCLOUD_SUB_COMPILE_NAME  = 'bc20-compile'
GCLOUD_SUB_SCRIMMAGE_NAME = 'bc20-game'
GCLOUD_RES_BUCKET = "bc20-resumes"
SUBMISSION_FILENAME = lambda submission_id: f"{submission_id}/source.zip"
RESUME_FILENAME = lambda user_id: f"{user_id}/resume.pdf"

# pub sub commands (from pub.py)
def get_callback(api_future, data, ref):
    """Wrap message data in the context of the callback function."""
    def callback(api_future):
        try:
            print("Published message {} now has message ID {}".format(
                data, api_future.result()))
            ref["num_messages"] += 1
        except Exception:
            print("A problem occurred when publishing {}: {}\n".format(
                data, api_future.exception()))
            raise
    return callback

def pub(project_id, topic_name, data=""):
    """Publishes a message to a Pub/Sub topic."""

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

    # Data sent to Cloud Pub/Sub must be a bytestring.
    #data = b"examplefuncs"
    if data == "":
        data = b"sample pub/sub message"

    # Keep track of the number of published messages.
    ref = dict({"num_messages": 0})

    # When you publish a message, the client returns a future.
    api_future = client.publish(topic_path, data=data)
    api_future.add_done_callback(get_callback(api_future, data, ref))

    # Keep the main thread from exiting while the message future
    # gets resolved in the background.
    while api_future.running():
        time.sleep(0.5)
        # print("Published {} message(s).".format(ref["num_messages"]))

def scrimmage_pub_sub_call(red_submission_id, blue_submission_id, scrimmage_id, scrimmage_replay):
    print('attempting publication to scrimmage pub/sub')
    if red_submission_id is None and blue_submission_id is None:
        return Response({'message': 'Both teams\' submissions never compiled.'}, status.HTTP_400_BAD_REQUEST)
    if red_submission_id is None:
        return Response({'message': 'Red team\'s submission never compiled.'}, status.HTTP_400_BAD_REQUEST)
    if blue_submission_id is None:
        return Response({'message': 'Blue team\'s submission never compiled.'}, status.HTTP_400_BAD_REQUEST)
    scrimmage_server_data = {
        'gametype': 'scrimmage',
        'gameid': str(scrimmage_id),
        'player1': str(red_submission_id),
        'player2': str(blue_submission_id),
        'maps': ','.join(get_random_maps(3)),
        'replay': scrimmage_replay
    }
    data_bytestring = json.dumps(scrimmage_server_data).encode('utf-8')
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
        return blob.create_resumable_upload_session()

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
                if team.id in has_sub:
                    # The uniform random number prevents a sort from using a non-existent team comparator.
                    ratings.append((trueskill.Rating(mu=team.mu, sigma=team.sigma), random.uniform(0, 1), team))
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
            return Response({'matches': scrim_list}, status.HTTP_200_OK)
        else:
            return Response({'message': 'make this request from server account'}, status.HTTP_401_UNAUTHORIZED)

    def actually_generate_matches(self, request):
        scrimmage_list = self.scrimmage_list(request).data['matches']
        for scrim in scrimmage_list:
            team_1 = Team.objects.get(pk=scrim["player1"])
            team_2 = Team.objects.get(pk=scrim["player2"])
            sub_1 = TeamSubmission.objects.get(pk=team_1.id).last_1_id
            sub_2 = TeamSubmission.objects.get(pk=team_2.id).last_1_id
            scrimmage = {
                'league': 0,
                'red_team': team_1.name,
                'blue_team': team_2.name,
                'requested_by': team_1.id,
                'ranked': True,
                'replay': binascii.b2a_hex(os.urandom(15)).decode('utf-8'),
                'status': 'queued'
            }

            ScrimSerial = ScrimmageSerializer(data=scrimmage)
            if not ScrimSerial.is_valid():
                return Response(ScrimSerial.errors, status.HTTP_400_BAD_REQUEST)
            scrim = ScrimSerial.save()
            scrimmage_pub_sub_call(sub_1, sub_2, scrim.id, scrim.replay)

    @action(detail=False, methods=['post'])
    def generate_matches(self, request):
        is_admin = User.objects.all().get(username=request.user).is_superuser
        if is_admin:
            threading.Thread(target=self.actually_generate_matches, args=(request,)).start()
            return Response({'message': 'matches are being generated!'}, status.HTTP_202_ACCEPTED)
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
        # add entry to result array defining whether or not this team won and time of scrimmage
        for scrimmage in scrimmages:
            won_as_red = (scrimmage.status == 'redwon' and scrimmage.red_team_id == team_id)
            won_as_blue = (scrimmage.status == 'bluewon' and scrimmage.blue_team_id == team_id)
            team_mu = scrimmage.red_mu if scrimmage.red_team_id == team_id else scrimmage.blue_mu 
            return_data.append({'won': won_as_red or won_as_blue, 'date': scrimmage.updated_at, 'mu': team_mu})

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
        if team.users.count() == 4:
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
    permission_classes = (LeagueActiveOrSafeMethods, SubmissionsEnabledOrSafeMethods, IsAuthenticatedOnTeam, IsStaffOrGameReleased)

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

        serializer.save() #save it once, link will be undefined since we don't have anyway to know id
        serializer.save() #save again, link automatically set

        
        team_sub = TeamSubmission.objects.all().get(team=team)
        team_sub.compiling_id = Submission.objects.all().get(pk=serializer.data['id'])
        team_sub.save()

        team.sigma = 8.333
        team.score = team.mu - 3 * team.sigma
        team.save()

        upload_url = GCloudUploadDownload.signed_upload_url(SUBMISSION_FILENAME(serializer.data['id']), GCLOUD_SUB_BUCKET)

        # call to compile server
        print('attempting call to compile server')
        print('id:', serializer.data['id'])
        data = str(serializer.data['id'])
        data_bytestring = data.encode('utf-8')
        print(type(data_bytestring))
        pub(GCLOUD_PROJECT, GCLOUD_SUB_COMPILE_NAME, data_bytestring)

        return Response({'upload_url': upload_url}, status.HTTP_201_CREATED)


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


    @action(methods=['patch'], detail=True)
    def compilation_update(self, request, team, league_id, pk=None):
        is_admin = User.objects.all().get(username=request.user).is_superuser
        if is_admin:
            submission = self.get_queryset().get(pk=pk)
            if submission.compilation_status != 0 and submission.compilation_status != 3:
                return Response({'message': 'Response already received for this submission'}, status.HTTP_400_BAD_REQUEST)
            comp_status = int(request.data.get('compilation_status'))

            if comp_status is None:
                return Response({'message': 'Requires compilation status'}, status.HTTP_400_BAD_REQUEST)
            elif comp_status >= 1: #status provided in correct form
                submission.compilation_status = comp_status

                if comp_status == 1: #compilation failed
                    team_sub = TeamSubmission.objects.all().get(team=submission.team)
                    if submission.id != team_sub.compiling_id:
                        submission.save()
                        return Response({'message': 'Team replaced this submission with new submission'}, status.HTTP_200_OK)
                    team_sub.compiling_id = None
                    team_sub.last_3_id = team_sub.last_2_id
                    team_sub.last_2_id = team_sub.last_1_id
                    team_sub.last_1_id = submission
                    submission.compilation_status = 2

                    team_sub.save()

                submission.save()

                return Response({'message': 'Status updated'}, status.HTTP_200_OK)
            elif comp_status == 0: #trying to set to compiling
                return Response({'message': 'Cannot set status to compiling'}, status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': 'Unknown status. 0 = compiling, 1 = succeeded, 2 = failed'}, status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'message': 'Only superuser can update compilation status'}, status.HTTP_401_UNAUTHORIZED)


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
    permission_classes = (LeagueActiveOrSafeMethods, SubmissionsEnabledOrSafeMethods, IsAuthenticatedOnTeam, IsStaffOrGameReleased)

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

        try:
            team_data = self.get_queryset().get(pk=pk)
            comp_id = team_data.compiling_id
            if comp_id is not None:
                comp_status = self.get_submissions(pk).get(pk=comp_id).compilation_status
                return Response({'status': comp_status}, status.HTTP_200_OK)
            else:
                if team_data.last_1_id is not None:
                    # case where submission has been moved out of compilation cell
                    return Response({'status': '2'}, status.HTTP_200_OK)
                else:
                    return Response({'status': None}, status.HTTP_200_OK)
        except:
            # case where this team has no submission data stored
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
    permission_classes = (SubmissionsEnabledOrSafeMethods, IsAuthenticatedOnTeam, IsStaffOrGameReleased)

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
        return super().get_queryset().filter(Q(red_team=team) | Q(blue_team=team))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def create(self, request, league_id, team):
        try:
            red_team_id = int(request.data['red_team'])
            blue_team_id = int(request.data['blue_team'])
            if 'tour_id' in request.data:
                tour_id = request.data['tour_id'])
                if not tour_id is None:
                    tour_id = int(tour_id)
            # ranked = request.data['ranked'] == 'True'
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

            replay_string = binascii.b2a_hex(os.urandom(15)).decode('utf-8')
            data = {
                'league': league_id,
                'red_team': red_team.name,
                'blue_team': blue_team.name,
                'ranked': ranked,
                'requested_by': this_team.id,
                'replay': replay_string,
                'tournament_id': tour_id,
            }

            # Check auto accept
            if (ranked and that_team.auto_accept_ranked) or (not ranked and that_team.auto_accept_unranked):
                data['status'] = 'queued'

            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)
            scrimmage = serializer.save()

            # check the ID
            # if auto accept, then create scrimmage
            if (ranked and that_team.auto_accept_ranked) or (not ranked and that_team.auto_accept_unranked):
                red_submission_id = TeamSubmission.objects.get(pk=scrimmage.red_team_id).last_1_id
                blue_submission_id = TeamSubmission.objects.get(pk=scrimmage.blue_team_id).last_1_id
                scrimmage_pub_sub_call(red_submission_id, blue_submission_id, scrimmage.id, scrimmage.replay)

            return Response(serializer.data, status.HTTP_201_CREATED)
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
            
            scrimmage.status = 'queued'
            scrimmage.save()
            red_submission_id = TeamSubmission.objects.get(pk=scrimmage.red_team_id).last_1_id
            blue_submission_id = TeamSubmission.objects.get(pk=scrimmage.blue_team_id).last_1_id
            scrimmage_pub_sub_call(red_submission_id, blue_submission_id, scrimmage.id, scrimmage.replay)

            serializer = self.get_serializer(scrimmage)
            return Response(serializer.data, status.HTTP_200_OK)
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
                if sc_status == "redwon" or sc_status == "bluewon":
                    scrimmage.status = sc_status

                    # update rankings based on trueskill algoirthm
                    # get team info
                    rteam = self.get_team(league_id, scrimmage.red_team_id)
                    bteam = self.get_team(league_id, scrimmage.blue_team_id)
                    won = rteam if sc_status == "redwon" else bteam
                    lost = rteam if sc_status == "bluewon" else bteam
                        
                    if scrimmage.ranked: # TODO check if ranked
                        # store previous mu in scrimmage
                        scrimmage.blue_mu = bteam.mu
                        scrimmage.red_mu = rteam.mu

                        # get mu and sigma
                        muW = won.mu
                        sdW = won.sigma
                        muL = lost.mu
                        sdL = lost.sigma

                        winner = trueskill.Rating(mu=muW, sigma=sdW)
                        loser = trueskill.Rating(mu=muL, sigma=sdL)

                        # applies trueskill algorithm & update teams with new scores
                        wScore, lScore = trueskill.rate_1vs1(winner, loser)
                        won.mu = wScore.mu
                        won.sigma = wScore.sigma
                        lost.mu = lScore.mu
                        lost.sigma = lScore.sigma

                    # update wins and losses
                    won.wins = won.wins + 1
                    lost.losses = lost.losses + 1

                    won.save()
                    lost.save()

                    scrimmage.save()
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
    queryset = Tournament.objects.all().exclude(hidden=True)
    serializer_class = TournamentSerializer

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
