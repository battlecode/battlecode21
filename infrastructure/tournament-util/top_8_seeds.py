wins = {}
with open('seededresults.txt') as seeds:
    for line in seeds.readlines():
        team_pk, team_name, team_wins, num_played = line.split(',')
        wins[team_pk] = int(team_wins)/int(num_played)

groups = {0: [], 1: [], 2: [], 3: []}
for i in range(4):
    with open('group'+str(i+1)+'.txt') as f: #fill groups{} with tuples of win %, team pk, team name by group
        for line in f.readlines():
            team_pk, team_name = line.split(',')
            if team_pk in wins.keys():
                groups[i].append((wins[team_pk], team_pk.strip(), team_name.strip())) 
    with open('top8.txt', 'a+') as g: #write top two teams' team pk, team name of each group to output top8.txt
        groups[i].sort(reverse=True)
        g.write(groups[i][0][1] + ',' + groups[i][0][2] + '\n')
        g.write(groups[i][1][1] + ',' + groups[i][1][2] + '\n')


