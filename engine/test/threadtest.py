import threader
import threading
from time import sleep
import sys

class AThread(threading.Thread):
	def __init__(self):
		threading.Thread.__init__(self)
		self.stopped = False

	def run(self):
		while True:
			print("I'm running...and I'll never end!")
			sleep(1)

	def is_alive(self):
		return not self.stopped

	def end(self):
		if self.is_alive():
			threader.killThread(self.ident)
			self.stopped = True

runMe = AThread()
runMe.start()
sleep(5)
runMe.end()

print('hey')