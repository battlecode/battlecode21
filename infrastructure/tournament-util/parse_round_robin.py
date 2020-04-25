# groups = {0: [], 1: [], 2: [], 3: []}
# top8 = []

import json

for i in range(4):
    print('start round {}'.format(i+1))

    teams = {}
    team_names = []

    # open groupN.txt
    with open('group{}.txt'.format(i+1), 'r') as f:
        for line in f.readlines():
            pk, name = line.split(',')
            team_names.append(name[:-1])

            if 'ä½' in name:
                print('is present')

            teams[name[:-1]] = {'pk':pk, 'wins':0, 'games':0}

    with open('group{}-results.json'.format(i+1)) as seeds:
        replays = json.load(seeds)
        
        for replay in replays:
            if replay == [None]:
                continue
            
            name1, name2, winner, replaynum = replay

            if name1 == 'ä½\xa0å¥½':
                name1 = '你好'
            if name2 == 'ä½\xa0å¥½':
                name2 = '你好'

            if name1 == 'â\xa0€':
                continue
                name1 = ' '
            if name2 == 'â\xa0€':
                continue
                name2 = ' '

            
            teams[name1]['games'] += 1
            teams[name2]['games'] += 1

            if winner == 1:
                winnerteam = name1
            else:
                winnerteam = name2
            
            teams[winnerteam]['wins'] += 1

    with open('group{}-results-parsed.txt'.format(i+1), 'w') as f:
        for name in teams.keys():
            team = teams[name]
            f.write('{},{},{},{}\n'.format( team['pk'], name, team['wins'], team['games'] ) )


# for i in range(4):
#     with open('group{}.txt'.format(str(i+1))) as f: #fill groups{} with tuples of win %, team pk, team name by group
#         for line in f.readlines():
#             team_pk, team_name = line.split(',')
#             if team_pk in wins.keys():
#                 groups[i].append((wins[team_pk], team_pk.strip(), team_name.strip())) 
#     with open('top8.txt', 'a+') as g: #write top two teams' team pk, team name, win pcntg (btwn 0-1) of each group to output top8.txt
#         groups[i].sort(reverse=True)
#         g.write(groups[i][0][1] + ',' + groups[i][0][2] + ',' + str(groups[i][0][0]) + '\n')
#         g.write(groups[i][1][1] + ',' + groups[i][1][2] + ',' + str(groups[i][1][0]) + '\n')


