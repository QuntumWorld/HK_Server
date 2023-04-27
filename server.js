const wireguard = require("./wireguard");
const kyber = require("./kyber512");
const net = require("net");
const AES_GCM = require("./AES_GCM");
const exec = require("child_process").exec;

let kyberClientPublicKey = "";
let SharedSecret = "";
let ClientWgPublicKey = "";



const ServerWireguardKeyPair = wireguard.wireguardKeypair.generateKeypair();
const ServerWgPublicKey = ServerWireguardKeyPair.publicKey;
const ServerWgPrivateKey = ServerWireguardKeyPair.privateKey;

const publickey_privatekey = kyber.KeyGen512();
const  ServerKyberPublicKey = publickey_privatekey[0];
const  privatekey = publickey_privatekey[1];


  


    const server = net.createServer(async (client) => {
      
      console.log('VPN client connected!');

      client.on('data', (data) => {
        if (data.length == 800) { // if the data length is 800 then it is the client kyber public key
          kyberClientPublicKey = data; // put the client kyber public key in the variable
          //console.log("length", data.length)
          //console.log("KyberPublicKeyfromClient \n", kyberClientPublicKey);
          client.write(Buffer.from(ServerKyberPublicKey)); // send the server kyber public key to the client
          [encapsulation_c, secret_key] = handleEncapsulation_and_SecretKey(kyberClientPublicKey); // generate the encapsulation and the shared secret
          SharedSecret = secret_key; //   put the shared secret in the variable
          //console.log("encapsulation_c length \n", Buffer.from(encapsulation_c).length);
          //console.log("encapsulation_c  \n", Buffer.from(encapsulation_c));
          client.write(Buffer.from(encapsulation_c)); // send the encapsulation to the client
          //console.log("SharedSecret", SharedSecret);
        } else if (data.length == 80) { // if the data length is 80 then it is the encrypted wg public key
          const [encrypted, iv, tag] = Bufferspliter(data);
          const encryptedServerWgPublicKey = AES_GCM.encryptAES_GCM(ServerWgPublicKey, SharedSecret); // encrypt the wg public key using the shared secret
          //console.log("ServerWgPublic key", ServerWgPublicKey, "\n type of iv", typeof (encryptedServerWgPublicKey.iv.length));
          const encryptedServerWgPublicKeytoSend = Buffer.concat([encryptedServerWgPublicKey.encrypted, Buffer.from("|:"),
          encryptedServerWgPublicKey.iv, Buffer.from("|:"),
          encryptedServerWgPublicKey.tag])//  put the encrypted data, iv and tag in one buffer
          //console.log("length ofencrypted WG PK using aes gcm and the shared Secret to send", encryptedServerWgPublicKeytoSend.length);
          //console.log("encrypted WG PK using aes gcm and the shared Secret to send", encryptedServerWgPublicKeytoSend);
          client.write(Buffer.from(encryptedServerWgPublicKeytoSend));
          console.time("config time server")
          ClientWgPublicKey = AES_GCM.decryptAES_GCM(encrypted, SharedSecret, iv, tag); // decrypt the wg public key using the shared secret
          //console.log("ClientWgPublicKey", ClientWgPublicKey);
          configureWireguardServer(ServerWgPrivateKey, '10.160.0.1/24', '52533', 'PqWg1', 'wlp2s0', ClientWgPublicKey)
          console.timeEnd("config time server")
          client.end();  // close the connection
        }

      });


    });

    server.listen(8080, () => {
      console.log('VPN server listening on port 8080!');
    });




function Bufferspliter(data) {

  const separator = Buffer.from("|:");
  const parts = [];
  let start = 0;
  for (let i = 0; i < data.length; i++) {
    if (data.slice(i, i + separator.length).equals(separator)) {
      parts.push(data.slice(start, i));
      start = i + separator.length;
    }
  }
  if (start < data.length) {
    parts.push(data.slice(start));
  }
  return parts;
}

function handleEncapsulation_and_SecretKey(PublicKey) {
  const C_SS = kyber.Encrypt512(Buffer.from(PublicKey));
  const encapsulation_c = C_SS[0];
  const secret_key = C_SS[1];
  return [encapsulation_c, secret_key];
}



function configureWireguardServer(serverWgPrivateKey, serverAddress, serverListenPort,
  serverWgInterface, serverConnectedInterface, ClientWgPublicKey) {
  // Check if WireGuard is installed
  exec('modprobe wireguard');

  // Set up the WireGuard interface
  const wgConfig = `
  [Interface]
  PrivateKey = ${serverWgPrivateKey} 
  Address = ${serverAddress}
  ListenPort = ${serverListenPort}
  PostUp = iptables -A FORWARD -i ${serverWgInterface} -j ACCEPT; iptables -t nat -A POSTROUTING -o ${serverConnectedInterface} -j MASQUERADE
  PostDown = iptables -D FORWARD -i ${serverWgInterface} -j ACCEPT; iptables -t nat -D POSTROUTING -o ${serverConnectedInterface}  -j MASQUERADE
  SaveConfig = true
  [Peer]
  PublicKey = ${ClientWgPublicKey}
  AllowedIPs = 0.0.0.0/0
  PersistentKeepalive= 25
`
  exec(`echo "${wgConfig}" | sudo tee /etc/wireguard/${serverWgInterface}.conf`);

  // Enable IP forwarding
  exec('sudo sed -i s/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/g /etc/sysctl.conf');
  exec('sudo sysctl -p');

  // Start the WireGuard interface
  exec(`sudo wg-quick up ${serverWgInterface}`);

  console.log(`WireGuard server configured on ${serverWgInterface}`);

  exec(`echo "${wgConfig}" | sudo tee /etc/wireguard/${serverWgInterface}.conf`);

  // Enable IP forwarding
  exec("sudo sed -i s/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/g /etc/sysctl.conf");
  exec("sudo sysctl -p");
  // Set up firewall rules
  /*
  exec(`sudo ufw allow ${serverListenPort}/udp`);
  exec("sudo ufw allow ssh");
  exec("sudo ufw allow http");
  exec("sudo ufw enable");
  */
  // Start the WireGuard interface
  exec(`sudo wg-quick up ${serverWgInterface}`);
  //console.log(`WireGuard server configured on ${serverWgInterface}`);

}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
