
import os
import shlex
from csv import reader

os.chdir("C:\Users\kdd\Desktop\eetdeelkweek")
header=[]


with open('website.csv','rb') as csv_file:
    with open('updatemongo.bat','wb') as batfile:
        batfile.write('mongo ds013290.mlab.com:13290/eetdeelkweek -u eetdeelkweek -p transitiegent<commands.js\r\n')
        with open('commands.js','wb') as jsfile:
            jsfile.write('db.organisaties.remove({})\r\n')
            header=csv_file.readline().rstrip().replace(" ","").lower().split(",")
            for line in reader(csv_file):
                string={}
                for [head,item] in zip(header,line):
                    string[head]=item
                print string
                jsfile.write("db.organisaties.insert("+str(string)+")\r\n")
os.system('updatemongo.bat')