groups = {0: [], 1: [], 2: [], 3: []}
top8 = []

for i in range(4):
    group = groups[i]
    with open('group{}-results-parsed.txt'.format(i+1)) as seeds:
        for line in seeds.readlines():
            team_pk, team_name, team_wins, num_played = line.split(',')
            # wins[team_pk] = int(team_wins)/int(num_played)
            if float(num_played) == 0:
                score = 0
            else:
                score = (int(team_wins)/float(num_played))
            group.append((score, team_pk.strip(), team_name.strip()))
    group.sort(reverse=True)
    top8.append(group[0])
    top8.append(group[1])
    top8.append(group[2])
    top8.append(group[3])

top8.sort(reverse=True)
with open('top8.txt', 'w') as g:
    for team in top8:
        g.write('{},{},{}\n'.format(team[1], team[2], str(team[0])))


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


