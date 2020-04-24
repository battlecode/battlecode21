import random, sys


teams = {}
with open(sys.argv[1]) as pks, open(sys.argv[2]) as names:
    for pk, name in zip(pks, names):
        teams[pk.strip()] = name.strip()

keys = list(teams.keys())
random.shuffle(keys)
partitioned = [keys[i::4] for i in range(4)] #partitions list of team pks into 4 nearly-even groups, Format: list of lists

for i in range(4): #writes groups of teams to 4 separate files, each line is pk, name
    with open('group'+str(i+1)+'.txt', 'w') as f:
        for pk in partitioned[i]:
            f.write(pk+','+teams[pk]+'\n')
