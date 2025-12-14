ok hotspot is actually running rn that's a small win. but.

 
after running hotspot I did this commands. here's the output:

 
❯ iw dev wlan0 info
Interface wlan0
ifindex 3
wdev 0x2
addr 4c:82:a9:9b:bf:bf
ssid xsn_hotspot
type AP
wiphy 0
channel 6 (2437 MHz), width: 40 MHz, center1: 2447 MHz
txpower 3.00 dBm
multicast TXQ:
qsz-byt qsz-pkt flows drops marks overlmt hashcol tx-bytes tx-packets
0 0 19 0 0 0 02661 20
~
❯ ip a show wlan0
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 4c:82:a9:9b:bf:bf brd ff:ff:ff:ff:ff:ff
    inet 10.42.0.1/24 brd 10.42.0.255 scope global noprefixroute wlan0
       valid_lft forever preferred_lft forever
    inet6 fe80::ac96:aa8e:b0a2:8a89/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
~
❯ nmcli connection show xsn_hotspot | grep ipv4.addresses
ipv4.addresses:

 
I also whanted to test whether the connection is actually working so connected my phone to the hotspot and ran sveltekit frontend with this params:

 
❯ bun dev --host 10.42.0.1 --port 3000

 
output was the following:

 
  VITE v7.2.6 ready in 1248 ms
  ➜ Network: http://10.42.0.1:3000/
  ➜ press h + enter to show help

 
but I wasn't able to use this address http://10.42.0.1:3000/ to get access to my frontend neither using my phone or my machine running everything (hotpost itself and frontend + backend) I was only able to access it using localhost address when running front like this:

 
❯ bun dev --host 0.0.0.0 --port 3000
$ vite dev --host "0.0.0.0" --port "3000"
  VITE v7.2.6 ready in 1229 ms
  ➜ Local: http://localhost:3000/
  ➜ Network: http://10.42.0.1:3000/
  ➜ press h + enter to show help
[AUTH HOOK DEBUG] No refresh token found for /
[AUTH HOOK DEBUG] No refresh token found for /signin
[SIGNIN DEBUG] Loading signin page for unauthenticated user

 
as you can see there's logs that means frontend is accessable when I'm connecting to it using localhost address in browser

 
do u need any additional outputs to fix this?
