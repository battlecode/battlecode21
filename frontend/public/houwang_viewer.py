from tkinter import * 
from tkinter.ttk import *

print("Enter file path")
handle = open(input(),"r")

arr = []

boardSize = 16

dataCollectionStart = False

gameRawData = []

for line in handle:
    if dataCollectionStart:
        if line != "\n":
            line = line.strip("\n")
            gameRawData[-1].append([line[i:i+7] for i in range(0, len(line), 7)])
        else:
            gameRawData.append([])
    if not dataCollectionStart and line == "\n":
        dataCollectionStart = True
        gameRawData.append([])

processedData = []

for turn in gameRawData:
    processedData.append([])
    for row in range(len(turn)):
        arr = [0 for column in range(len(turn[row]))]
        for col in range(len(turn[row])):
            if "B" in turn[row][col]:
                arr[col] = 2
            if "W" in turn[row][col]:
                arr[col] = 1 
        processedData[-1].append(arr)

n = len(processedData[0])

#Gui

root = Tk()

labelArr = []

for r in range(n):
    labelArr.append([])
    for c in range(n):
        label = Label(root,text="     ",padding="10",relief=RAISED)
        label.grid(row=r,column=c)
        labelArr[-1].append(label)

#print(labelArr)

#print(len(processedData[0]))
#print(len(processedData[0][0]))

counter = -1


def refresh(event):
    global counter,processedData, labelArr, n
    print(counter)
    counter += 1
    if counter >= len(processedData):
        return
    for r in range(n):
        for c in range(n):
            target = processedData[counter][r][c]
            if target == 0:
                labelArr[r][c].configure(background="WHITE")
                target = "     "
            if target == 1:
                target = "  1  "
                labelArr[r][c].configure(background="BLUE")
            if target == 2:
                target = "  2  "
                labelArr[r][c].configure(background="RED")
            labelArr[r][c].configure(text=target)
    
    print("Refresh done")
    return

def refreshBack(event):
    global counter,processedData, labelArr, n
    counter = max(0,counter-1)
    print(counter)
    if counter >= len(processedData):
        return
    for r in range(n):
        for c in range(n):
            target = processedData[counter][r][c]
            if target == 0:
                labelArr[r][c].configure(background="WHITE")
                target = "     "
            if target == 1:
                target = "  1  "
                labelArr[r][c].configure(background="BLUE")
            if target == 2:
                target = "  2  "
                labelArr[r][c].configure(background="RED")
            labelArr[r][c].configure(text=target)
    print("Refresh done")
    return

root.bind('<Right>', refresh)
root.bind('<Left>', refreshBack)

root.mainloop()


    
