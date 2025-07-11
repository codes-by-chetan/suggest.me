#!/urs/bin/python2.6
#
#modified by HaPPy_DAY , saltyone64@GMAIL.COM

import smtplib,time

mailserver = smtplib.SMTP('smtp.gmail.com')
mailserver.ehlo()
mailserver.starttls()
mailserver.ehlo()

username = input("Enter Email Address: ")
password = input("Enter Email Password: ")

print ('''
The available carriers are--> 
1.att
2.verizon
3.tmobile
4.sprintpcs
5.virginmobile  
6.uscellular
7.nextel
8.boost
9.alltell
''')

carrier = input("Enter Phone Carrier: ")
number = input("Enter Phone Number: ")
texttosend = input("Text to send: ")
timestosend = int(input("Times to send: "))


# You can change the carrier to suit you
if carrier == 1:
    sendto = number + '@text.att.net'
elif carrier == 2:
    sendto = number + '@vtext.com'
elif carrier == 3:
    sendto = number + '@tmomail.net'
elif carrier == 4:
    sendto = number + '@messaging.sprintpcs.com'
elif carrier == 5:
    sendto = number + '@vmobl.com'
elif carrier == 6:
    sendto = number + '@email.uscc.net'
elif carrier == 7:
    sendto = number + '@messaging.nextel.com'
elif carrier == 8:
    sendto = number + '@myboostmobile.com'
elif carrier == 9:
    sendto = number + '@message.alltel.com'
else:
    print("Carrier not supported. Sorry!")

#login to the sever with the username and password got

mailserver.login(username,password)


x = input("Press enter to launch.")

for x in range(0,timestosend):
   
    mailserver.sendmail(username, sendto, texttosend)
    print ("Sent.")
    time.sleep(3)# Delay for 3 second --->1 second not good 3 ok
print (timestosend," Text sent to " ,number, " successfully")
mailserver.close() # close connection to sever 

stopapp = input("Application finished. Press enter to close.")