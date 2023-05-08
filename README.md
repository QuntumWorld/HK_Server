# HK_Server 
is a Vpn server application that allows HK-Wireguard clients to securely connect to the server from anywhere in the world.


## Installation

To install HK Server on a Digital Ocean VPS droplet, follow these steps:

1. Update the package index: `sudo apt update`.
2. Install Node.js: `sudo apt-get install Node.js`.
3. Install npm: `sudo apt install npm`.
4. Check Node.js and npm versions: `node -v` and `npm -v`.
5. Install wireguard-tools: `sudo apt install wireguard-tools`.
6. Clone the HK_Server repository: `git clone https://github.com/QuntumWorld/HK_Server`.

## Configuration

Before starting the server, make sure to configure the firewall. Uncomment the following lines in the `server.js` file:
/*
exec(sudo ufw allow ${serverListenPort}/udp);
exec("sudo ufw allow ssh");
exec("sudo ufw allow http");
exec("sudo ufw enable");
*/

Install the required dependencies by running `npm i sha3`.

## Usage

Start the HK Server by running `sudo node server`. The server will start listening on port 8080. Connect to the server by configuring the WireGuard client on your local machine with the IP address of the droplet.

On the client side, start the HK Wireguard by running `npm start`.

On the server side, you should see the following message indicating that the VPN client is connected:

VPN client connected!
WireGuard server configured on PqWg1


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



