#!/usr/bin/env python3

"""
This script updates challonge.
Run `./updatechallonge.py --help` for more info.
THIS SCRIPT ASSUMES THAT THERE ARE NEVER TWO TEAMS THAT ARE MATCHED TO EACH OTHER TWICE. This is
a faulty assumption. Use this script as inspiration for the future, but don't actually run it.
"""

import challonge
import time
import click
import dev_settings_sensitive

@click.group()
def cli():
    pass


GAMES_PER_MATCH = 5

#Configure your settings
challonge.set_credentials("mitbattlecode", dev_settings_sensitive.CHALLONGE_API_KEY)


@cli.command()
def list_tournaments():
    # uncommment this to get a new value for s
    tournaments = challonge.tournaments.index()
    for tournament in tournaments:
       print(tournament['name'], tournament['id'])




def load_tournament(s, tournament_str):

    inp = tournament_str + "replaysraw.txt"

    dd = {}

    ddw = {}

    checkforwinner = {}

    boN = GAMES_PER_MATCH

    # go through every line and parse it and download the replays
    # name the replays something informative
    redwins = 0
    counter = 0
    with open(inp, 'r') as f:
        for l in f.readlines():
            if counter % boN == 0:
                redwins = 0
            # create a filename
            counter += 1
            teams = l.split('|')[0].strip()
            mp = l.split('|')[1].strip().split(' ')[0].strip()
            idd = l.split('|')[1].strip().split(' ')[-1].strip()
            downloadlink = "https://2020.battlecode.org/replays/" + idd + ".bc20"
            fn = "sprint/" + "{:03d}".format(counter) + "______" + teams + "____" + mp + "____" + idd + ".bc20"
            displink = "https://2020.battlecode.org/visualizer.html?" + downloadlink
            ts = [x.strip() for x in teams.split('-vs-')]
            tt = "___".join(sorted([x.strip() for x in teams.split('-vs-')]))
            if tt not in dd:
                dd[tt] = [displink]
            else:
                dd[tt].append(displink)

            if counter % boN == 0 or (counter % boN) % 2 != 0:
                if 'redwon' in l:
                    redwins += 1
            else:
                if 'redwon' not in l:
                    redwins += 1

            if counter % boN == 0 and redwins >= boN//2+1:
                ddw[tt] = ts[0]
            else:
                ddw[tt] = ts[1]

    return dd, ddw
        




def lookupname(s, ps):
    return challonge.participants.show(str(s), ps)['name']

def findreplays(dd, t1, t2):
    tt = "___".join(sorted([t1.strip(), t2.strip()]))
    return dd[tt]




@cli.command()
@click.argument("tournament_id")
@click.argument("tournament_str")
def add_replays(tournament_id, tournament_str):
    dd, ddw = load_tournament(tournament_id, tournament_str)
    s = tournament_id
    r = challonge.matches.index(str(s))
    while True:
        r = challonge.matches.index(str(s))
        for d in r:
            if (d['state'] =='complete' and d['attachment_count'] is None):
                r = findreplays(dd, lookupname(s, d['player1_id']),lookupname(s, d['player2_id']))
                for rr in r:
                    myparams = {'url': rr}
                    challonge.match_attachments.create(str(s), d['id'], params=myparams)
                print('updated ')
                print(d)
        time.sleep(10)

@cli.command()
@click.argument("tournament_id")
@click.argument("tournament_str")
@click.option("--game-limit", help="The index of the first game not to release scores for.")
def update_results(tournament_id, tournament_str, game_limit):
    dd, ddw = load_tournament(tournament_id, tournament_str)
    s = tournament_id
    r = challonge.matches.index(str(s))
    for d in r:
        if (d['state'] == 'open' and d['suggested_play_order'] < game_limit):
            ts = [lookupname(s, d['player1_id']), lookupname(s, d['player2_id'])]
            tt = "___".join(sorted([ts[0].strip(), ts[1].strip()]))
            winner_id = ts.index(ddw[tt])
            ss = 'player' + str(winner_id+1) + '_id'
            fds = '1-0'
            if winner_id == 1:
                fds = '0-1'
            challonge.matches.update(str(s), d['id'], params={'winner_id': d[ss], 'scores_csv': fds})
            print(d)


if __name__ == '__main__':
    cli()