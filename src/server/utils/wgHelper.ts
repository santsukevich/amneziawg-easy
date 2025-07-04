import { parseCidr } from 'cidr-tools';
import { stringifyIp } from 'ip-bigint';
import type { ClientType } from '#db/repositories/client/types';
import type { InterfaceType } from '#db/repositories/interface/types';
import type { UserConfigType } from '#db/repositories/userConfig/types';
import type { HooksType } from '#db/repositories/hooks/types';

export const wg = {
  generateServerPeer: (client: Omit<ClientType, 'createdAt' | 'updatedAt'>) => {
    const allowedIps = [
      `${client.ipv4Address}/32`,
      `${client.ipv6Address}/128`,
      ...(client.serverAllowedIps ?? []),
    ];

    const extraLines = [];
    if (client.serverEndpoint) {
      extraLines.push(`Endpoint = ${client.serverEndpoint}`);
    }

    return `# Client: ${client.name} (${client.id})
[Peer]
PublicKey = ${client.publicKey}
PresharedKey = ${client.preSharedKey}
AllowedIPs = ${allowedIps.join(', ')}${extraLines.length ? `\n${extraLines.join('\n')}` : ''}`;
  },

  generateServerInterface: (wgInterface: InterfaceType, hooks: HooksType) => {
    const cidr4 = parseCidr(wgInterface.ipv4Cidr);
    const cidr6 = parseCidr(wgInterface.ipv6Cidr);
    const ipv4Addr = stringifyIp({ number: cidr4.start + 1n, version: 4 });
    const ipv6Addr = stringifyIp({ number: cidr6.start + 1n, version: 6 });

    return `# Note: Do not edit this file directly.
# Your changes will be overwritten!

# Server
[Interface]
PrivateKey = ${wgInterface.privateKey}
Address = ${ipv4Addr}/${cidr4.prefix}, ${ipv6Addr}/${cidr6.prefix}
ListenPort = ${wgInterface.port}
MTU = ${wgInterface.mtu}
PreUp = ${iptablesTemplate(hooks.preUp, wgInterface)}
PostUp = ${iptablesTemplate(hooks.postUp, wgInterface)}
PreDown = ${iptablesTemplate(hooks.preDown, wgInterface)}
PostDown = ${iptablesTemplate(hooks.postDown, wgInterface)};
Jc = ${iptablesTemplate(hooks.jc, wgInterface)};
JMin = ${iptablesTemplate(hooks.jmin, wgInterface)};
JMax = ${iptablesTemplate(hooks.jmax, wgInterface)};
S1 = ${iptablesTemplate(hooks.s1, wgInterface)};
S2 = ${iptablesTemplate(hooks.s2, wgInterface)};
H1 = ${iptablesTemplate(hooks.h1, wgInterface)};
H2 = ${iptablesTemplate(hooks.h2, wgInterface)};
H3 = ${iptablesTemplate(hooks.h3, wgInterface)};
H4 = ${iptablesTemplate(hooks.h4, wgInterface)}`;  
  },

  generateClientConfig: (
    wgInterface: InterfaceType,
    userConfig: UserConfigType,
    client: ClientType
  ) => {
    const cidr4Block = parseCidr(wgInterface.ipv4Cidr).prefix;
    const cidr6Block = parseCidr(wgInterface.ipv6Cidr).prefix;

    const hookLines = [
      client.preUp ? `PreUp = ${client.preUp}` : null,
      client.postUp ? `PostUp = ${client.postUp}` : null,
      client.preDown ? `PreDown = ${client.preDown}` : null,
      client.postDown ? `PostDown = ${client.postDown}` : null,
	  client.jc ? `JC = ${client.jc}` : null,
	  client.jmin ? `JMin = ${client.jmin}` : null,
	  client.jmax ? `JMax = ${client.jmax}` : null,
	  client.s1 ? `S1 = ${client.s1}` : null,
	  client.s2 ? `S2 = ${client.s2}` : null,
	  client.h1 ? `H1 = ${client.h1}` : null,
	  client.h2 ? `H2 = ${client.h2}` : null,
	  client.h3 ? `H3 = ${client.h3}` : null,
	  client.h4 ? `H4 = ${client.h4}` : null,
    ].filter((v) => v !== null);

    return `[Interface]
PrivateKey = ${client.privateKey}
Address = ${client.ipv4Address}/${cidr4Block}, ${client.ipv6Address}/${cidr6Block}
DNS = ${(client.dns ?? userConfig.defaultDns).join(', ')}
MTU = ${client.mtu}
${hookLines.length ? `${hookLines.join('\n')}\n` : ''}
[Peer]
PublicKey = ${wgInterface.publicKey}
PresharedKey = ${client.preSharedKey}
AllowedIPs = ${(client.allowedIps ?? userConfig.defaultAllowedIps).join(', ')}
PersistentKeepalive = ${client.persistentKeepalive}
Endpoint = ${userConfig.host}:${userConfig.port}`;
  },

  generatePrivateKey: () => {
    return exec('wg genkey');
  },

  getPublicKey: (privateKey: string) => {
    return exec(`echo ${privateKey} | wg pubkey`, {
      log: 'echo ***hidden*** | wg pubkey',
    });
  },

  generatePreSharedKey: () => {
    return exec('wg genpsk');
  },

  up: (infName: string) => {
    return exec(`wg-quick up ${infName}`);
  },

  down: (infName: string) => {
    return exec(`wg-quick down ${infName}`);
  },

  restart: (infName: string) => {
    return exec(`wg-quick down ${infName}; wg-quick up ${infName}`);
  },

  sync: (infName: string) => {
    return exec(`wg syncconf ${infName} <(wg-quick strip ${infName})`);
  },

  dump: async (infName: string) => {
    const rawDump = await exec(`wg show ${infName} dump`, {
      log: false,
    });

    type wgDumpLine = [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];

    return rawDump
      .trim()
      .split('\n')
      .slice(1)
      .map((line) => {
        const splitLines = line.split('\t');
        const [
          publicKey,
          preSharedKey,
          endpoint,
          allowedIps,
          latestHandshakeAt,
          transferRx,
          transferTx,
          persistentKeepalive,
        ] = splitLines as wgDumpLine;

        return {
          publicKey,
          preSharedKey,
          endpoint: endpoint === '(none)' ? null : endpoint,
          allowedIps,
          latestHandshakeAt:
            latestHandshakeAt === '0'
              ? null
              : new Date(Number.parseInt(`${latestHandshakeAt}000`)),
          transferRx: Number.parseInt(transferRx),
          transferTx: Number.parseInt(transferTx),
          persistentKeepalive: persistentKeepalive,
        };
      });
  },
};
